import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ChevronDown,
  Filter,
  Edit,
  Trash2,
  Plus,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  spender: string;
  type: "credit-card" | "upi" | "cash";
  currency: string;
  notes?: string;
}

const MOCK_EXPENSES: Expense[] = [
  {
    id: "1",
    amount: 45.5,
    category: "Food",
    date: "2024-01-15",
    description: "Lunch at restaurant",
    spender: "You",
    type: "credit-card",
    currency: "USD",
    notes: "Business lunch",
  },
  {
    id: "2",
    amount: 120,
    category: "Transport",
    date: "2024-01-14",
    description: "Uber ride",
    spender: "You",
    type: "upi",
    currency: "USD",
  },
  {
    id: "3",
    amount: 500,
    category: "Utilities",
    date: "2024-01-13",
    description: "Monthly electricity bill",
    spender: "You",
    type: "cash",
    currency: "USD",
  },
  {
    id: "4",
    amount: 75.25,
    category: "Entertainment",
    date: "2024-01-12",
    description: "Movie tickets",
    spender: "You",
    type: "credit-card",
    currency: "USD",
  },
  {
    id: "5",
    amount: 200,
    category: "Shopping",
    date: "2024-01-11",
    description: "Groceries",
    spender: "You",
    type: "cash",
    currency: "USD",
  },
  {
    id: "6",
    amount: 85,
    category: "Food",
    date: "2024-01-10",
    description: "Coffee and breakfast",
    spender: "You",
    type: "cash",
    currency: "USD",
  },
  {
    id: "7",
    amount: 300,
    category: "Shopping",
    date: "2024-01-09",
    description: "Clothes shopping",
    spender: "You",
    type: "credit-card",
    currency: "USD",
  },
];

const CATEGORIES = ["All", "Food", "Transport", "Utilities", "Entertainment", "Shopping"];
const SPENDERS = ["All", "You", "Friend 1", "Friend 2"];
const TYPES = ["All", "credit-card", "upi", "cash"];
const SORT_OPTIONS = ["Date (Newest)", "Date (Oldest)", "Amount (High to Low)", "Amount (Low to High)"];
const GROUP_OPTIONS = ["None", "Category", "Spender", "Type", "Month"];

const TYPE_ICONS: Record<string, string> = {
  "credit-card": "💳",
  upi: "📱",
  cash: "💵",
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Food: { bg: "bg-orange-100", text: "text-orange-700" },
  Transport: { bg: "bg-blue-100", text: "text-blue-700" },
  Utilities: { bg: "bg-red-100", text: "text-red-700" },
  Entertainment: { bg: "bg-purple-100", text: "text-purple-700" },
  Shopping: { bg: "bg-green-100", text: "text-green-700" },
};

interface FiltersState {
  category: string;
  spender: string;
  type: string;
  search: string;
}

type GroupBy = "None" | "Category" | "Spender" | "Type" | "Month";

export default function Expenses() {
  const [expenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [filters, setFilters] = useState<FiltersState>({
    category: "All",
    spender: "All",
    type: "All",
    search: "",
  });
  const [sort, setSort] = useState<string>("Date (Newest)");
  const [groupBy, setGroupBy] = useState<GroupBy>("None");
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedExpenses = useMemo(() => {
    let result = expenses.filter((expense) => {
      const matchesCategory = filters.category === "All" || expense.category === filters.category;
      const matchesSpender = filters.spender === "All" || expense.spender === filters.spender;
      const matchesType = filters.type === "All" || expense.type === filters.type;
      const matchesSearch =
        expense.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        expense.category.toLowerCase().includes(filters.search.toLowerCase());

      return matchesCategory && matchesSpender && matchesType && matchesSearch;
    });

    // Sort
    result = result.sort((a, b) => {
      switch (sort) {
        case "Date (Newest)":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "Date (Oldest)":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "Amount (High to Low)":
          return b.amount - a.amount;
        case "Amount (Low to High)":
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return result;
  }, [expenses, filters, sort]);

  const groupedExpenses = useMemo(() => {
    if (groupBy === "None") {
      return { All: filteredAndSortedExpenses };
    }

    const grouped: Record<string, Expense[]> = {};

    filteredAndSortedExpenses.forEach((expense) => {
      let key = "";
      switch (groupBy) {
        case "Category":
          key = expense.category;
          break;
        case "Spender":
          key = expense.spender;
          break;
        case "Type":
          key = expense.type;
          break;
        case "Month":
          key = new Date(expense.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
          });
          break;
        default:
          key = "All";
      }
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(expense);
    });

    return grouped;
  }, [filteredAndSortedExpenses, groupBy]);

  const totalAmount = filteredAndSortedExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handleDelete = (id: string) => {
    // In a real app, this would delete from the backend
    console.log("Delete expense:", id);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
            <p className="text-muted-foreground mt-1">
              Total: <span className="font-bold text-foreground">${totalAmount.toFixed(2)}</span>
            </p>
          </div>
          <Link to="/expenses/new">
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </Link>
        </div>

        {/* Filters and Controls */}
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Input
                placeholder="Search expenses..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-4"
              />
            </div>

            {/* Quick Filters & Controls */}
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-foreground"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
                {Object.values(filters).some((v) => v !== "All" && v !== "") && (
                  <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                    {Object.values(filters).filter((v) => v !== "All" && v !== "").length}
                  </span>
                )}
              </button>

              <div className="flex gap-3 ml-auto flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort:</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground cursor-pointer"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Group by:</span>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground cursor-pointer"
                  >
                    {GROUP_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      setFilters({ ...filters, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Spender
                  </label>
                  <select
                    value={filters.spender}
                    onChange={(e) =>
                      setFilters({ ...filters, spender: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground cursor-pointer"
                  >
                    {SPENDERS.map((spender) => (
                      <option key={spender} value={spender}>
                        {spender}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) =>
                      setFilters({ ...filters, type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground cursor-pointer"
                  >
                    {TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type === "All" ? type : type === "credit-card" ? "Credit Card" : type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Expenses List */}
        <div className="space-y-6">
          {Object.entries(groupedExpenses).map(([group, groupExpenses]) => (
            <div key={group}>
              {groupBy !== "None" && (
                <div className="flex items-center gap-3 mb-4 px-1">
                  <h3 className="text-lg font-semibold text-foreground">{group}</h3>
                  <span className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                    ${groupExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {groupExpenses.map((expense) => {
                  const colors = CATEGORY_COLORS[expense.category] || {
                    bg: "bg-gray-100",
                    text: "text-gray-700",
                  };

                  return (
                    <Card
                      key={expense.id}
                      className="p-4 hover:shadow-md transition-all hover:border-primary/50"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center text-lg flex-shrink-0`}>
                          {TYPE_ICONS[expense.type] || "💰"}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">
                                {expense.description}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                                  {expense.category}
                                </span>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                  {expense.spender}
                                </span>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(expense.date).toLocaleDateString()}
                                </span>
                              </div>
                              {expense.notes && (
                                <p className="text-sm text-muted-foreground mt-2 italic">
                                  "{expense.notes}"
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-lg text-foreground">
                                ${expense.amount.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">{expense.currency}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Link to={`/expenses/${expense.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredAndSortedExpenses.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No expenses found</p>
              <Link to="/expenses/new">
                <Button className="mt-4">Add First Expense</Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
