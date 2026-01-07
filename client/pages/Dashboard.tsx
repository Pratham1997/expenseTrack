import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";
import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

// --- Types ---
// Matches the structure returned by /api/expenses
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

const TYPE_ICONS: Record<string, string> = {
  "credit-card": "💳",
  upi: "📱",
  cash: "💵",
};

export default function Dashboard() {

  // --- Data Fetching ---
  const { data: expenses = [], isLoading, error } = useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: async () => {
      // Fetch all for stats
      const res = await fetch(`/api/expenses?limit=1000`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json();
    },
  });

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amountConverted), 0);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyExpenses = expenses.filter((exp) => {
      const d = new Date(exp.expenseDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + parseFloat(exp.amountConverted), 0);

    const categories = expenses.reduce(
      (acc, exp) => {
        const catName = exp.category?.name || "Uncategorized";
        acc[catName] = (acc[catName] || 0) + parseFloat(exp.amountConverted);
        return acc;
      },
      {} as Record<string, number>,
    );

    const topCategory = Object.entries(categories).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return {
      total,
      monthlyTotal,
      expenseCount: expenses.length,
      topCategory,
    };
  }, [expenses]);

  // Sort by date (newest first)
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
  }, [expenses]);

  const recentExpenses = sortedExpenses.slice(0, 5);

  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (isLoading) return <Layout><div className="flex justify-center p-8">Loading dashboard...</div></Layout>;
  if (error) return <Layout><div className="text-red-500 p-8">Error loading dashboard</div></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Expenses */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {formatCurrency(stats.total)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
              <div className="p-3 bg-primary/20 rounded-lg">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          {/* Monthly Expenses */}
          <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  This Month
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {formatCurrency(stats.monthlyTotal)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentMonthName}
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </Card>

          {/* Expense Count */}
          <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {stats.expenseCount}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Transactions
                </p>
              </div>
              <div className="p-3 bg-accent/20 rounded-lg">
                <PieChart className="w-6 h-6 text-accent" />
              </div>
            </div>
          </Card>

          {/* Top Category */}
          <Card className="p-6 bg-gradient-to-br from-orange-100/50 to-orange-50/50 border-orange-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Top Category
                </p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {stats.topCategory?.[0] || "N/A"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats.topCategory?.[1] || 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-200 rounded-lg">
                <TrendingDown className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Expenses & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Expenses */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground">
                  Recent Expenses
                </h2>
                <Link to="/expenses">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {recentExpenses.map((expense) => {
                  const safeBadgeClass = "bg-secondary text-secondary-foreground";
                  const typeIconKey = expense.paymentMethod?.name === "Credit Card" ? "credit-card" :
                    expense.paymentMethod?.name === "UPI" ? "upi" :
                      expense.paymentMethod?.name === "Cash" ? "cash" : "cash"; // Simple fallback mapping

                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-lg"
                        >
                          {expense.category?.icon || "💰"}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {expense.notes || "Expense"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${safeBadgeClass}`}
                              style={{
                                backgroundColor: expense.category?.color ? `${expense.category.color}20` : undefined,
                                color: expense.category?.color || undefined,
                              }}
                            >
                              {expense.category?.name || "Uncategorized"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(expense.expenseDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground text-lg">
                          {formatCurrency(parseFloat(expense.amountConverted))}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {expense.currencyOriginal}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link to="/expenses/new">
                  <Button className="w-full" size="lg">
                    Add New Expense
                  </Button>
                </Link>
                <Link to="/settings/categories">
                  <Button variant="outline" className="w-full">
                    Manage Categories
                  </Button>
                </Link>
                <Link to="/settings/spenders">
                  <Button variant="outline" className="w-full">
                    Manage Spenders
                  </Button>
                </Link>
                <Link to="/settings/apps">
                  <Button variant="outline" className="w-full">
                    Manage Apps
                  </Button>
                </Link>
                <Link to="/reports">
                  <Button variant="outline" className="w-full">
                    View Reports
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Monthly Summary */}
          </div>
        </div>
      </div>
    </Layout>
  );
}
