import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Save, StickyNote, Bold, Italic, Underline, List, ListOrdered } from "lucide-react";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const USER_ID = 1; // Hardcoded for now

interface MonthlyNote {
    id: number;
    userId: number;
    year: number;
    month: number;
    notes: string | null;
}

export default function Notes() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [noteContent, setNoteContent] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const editorRef = useRef<HTMLDivElement>(null);

    // Derived state for year/month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-indexed for API

    // Fetch note for selected month
    const { data: notesList = [], isLoading } = useQuery<MonthlyNote[]>({
        queryKey: ["monthlyNotes", year, month],
        queryFn: async () => {
            const res = await fetch(
                `/api/monthly-notes?userId=${USER_ID}&year=${year}&month=${month}`
            );
            if (!res.ok) throw new Error("Failed to fetch notes");
            return res.json();
        },
    });

    const currentNote = notesList[0]; // Should only be one per month/user

    // Update local state and editor content when data loads
    useEffect(() => {
        const content = currentNote?.notes || "";
        setNoteContent(content);
        if (editorRef.current && editorRef.current.innerHTML !== content) {
            editorRef.current.innerHTML = content;
        }
    }, [currentNote]);

    // Update editor content when switching date
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== noteContent) {
            editorRef.current.innerHTML = noteContent;
        }
    }, [currentDate]);

    // Mutation to save/update note
    const saveNoteMutation = useMutation({
        mutationFn: async (content: string) => {
            const cleanContent = content === "<br>" ? "" : content; // Handle empty editor artifacts
            if (currentNote) {
                // Update existing
                const res = await fetch(`/api/monthly-notes/${currentNote.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ notes: cleanContent }),
                });
                if (!res.ok) throw new Error("Failed to update note");
                return res.json();
            } else {
                // Create new
                const res = await fetch(`/api/monthly-notes`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: USER_ID,
                        year,
                        month,
                        notes: cleanContent,
                    }),
                });
                if (!res.ok) throw new Error("Failed to create note");
                return res.json();
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["monthlyNotes"] });
            toast({
                title: "Success",
                description: "Note saved successfully",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to save note",
                variant: "destructive",
            });
        },
    });

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
    };

    const handleSave = () => {
        // Use the actual innerHTML from the editor ref
        const content = editorRef.current?.innerHTML || "";
        saveNoteMutation.mutate(content);
    };

    const execCommand = (command: string) => {
        document.execCommand(command, false);
        editorRef.current?.focus();
    };

    const monthName = currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

    const handleInput = () => {
        if (editorRef.current) {
            setNoteContent(editorRef.current.innerHTML);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                            <StickyNote className="w-8 h-8 text-primary" />
                            Monthly Notes
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Keep track of your thoughts, plans, or summaries for each month.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-lg border border-border">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePrevMonth}
                            className="hover:bg-background"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <span className="font-semibold min-w-[140px] text-center text-lg">
                            {monthName}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNextMonth}
                            className="hover:bg-background"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Editor Area */}
                <Card className="min-h-[500px] flex flex-col p-6 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-1 mb-4 pb-4 border-b border-border">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => execCommand('bold')}
                            className="p-2 h-8 w-8"
                            title="Bold"
                        >
                            <Bold className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => execCommand('italic')}
                            className="p-2 h-8 w-8"
                            title="Italic"
                        >
                            <Italic className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => execCommand('underline')}
                            className="p-2 h-8 w-8"
                            title="Underline"
                        >
                            <Underline className="w-4 h-4" />
                        </Button>
                        <div className="w-[1px] h-4 bg-border mx-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => execCommand('insertUnorderedList')}
                            className="p-2 h-8 w-8"
                            title="Bullet List"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => execCommand('insertOrderedList')}
                            className="p-2 h-8 w-8"
                            title="Numbered List"
                        >
                            <ListOrdered className="w-4 h-4" />
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            Loading note...
                        </div>
                    ) : (
                        <>
                            <div
                                ref={editorRef}
                                contentEditable
                                onInput={handleInput}
                                className="flex-1 w-full bg-transparent overflow-auto text-lg leading-relaxed text-foreground placeholder-muted-foreground focus:outline-none min-h-[400px]"
                                style={{ outline: 'none' }}
                                data-placeholder={`Write your notes for ${monthName} here...`}
                            />
                            <div className="flex justify-end pt-4 border-t border-border mt-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={saveNoteMutation.isPending}
                                    className="gap-2 min-w-[120px]"
                                >
                                    <Save className="w-4 h-4" />
                                    {saveNoteMutation.isPending ? "Saving..." : "Save Note"}
                                </Button>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </Layout>
    );
}
