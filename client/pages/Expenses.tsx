import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Filter,
  Edit,
  Trash2,
  Plus,
  Calendar,
  Download,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

// --- Types ---
interface Expense {
  id: number;
  amountOriginal: string;
  amountConverted: string;
  currencyOriginal: string;
  expenseDate: string;
  notes: string | null;
  category: { id: number; name: string; icon: string | null; color: string | null } | null;
  paidByPerson: { id: number; name: string } | null;
  paymentMethod: { id: number; name: string } | null;
  expenseApp: { id: number; name: string } | null;
}

interface FiltersState {
  category: string;
  spender: string;
  type: string;
  app: string;
  timeFrame: string;
  customStartDate: string;
  customEndDate: string;
  search: string;
}

type GroupBy = "None" | "Category" | "Spender" | "Type" | "App" | "Month";

const USER_ID = 1;

const SORT_OPTIONS = [
  "Date (Newest)",
  "Date (Oldest)",
  "Amount (High to Low)",
  "Amount (Low to High)",
];

const GROUP_OPTIONS = ["None", "Category", "Spender", "Type", "App", "Month"];

const TIME_FRAMES = [
  { label: "All Time", value: "All" },
  { label: "This Month", value: "This Month" },
  { label: "Last Month", value: "Last Month" },
  { label: "This Year", value: "This Year" },
  { label: "Last 30 Days", value: "Last 30 Days" },
  { label: "Custom Range", value: "Custom Range" },
];

export default function Expenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Data Fetching ---
  const { data: expenses = [], isLoading, error } = useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: async () => {
      const res = await fetch(`/api/expenses?limit=1000`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["categories"],
    queryFn: async () => (await fetch(`/api/categories?userId=${USER_ID}`)).json(),
  });

  const { data: people = [] } = useQuery<any[]>({
    queryKey: ["people"],
    queryFn: async () => (await fetch(`/api/people?userId=${USER_ID}`)).json(),
  });

  const { data: paymentMethods = [] } = useQuery<any[]>({
    queryKey: ["payment-methods"],
    queryFn: async () => (await fetch("/api/payment-methods")).json(),
  });

  const { data: expenseApps = [] } = useQuery<any[]>({
    queryKey: ["expense-apps"],
    queryFn: async () => (await fetch(`/api/expense-apps?userId=${USER_ID}`)).json(),
  });


  // --- State ---
  const [filters, setFilters] = useState<FiltersState>({
    category: "All",
    spender: "All",
    type: "All",
    app: "All",
    timeFrame: "All",
    customStartDate: "",
    customEndDate: "",
    search: "",
  });
  const [sort, setSort] = useState<string>("Date (Newest)");
  const [groupBy, setGroupBy] = useState<GroupBy>("None");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Reset expanded groups when grouping changes
  useEffect(() => {
    setExpandedGroups({});
  }, [groupBy]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // --- Mutations ---
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete expense");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Expense deleted" });
    },
    onError: () => {
      toast({ title: "Error deleting expense", variant: "destructive" });
    }
  });

  // --- Derived State (Filtering & Sorting) ---
  const filteredAndSortedExpenses = useMemo(() => {
    let result = expenses.filter((expense) => {
      const categoryName = expense.category?.name || "Uncategorized";
      const spenderName = expense.paidByPerson?.name || "Me";
      const typeName = expense.paymentMethod?.name || "Unknown";
      const appName = expense.expenseApp?.name || "None"; // Or "Manual"

      const matchesCategory =
        filters.category === "All" || categoryName === filters.category;
      const matchesSpender =
        filters.spender === "All" || spenderName === filters.spender;
      const matchesType =
        filters.type === "All" || typeName === filters.type;
      const matchesApp =
        filters.app === "All" || appName === filters.app;

      // Time Filter Logic
      let matchesTime = true;
      if (filters.timeFrame !== "All") {
        const expenseDate = new Date(expense.expenseDate);
        const now = new Date();

        if (filters.timeFrame === "This Month") {
          matchesTime = expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
        } else if (filters.timeFrame === "Last Month") {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          matchesTime = expenseDate.getMonth() === lastMonth.getMonth() && expenseDate.getFullYear() === lastMonth.getFullYear();
        } else if (filters.timeFrame === "This Year") {
          matchesTime = expenseDate.getFullYear() === now.getFullYear();
        } else if (filters.timeFrame === "Last 30 Days") {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          matchesTime = expenseDate >= thirtyDaysAgo;
        } else if (filters.timeFrame === "Custom Range") {
          if (filters.customStartDate && filters.customEndDate) {
            const startDate = new Date(filters.customStartDate);
            const endDate = new Date(filters.customEndDate);
            endDate.setHours(23, 59, 59, 999); // Include the entire end date
            matchesTime = expenseDate >= startDate && expenseDate <= endDate;
          }
        }
      }

      const description = expense.notes || categoryName + " Expense";
      const matchesSearch =
        description.toLowerCase().includes(filters.search.toLowerCase()) ||
        categoryName.toLowerCase().includes(filters.search.toLowerCase());

      return matchesCategory && matchesSpender && matchesType && matchesApp && matchesTime && matchesSearch;
    });

    result = result.sort((a, b) => {
      const amountA = parseFloat(a.amountConverted);
      const amountB = parseFloat(b.amountConverted);
      const dateA = new Date(a.expenseDate).getTime();
      const dateB = new Date(b.expenseDate).getTime();

      switch (sort) {
        case "Date (Newest)":
          return dateB - dateA;
        case "Date (Oldest)":
          return dateA - dateB;
        case "Amount (High to Low)":
          return amountB - amountA;
        case "Amount (Low to High)":
          return amountA - amountB;
        default:
          return 0;
      }
    });

    return result;
  }, [expenses, filters, sort]);

  // --- Grouping ---
  const groupedExpenses = useMemo(() => {
    if (groupBy === "None") {
      return { All: filteredAndSortedExpenses };
    }

    const grouped: Record<string, Expense[]> = {};

    filteredAndSortedExpenses.forEach((expense) => {
      let key = "";
      switch (groupBy) {
        case "Category":
          key = expense.category?.name || "Uncategorized";
          break;
        case "Spender":
          key = expense.paidByPerson?.name || "Me";
          break;
        case "Type":
          key = expense.paymentMethod?.name || "Unknown";
          break;
        case "App":
          key = expense.expenseApp?.name || "None";
          break;
        case "Month":
          key = new Date(expense.expenseDate).toLocaleDateString("en-US", {
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

  const totalAmount = filteredAndSortedExpenses.reduce(
    (sum, exp) => sum + parseFloat(exp.amountConverted),
    0,
  );

  // --- CSV Export ---
  const exportToCSV = () => {
    // Group expenses by App
    const groupedByApp: Record<string, Expense[]> = {};

    filteredAndSortedExpenses.forEach((expense) => {
      const appName = expense.expenseApp?.name || "None";
      if (!groupedByApp[appName]) {
        groupedByApp[appName] = [];
      }
      groupedByApp[appName].push(expense);
    });

    // Generate CSV rows
    const csvRows = [];
    csvRows.push(["App", "Breakdown", "Category", "Person", "Total"]);

    Object.entries(groupedByApp).forEach(([appName, expenses]) => {
      const breakdown = expenses.map(e => parseFloat(e.amountConverted)).join("+");
      const total = expenses.reduce((sum, e) => sum + parseFloat(e.amountConverted), 0);
      const category = expenses[0]?.category?.name || "";
      const person = expenses[0]?.paidByPerson?.name || "";

      csvRows.push([
        appName,
        breakdown,
        category,
        person,
        total.toFixed(2)
      ]);
    });

    // Convert to CSV string
    const csvContent = csvRows.map(row => row.join(",")).join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `expenses_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Expenses exported successfully!" });
  };

  if (isLoading) return <Layout><div className="flex justify-center p-8">Loading expenses...</div></Layout>;
  if (error) return <Layout><div className="text-red-500 p-8">Error loading expenses</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
            <p className="text-muted-foreground mt-1">
              Total:{" "}
              <span className="font-bold text-foreground">
                {formatCurrency(totalAmount)}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Link to="/expenses/new">
              <Button size="lg" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Expense
              </Button>
            </Link>
          </div>
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
                {Object.values(filters).some(
                  (v) => v !== "All" && v !== "",
                ) && (
                    <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                      {
                        Object.values(filters).filter(
                          (v) => v !== "All" && v !== "",
                        ).length
                      }
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
                  <span className="text-sm text-muted-foreground">
                    Group by:
                  </span>
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
              <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Time Frame
                  </label>
                  <select
                    value={filters.timeFrame}
                    onChange={(e) =>
                      setFilters({ ...filters, timeFrame: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground cursor-pointer"
                  >
                    {TIME_FRAMES.map((tf) => (
                      <option key={tf.value} value={tf.value}>
                        {tf.label}
                      </option>
                    ))}
                  </select>

                  {filters.timeFrame === "Custom Range" && (
                    <div className="mt-2 space-y-2">
                      <input
                        type="date"
                        value={filters.customStartDate}
                        onChange={(e) =>
                          setFilters({ ...filters, customStartDate: e.target.value })
                        }
                        placeholder="Start Date"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      />
                      <input
                        type="date"
                        value={filters.customEndDate}
                        onChange={(e) =>
                          setFilters({ ...filters, customEndDate: e.target.value })
                        }
                        placeholder="End Date"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    App
                  </label>
                  <select
                    value={filters.app}
                    onChange={(e) =>
                      setFilters({ ...filters, app: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground cursor-pointer"
                  >
                    <option value="All">All</option>
                    {expenseApps.map((app: any) => (
                      <option key={app.id} value={app.name}>
                        {app.name}
                      </option>
                    ))}
                  </select>
                </div>

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
                    <option value="All">All</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
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
                    <option value="All">All</option>
                    {people.map((person: any) => (
                      <option key={person.id} value={person.name}>
                        {person.name}
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
                    <option value="All">All</option>
                    {paymentMethods.map((pm: any) => (
                      <option key={pm.id} value={pm.name}>
                        {pm.name}
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
                <div
                  className="flex items-center gap-3 mb-4 px-1 cursor-pointer hover:opacity-80 transition-opacity w-fit"
                  onClick={() => toggleGroup(group)}
                >
                  {expandedGroups[group] ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                  <h3 className="text-lg font-semibold text-foreground">
                    {group}
                  </h3>
                  <span className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                    {formatCurrency(groupExpenses
                      .reduce((sum, exp) => sum + parseFloat(exp.amountConverted), 0))}
                  </span>
                </div>
              )}

              {(groupBy === "None" || expandedGroups[group]) && (
                <div className="space-y-3">
                  {groupExpenses.map((expense) => {
                    const safeBadgeClass = "bg-secondary text-secondary-foreground";

                    return (
                      <Card
                        key={expense.id}
                        className="p-4 hover:shadow-md transition-all hover:border-primary/50"
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-lg flex-shrink-0"
                          >
                            {expense.category?.icon || "💰"}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">
                                  {expense.notes || "Expense"}
                                  {expense.expenseApp && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                      {expense.expenseApp.name}
                                    </span>
                                  )}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full font-medium ${safeBadgeClass}`}
                                  >
                                    {expense.category?.name || "Uncategorized"}
                                  </span>
                                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                    {expense.paidByPerson?.name || "Me"}
                                  </span>
                                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(expense.expenseDate).toLocaleDateString()}
                                  </span>
                                  {expense.paymentMethod && (
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                      {expense.paymentMethod.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-lg text-foreground">
                                  {formatCurrency(parseFloat(expense.amountConverted))}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {expense.currencyOriginal}
                                </p>
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
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this expense?")) {
                                  deleteExpenseMutation.mutate(expense.id)
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
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
