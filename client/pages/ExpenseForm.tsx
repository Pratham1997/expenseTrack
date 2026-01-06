import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

interface ExpenseFormData {
  description: string;
  amount: number;
  category: string;
  spender: string;
  type: "credit-card" | "upi" | "cash";
  date: string;
  currency: string;
  notes?: string;
  creditCard?: string;
}

const CATEGORIES = [
  "Food",
  "Transport",
  "Utilities",
  "Entertainment",
  "Shopping",
  "Health",
  "Education",
  "Other",
];
const SPENDERS = ["You", "Alice Johnson", "Bob Smith"];
const TYPES = ["credit-card", "upi", "cash"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "CAD", "AUD"];
const CREDIT_CARDS = ["Personal Visa", "Work Mastercard", "Business AmEx"];

export default function ExpenseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState<ExpenseFormData>({
    description: "",
    amount: 0,
    category: "Food",
    spender: "You",
    type: "credit-card",
    date: new Date().toISOString().split("T")[0],
    currency: "INR",
    notes: "",
    creditCard: "Personal Visa",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (formData.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      console.log("Submitting expense:", formData);
      navigate("/expenses");
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/expenses")}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEdit ? "Edit Expense" : "Add New Expense"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEdit ? "Update expense details" : "Create a new expense entry"}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g., Lunch at restaurant, Grocery shopping"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
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

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className={errors.date ? "border-red-500" : ""}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            {/* Category and Spender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Spender
                </label>
                <select
                  value={formData.spender}
                  onChange={(e) =>
                    setFormData({ ...formData, spender: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground cursor-pointer"
                >
                  {SPENDERS.map((spender) => (
                    <option key={spender} value={spender}>
                      {spender}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type and Credit Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Payment Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "credit-card" | "upi" | "cash",
                    })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground cursor-pointer"
                >
                  {TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type === "credit-card"
                        ? "Credit Card"
                        : type.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              {formData.type === "credit-card" && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Credit Card
                  </label>
                  <select
                    value={formData.creditCard}
                    onChange={(e) =>
                      setFormData({ ...formData, creditCard: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground cursor-pointer"
                  >
                    {CREDIT_CARDS.map((card) => (
                      <option key={card} value={card}>
                        {card}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Notes (Optional)
              </label>
              <Textarea
                placeholder="Add any notes or details about this expense..."
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
              />
            </div>

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
              <Button type="submit" className="flex-1">
                {isEdit ? "Update Expense" : "Add Expense"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Help Card */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tip</h3>
          <p className="text-blue-800 text-sm">
            You can track shared expenses and settle them later. Just select a
            friend as the spender and you'll be able to see who owes whom in the
            dashboard.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
