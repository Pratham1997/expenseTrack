import React, { useState } from "react";
import Papa from "papaparse";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts/UserContext";


interface CSVImportProps {
    userId: number;
    categories: any[];
    people: any[];
    paymentMethods: any[];
    expenseApps: any[];
}

type Mapping = {
    date: string;
    amount: string;
    breakdown: string;
    category: string;
    paymentMethod: string;
    notes: string;
    paidBy: string;
    app: string;
};

interface PendingExpense {
    tempId: string;
    userId: number;
    categoryId: number | null;
    paidByPersonId: number | null;
    paymentMethodId: number;
    expenseAppId: number | null;
    amountOriginal: number;
    currencyOriginal: string;
    amountConverted: number;
    expenseDate: string; // YYYY-MM-DD for input
    notes: string;
}

export function CSVImport({ categories, people, paymentMethods, expenseApps }: Omit<CSVImportProps, 'userId'>) {
    const { userId } = useUser();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [headers, setHeaders] = useState<string[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [mapping, setMapping] = useState<Mapping>({
        date: "",
        amount: "",
        breakdown: "",
        category: "",
        paymentMethod: "",
        notes: "",
        paidBy: "",
        app: "",
    });
    const [isOpen, setIsOpen] = useState(false);
    const [useCommonDate, setUseCommonDate] = useState(false);
    const [commonDate, setCommonDate] = useState(new Date().toISOString().split('T')[0]);
    const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);

    // Mutation for batch creation
    const batchMutation = useMutation({
        mutationFn: async (expenses: PendingExpense[]) => {
            const res = await fetch("/api/expenses/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(expenses.map(exp => ({
                    ...exp,
                    expenseDate: new Date(exp.expenseDate) // Convert string back to Date for backend
                }))),
            });
            if (!res.ok) throw new Error("Failed to upload batch");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            toast({ title: "Success", description: "Expenses imported successfully" });
            setIsOpen(false);
            reset();
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to import expenses",
            });
        },
    });

    const reset = () => {
        setStep(1);
        setData([]);
        setHeaders([]);
        setUseCommonDate(false);
        setCommonDate(new Date().toISOString().split('T')[0]);
        setPendingExpenses([]);
        setMapping({
            date: "",
            amount: "",
            breakdown: "",
            category: "",
            paymentMethod: "",
            notes: "",
            paidBy: "",
            app: "",
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setHeaders(Object.keys(results.data[0] as any));
                setData(results.data);
                setStep(2);

                // Auto-mapping logic (simple keyword matching)
                const newMapping = { ...mapping };

                Object.keys(results.data[0] as any).forEach(header => {
                    const low = header.toLowerCase().trim();
                    if (low === "breakdown") newMapping.breakdown = header;
                    if (low === "date") newMapping.date = header;
                    if (low === "total" || low.includes("amount") || low.includes("price") || low.includes("cost")) {
                        if (low !== "breakdown") newMapping.amount = header;
                    }
                    if (low === "category" || low.includes("type")) newMapping.category = header;
                    if (low.includes("method") || low.includes("paid with")) newMapping.paymentMethod = header;
                    if (low.includes("note") || low.includes("desc")) newMapping.notes = header;
                    if (low === "person" || low.includes("paid by") || low.includes("spender")) newMapping.paidBy = header;
                    if (low === "app" || low.includes("source")) newMapping.app = header;
                });
                setMapping(newMapping);
            },
        });
    };

    const parseDate = (dateStr: string) => {
        if (!dateStr) return new Date();

        // Try standard parsing first
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) return parsed;

        // Try DD/MM/YYYY or DD-MM-YYYY
        const parts = dateStr.split(/[/\-]/);
        if (parts.length === 3) {
            // Check if first part is year (YYYY-MM-DD) or last part is year (DD/MM/YYYY)
            if (parts[0].length === 4) {
                return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            } else if (parts[2].length === 4) {
                return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
        }

        return new Date(); // Fallback to now
    };

    const generatePendingExpenses = () => {
        const results: PendingExpense[] = [];

        data.forEach((row, rowIndex) => {
            // Find IDs for mapping values
            const categoryId = categories.find(c => c.name.toLowerCase() === (row[mapping.category] || "").toString().toLowerCase())?.id || null;
            const paymentMethodId = paymentMethods.find(p => p.name.toLowerCase() === (row[mapping.paymentMethod] || "").toString().toLowerCase())?.id || paymentMethods[0]?.id; // Default to first if not found
            const personId = people.find(p => p.name.toLowerCase() === (row[mapping.paidBy] || "").toString().toLowerCase())?.id || null;
            const appId = expenseApps.find(a => a.name.toLowerCase() === (row[mapping.app] || "").toString().toLowerCase())?.id || null;

            const dateObj = useCommonDate ? new Date(commonDate) : parseDate((row[mapping.date] || "").toString());
            const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const notes = row[mapping.notes] || "";

            // Handle breakdown (+) split
            let processed = false;
            if (mapping.breakdown && row[mapping.breakdown] && row[mapping.breakdown].toString().trim() !== "") {
                const parts = row[mapping.breakdown].toString().split("+");
                parts.forEach((part: string, partIndex: number) => {
                    const amount = parseFloat(part.trim().replace(/[^0-9.]/g, ''));
                    if (!isNaN(amount)) {
                        results.push({
                            tempId: `row-${rowIndex}-part-${partIndex}`,
                            userId,
                            categoryId,
                            paidByPersonId: personId,
                            paymentMethodId,
                            expenseAppId: appId,
                            amountOriginal: amount,
                            currencyOriginal: "INR",
                            amountConverted: amount,
                            expenseDate: dateStr,
                            notes,
                        });
                        processed = true;
                    }
                });
            }

            // Fallback to primary amount if breakdown was not possible or not mapped
            if (!processed && mapping.amount && row[mapping.amount]) {
                const rawAmount = parseFloat(row[mapping.amount].toString().replace(/[^0-9.]/g, ''));
                if (!isNaN(rawAmount)) {
                    results.push({
                        tempId: `row-${rowIndex}`,
                        userId,
                        categoryId,
                        paidByPersonId: personId,
                        paymentMethodId,
                        expenseAppId: appId,
                        amountOriginal: rawAmount,
                        currencyOriginal: "INR",
                        amountConverted: rawAmount,
                        expenseDate: dateStr,
                        notes,
                    });
                }
            }
        });

        setPendingExpenses(results);
        setStep(3);
    };

    const updatePendingExpense = (tempId: string, updates: Partial<PendingExpense>) => {
        setPendingExpenses(prev => prev.map(exp => exp.tempId === tempId ? { ...exp, ...updates } : exp));
    };

    const handleImport = () => {
        const finalData = pendingExpenses.map(exp => {
            let finalDescription = exp.notes;
            if (!finalDescription.trim() && exp.expenseAppId) {
                const app = expenseApps.find(a => a.id === exp.expenseAppId);
                if (app) finalDescription = app.name;
            }
            return {
                ...exp,
                notes: finalDescription,
                expenseDate: new Date(exp.expenseDate).toISOString().split('T')[0] // Ensure it's a string in YYYY-MM-DD format for the interface
            };
        });
        batchMutation.mutate(finalData as any);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Expenses from CSV</DialogTitle>
                </DialogHeader>

                {step === 1 && (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-muted/30">
                        <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Upload your CSV file</h3>
                        <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                            Drag and drop your file here, or click to browse. We'll help you map the columns in the next step.
                        </p>
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="max-w-xs"
                        />
                    </div>
                )}

                {step === 2 && (
                    <div className="flex-1 overflow-auto space-y-6 py-4 px-1">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Date Selection</h4>
                                <div className="bg-muted/30 p-4 rounded-lg space-y-4 border border-border">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="common-date-toggle" className="text-sm font-medium cursor-pointer">
                                            Use a common date for all entries
                                        </Label>
                                        <Switch
                                            id="common-date-toggle"
                                            checked={useCommonDate}
                                            onCheckedChange={setUseCommonDate}
                                        />
                                    </div>

                                    {useCommonDate ? (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <Label className="text-xs text-muted-foreground">Select Common Date</Label>
                                            <Input
                                                type="date"
                                                value={commonDate}
                                                onChange={(e) => setCommonDate(e.target.value)}
                                                className="bg-background"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Map Date Column</Label>
                                            <Select value={mapping.date} onValueChange={(v) => setMapping({ ...mapping, date: v })}>
                                                <SelectTrigger><SelectValue placeholder="Select Column" /></SelectTrigger>
                                                <SelectContent>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground pt-2">Amount Mapping</h4>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 items-center gap-4">
                                        <span className="text-sm font-medium">Amount (Total)</span>
                                        <Select value={mapping.amount} onValueChange={(v) => setMapping({ ...mapping, amount: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select Column" /></SelectTrigger>
                                            <SelectContent>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 items-center gap-4">
                                        <span className="text-sm font-medium">Breakdown (+)</span>
                                        <Select value={mapping.breakdown} onValueChange={(v) => setMapping({ ...mapping, breakdown: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select Column" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Optional Mappings</h4>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 items-center gap-4">
                                        <span className="text-sm font-medium">Category</span>
                                        <Select value={mapping.category} onValueChange={(v) => setMapping({ ...mapping, category: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select Column" /></SelectTrigger>
                                            <SelectContent><SelectItem value="none">None</SelectItem>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 items-center gap-4">
                                        <span className="text-sm font-medium">Payment Method</span>
                                        <Select value={mapping.paymentMethod} onValueChange={(v) => setMapping({ ...mapping, paymentMethod: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select Column" /></SelectTrigger>
                                            <SelectContent><SelectItem value="none">None</SelectItem>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 items-center gap-4">
                                        <span className="text-sm font-medium">Notes / Desc</span>
                                        <Select value={mapping.notes} onValueChange={(v) => setMapping({ ...mapping, notes: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select Column" /></SelectTrigger>
                                            <SelectContent><SelectItem value="none">None</SelectItem>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 items-center gap-4">
                                        <span className="text-sm font-medium">Paid By</span>
                                        <Select value={mapping.paidBy} onValueChange={(v) => setMapping({ ...mapping, paidBy: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select Column" /></SelectTrigger>
                                            <SelectContent><SelectItem value="none">None</SelectItem>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 items-center gap-4">
                                        <span className="text-sm font-medium">App</span>
                                        <Select value={mapping.app} onValueChange={(v) => setMapping({ ...mapping, app: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select Column" /></SelectTrigger>
                                            <SelectContent><SelectItem value="none">None</SelectItem>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border flex justify-between">
                            <Button variant="ghost" onClick={reset}>Cancel</Button>
                            <Button
                                disabled={(!useCommonDate && !mapping.date) || !mapping.amount}
                                onClick={generatePendingExpenses}
                            >
                                Preview Mapping
                                <ChevronRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex-1 overflow-hidden flex flex-col py-4">
                        <p className="text-sm text-muted-foreground mb-4">
                            Found {pendingExpenses.length} entries. Review and edit the values below before importing.
                            <br /><span className="text-xs font-semibold text-primary">TIP: Click on any field to change its value.</span>
                        </p>
                        <div className="flex-1 overflow-auto border border-border rounded-lg">
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="w-[120px]">Date</TableHead>
                                        <TableHead className="w-[100px]">Amount</TableHead>
                                        <TableHead className="w-[160px]">Category</TableHead>
                                        <TableHead className="w-[160px]">Method</TableHead>
                                        <TableHead className="w-[150px]">Paid By</TableHead>
                                        <TableHead className="w-[150px]">App</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingExpenses.map((exp) => (
                                        <TableRow key={exp.tempId}>
                                            <TableCell className="p-1">
                                                <Input
                                                    type="date"
                                                    value={exp.expenseDate}
                                                    onChange={(e) => updatePendingExpense(exp.tempId, { expenseDate: e.target.value })}
                                                    className="h-8 text-[10px] sm:text-xs border-transparent hover:border-input focus:border-primary px-1"
                                                />
                                            </TableCell>
                                            <TableCell className="p-1">
                                                <Input
                                                    type="number"
                                                    value={exp.amountOriginal}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        updatePendingExpense(exp.tempId, { amountOriginal: val, amountConverted: val });
                                                    }}
                                                    className="h-8 text-[10px] sm:text-xs font-semibold border-transparent hover:border-input focus:border-primary px-1"
                                                />
                                            </TableCell>
                                            <TableCell className="p-1">
                                                <select
                                                    className="w-full h-8 text-[10px] sm:text-xs bg-transparent border border-transparent hover:border-input rounded px-1 focus:outline-none focus:ring-1 focus:ring-primary"
                                                    value={exp.categoryId || ""}
                                                    onChange={(e) => updatePendingExpense(exp.tempId, { categoryId: Number(e.target.value) || null })}
                                                >
                                                    <option value="">Uncategorized</option>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                                                </select>
                                            </TableCell>
                                            <TableCell className="p-1">
                                                <select
                                                    className="w-full h-8 text-[10px] sm:text-xs bg-transparent border border-transparent hover:border-input rounded px-1 focus:outline-none focus:ring-1 focus:ring-primary"
                                                    value={exp.paymentMethodId}
                                                    onChange={(e) => updatePendingExpense(exp.tempId, { paymentMethodId: Number(e.target.value) })}
                                                >
                                                    {paymentMethods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </TableCell>
                                            <TableCell className="p-1">
                                                <select
                                                    className="w-full h-8 text-[10px] sm:text-xs bg-transparent border border-transparent hover:border-input rounded px-1 focus:outline-none focus:ring-1 focus:ring-primary"
                                                    value={exp.paidByPersonId || ""}
                                                    onChange={(e) => updatePendingExpense(exp.tempId, { paidByPersonId: Number(e.target.value) || null })}
                                                >
                                                    <option value="">Me</option>
                                                    {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </TableCell>
                                            <TableCell className="p-1">
                                                <select
                                                    className="w-full h-8 text-[10px] sm:text-xs bg-transparent border border-transparent hover:border-input rounded px-1 focus:outline-none focus:ring-1 focus:ring-primary"
                                                    value={exp.expenseAppId || ""}
                                                    onChange={(e) => updatePendingExpense(exp.tempId, { expenseAppId: Number(e.target.value) || null })}
                                                >
                                                    <option value="">None</option>
                                                    {expenseApps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                </select>
                                            </TableCell>
                                            <TableCell className="p-1">
                                                <Input
                                                    value={exp.notes}
                                                    onChange={(e) => updatePendingExpense(exp.tempId, { notes: e.target.value })}
                                                    placeholder="Optional..."
                                                    className="h-8 text-[10px] sm:text-xs border-transparent hover:border-input focus:border-primary px-1"
                                                />
                                            </TableCell>
                                            <TableCell className="p-1 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setPendingExpenses(prev => prev.filter(e => e.tempId !== exp.tempId))}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="pt-6 mt-4 border-t border-border flex justify-between shrink-0">
                            <Button variant="ghost" onClick={() => setStep(2)}>Back to mapping</Button>
                            <div className="flex gap-3">
                                <span className="flex items-center text-sm font-medium text-muted-foreground mr-4">
                                    Total: <span className="ml-2 text-foreground font-bold">INR {pendingExpenses.reduce((sum, e) => sum + e.amountConverted, 0).toFixed(2)}</span>
                                </span>
                                <Button
                                    onClick={handleImport}
                                    disabled={batchMutation.isPending || pendingExpenses.length === 0}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[150px]"
                                >
                                    {batchMutation.isPending ? "Importing..." : `Import ${pendingExpenses.length} Expenses`}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

const ChevronRight = ({ className }: { className: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);
