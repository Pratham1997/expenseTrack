import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Layers } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch"; // Assuming we have this or use a button toggle
import { useUser } from "@/contexts/UserContext";




// --- Types ---
interface ExpenseFormData {
  description: string;
  amount: number;
  categoryId: string;
  paidByPersonId: string;
  paymentMethodId: string;
  creditCardId: string;
  expenseAppId: string;
  expenseDate: string;
  currency: string;
  notes: string;
}

interface BatchEntry {
  id: string; // temp id for key
  amount: number;
  expenseDate: string;
}

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "CAD", "AUD"];

export default function ExpenseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useUser();


  // --- Data Fetching for Dropdowns ---
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["categories"],
    queryFn: async () => (await fetch(`/api/categories?userId=${userId}`)).json(),
  });

  const { data: people = [] } = useQuery<any[]>({
    queryKey: ["people"],
    queryFn: async () => (await fetch(`/api/people?userId=${userId}`)).json(),
  });

  const { data: paymentMethods = [] } = useQuery<any[]>({
    queryKey: ["payment-methods"],
    queryFn: async () => (await fetch("/api/payment-methods")).json(),
  });

  const { data: creditCards = [] } = useQuery<any[]>({
    queryKey: ["credit-cards"],
    queryFn: async () => (await fetch(`/api/credit-cards?userId=${userId}`)).json(),
  });

  const { data: expenseApps = [] } = useQuery<any[]>({
    queryKey: ["expense-apps"],
    queryFn: async () => (await fetch(`/api/expense-apps?userId=${userId}`)).json(),
  });


  // --- Form State ---
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: "",
    amount: 0,
    categoryId: "",
    paidByPersonId: "",
    paymentMethodId: "",
    creditCardId: "",
    expenseAppId: "",
    expenseDate: new Date().toISOString().split("T")[0],
    currency: "INR",
    notes: "",
  });

  // Batch Mode State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([
    { id: "1", amount: 0, expenseDate: new Date().toISOString().split("T")[0] },
    { id: "2", amount: 0, expenseDate: new Date().toISOString().split("T")[0] }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Fetch Existing Expense if Edit ---
  const { data: existingData } = useQuery({
    queryKey: ["expense", id],
    queryFn: async () => {
      const res = await fetch(`/api/expenses/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isEdit
  });

  useEffect(() => {
    if (existingData) {
      setFormData({
        description: "",
        amount: parseFloat(existingData.amountOriginal),
        categoryId: existingData.categoryId?.toString() || "",
        paidByPersonId: existingData.paidByPersonId?.toString() || "",
        paymentMethodId: existingData.paymentMethodId?.toString() || "",
        creditCardId: existingData.creditCardId?.toString() || "",
        expenseAppId: existingData.expenseAppId?.toString() || "",
        expenseDate: existingData.expenseDate.split("T")[0],
        currency: existingData.currencyOriginal,
        notes: existingData.notes || "",
      });
    }
  }, [existingData]);


  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create expense");
      return res.json();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update expense");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Expense updated successfully!" });
      navigate("/expenses");
    },
    onError: (err) => {
      toast({ title: "Error updating expense", description: err.message, variant: "destructive" });
    }
  });


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Common fields validation
    if (!formData.notes.trim() && !formData.expenseAppId) {
      newErrors.notes = "Description is required";
    }
    if (!formData.paymentMethodId) {
      newErrors.paymentMethodId = "Payment Method is required";
    }

    if (isBatchMode) {
      // Validate batch entries
      const invalidEntries = batchEntries.some(entry => entry.amount <= 0 || !entry.expenseDate);
      if (invalidEntries) {
        newErrors.batch = "All amounts must be > 0 and dates are required";
      }
      if (batchEntries.length === 0) {
        newErrors.batch = "At least one entry is required";
      }
    } else {
      if (formData.amount <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      }
      if (!formData.expenseDate) {
        newErrors.expenseDate = "Date is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      let finalNotes = formData.notes;

      // Default to App Name if notes empty
      if (!finalNotes.trim() && formData.expenseAppId) {
        const selectedApp = expenseApps.find((app: any) => app.id.toString() === formData.expenseAppId);
        if (selectedApp) {
          finalNotes = selectedApp.name;
        }
      }

      const commonPayload = {
        userId: userId,

        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
        paidByPersonId: formData.paidByPersonId ? parseInt(formData.paidByPersonId) : undefined,
        paymentMethodId: parseInt(formData.paymentMethodId),
        creditCardId: formData.creditCardId ? parseInt(formData.creditCardId) : undefined,
        expenseAppId: formData.expenseAppId ? parseInt(formData.expenseAppId) : undefined,
        currencyOriginal: formData.currency,
        notes: finalNotes,
        isDeleted: false
      };

      if (isEdit) {
        // Edit mode doesn't support batch for now as per usual UX
        const payload = {
          ...commonPayload,
          amountOriginal: formData.amount,
          amountConverted: formData.amount,
          expenseDate: formData.expenseDate,
        };
        updateMutation.mutate(payload);
      } else {
        if (isBatchMode) {
          // Batch Creation
          try {
            const promises = batchEntries.map(entry => {
              return createMutation.mutateAsync({
                ...commonPayload,
                amountOriginal: entry.amount,
                amountConverted: entry.amount,
                expenseDate: entry.expenseDate
              });
            });

            await Promise.all(promises);
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            toast({ title: `Successfully created ${batchEntries.length} expenses!` });
            navigate("/expenses");
          } catch (err: any) {
            toast({ title: "Error creating entries", description: err.message, variant: "destructive" });
          }
        } else {
          // Single Creation
          const payload = {
            ...commonPayload,
            amountOriginal: formData.amount,
            amountConverted: formData.amount,
            expenseDate: formData.expenseDate,
          };
          createMutation.mutate(payload, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["expenses"] });
              toast({ title: "Expense created successfully!" });
              navigate("/expenses");
            },
            onError: (err) => {
              console.error(err);
              toast({ title: "Error creating expense", description: err.message, variant: "destructive" });
            }
          });
        }
      }
    }
  };

  const addBatchEntry = () => {
    setBatchEntries([...batchEntries, {
      id: Math.random().toString(36).substr(2, 9),
      amount: 0,
      expenseDate: batchEntries[batchEntries.length - 1]?.expenseDate || new Date().toISOString().split("T")[0]
    }]);
  };

  const removeBatchEntry = (id: string) => {
    setBatchEntries(batchEntries.filter(e => e.id !== id));
  };

  const updateBatchEntry = (id: string, field: keyof BatchEntry, value: any) => {
    setBatchEntries(batchEntries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // Find "Credit Card" payment method ID to conditionally show credit card Select
  const creditCardPM = paymentMethods.find((pm: any) => pm.name === "Credit Card" || pm.name === "Credit Cards");
  const isCreditCardSelected = creditCardPM && formData.paymentMethodId === creditCardPM.id.toString();


  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/expenses")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isEdit ? "Edit Expense" : "Add Expense"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isEdit ? "Update expense details" : "Create new expense entry"}
              </p>
            </div>
          </div>

          {!isEdit && (
            <Button
              variant={isBatchMode ? "default" : "outline"}
              onClick={() => setIsBatchMode(!isBatchMode)}
              className="gap-2"
            >
              <Layers className="w-4 h-4" />
              {isBatchMode ? "Batch Mode On" : "Batch Mode Off"}
            </Button>
          )}
        </div>

        {/* Form Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* --- Common Fields --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border">
              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Description {!formData.expenseAppId && <span className="text-red-500">*</span>}
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Lunch, Taxi, Groceries"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className={errors.notes ? "border-red-500" : ""}
                />
                {errors.notes && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.notes}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {isBatchMode ? "Required. Applied to all entries." : "Leave empty to use App Name if selected."}
                </p>
              </div>

              {/* Expense App */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Expense App
                </label>
                <select
                  value={formData.expenseAppId}
                  onChange={(e) =>
                    setFormData({ ...formData, expenseAppId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground cursor-pointer"
                >
                  <option value="">None</option>
                  {expenseApps.map((app: any) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.paymentMethodId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentMethodId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground cursor-pointer"
                >
                  <option value="">Select Method</option>
                  {paymentMethods.map((pm: any) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name}
                    </option>
                  ))}
                </select>
                {errors.paymentMethodId && (
                  <p className="text-red-500 text-sm mt-1">{errors.paymentMethodId}</p>
                )}
              </div>

              {/* Credit Card (Conditional) */}
              {isCreditCardSelected && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Credit Card
                  </label>
                  <select
                    value={formData.creditCardId}
                    onChange={(e) =>
                      setFormData({ ...formData, creditCardId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground cursor-pointer"
                  >
                    <option value="">Select Card</option>
                    {creditCards.map((card: any) => (
                      <option key={card.id} value={card.id}>
                        {card.cardName} ending in {card.last4}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Spender */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Paid By
                </label>
                <select
                  value={formData.paidByPersonId}
                  onChange={(e) =>
                    setFormData({ ...formData, paidByPersonId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground cursor-pointer"
                >
                  <option value="">Me (Default)</option>
                  {people.map((person: any) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground cursor-pointer"
                >
                  {CURRENCIES.map((cur) => (
                    <option key={cur} value={cur}>
                      {cur}
                    </option>
                  ))}
                </select>
              </div>
            </div>


            {/* --- Variable Fields --- */}
            {isBatchMode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-foreground">
                    Batch Entries ({batchEntries.length})
                  </label>
                  <Button type="button" variant="outline" size="sm" onClick={addBatchEntry} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Row
                  </Button>
                </div>

                {errors.batch && (
                  <p className="text-red-500 text-sm">{errors.batch}</p>
                )}

                <div className="space-y-3">
                  {batchEntries.map((entry, index) => (
                    <div key={entry.id} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Amount"
                          step="0.01"
                          value={entry.amount || ""}
                          onChange={(e) => updateBatchEntry(entry.id, "amount", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="date"
                          value={entry.expenseDate}
                          onChange={(e) => updateBatchEntry(entry.id, "expenseDate", e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeBatchEntry(entry.id)}
                        disabled={batchEntries.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Single Entry Mode */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={errors.amount ? "border-red-500" : ""}
                  />
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expenseDate: e.target.value })
                    }
                    className={errors.expenseDate ? "border-red-500" : ""}
                  />
                  {errors.expenseDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.expenseDate}</p>
                  )}
                </div>
              </div>
            )}


            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/expenses")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEdit ? "Update Expense" : (isBatchMode ? `Create ${batchEntries.length} Expenses` : "Add Expense")}
              </Button>
            </div>
          </form>
        </Card>

        {/* Help Card */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tip</h3>
          <p className="text-blue-800 text-sm">
            Use <strong>Batch Mode</strong> to quickly add multiple expenses (like Swiggy orders) that share the same details but have different amounts and dates.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
