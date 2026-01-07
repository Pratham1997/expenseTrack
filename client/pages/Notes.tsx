import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Save, StickyNote } from "lucide-react";
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

    // Update local state when data loads
    useEffect(() => {
        if (currentNote) {
            setNoteContent(currentNote.notes || "");
        } else {
            setNoteContent("");
        }
    }, [currentNote]);

    // Mutation to save/update note
    const saveNoteMutation = useMutation({
        mutationFn: async (content: string) => {
            if (currentNote) {
                // Update existing
                const res = await fetch(`/api/monthly-notes/${currentNote.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ notes: content }),
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
                        notes: content,
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
        saveNoteMutation.mutate(noteContent);
    };

    const monthName = currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

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
                <Card className="min-h-[500px] flex flex-col p-6 shadow-sm">
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            Loading note...
                        </div>
                    ) : (
                        <>
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder={`Write your notes for ${monthName} here...`}
                                className="flex-1 w-full resize-none bg-transparent border-none focus:ring-0 text-lg leading-relaxed text-foreground placeholder-muted-foreground outline-none"
                                spellCheck={false}
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
