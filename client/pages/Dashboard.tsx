import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";
import { useMemo, useState } from "react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  spender: string;
  type: "credit-card" | "upi" | "cash";
  currency: string;
}

// Mock data for demonstration
const MOCK_EXPENSES: Expense[] = [
  {
    id: "1",
    amount: 450,
    category: "Food",
    date: "2024-01-15",
    description: "Lunch at restaurant",
    spender: "You",
    type: "credit-card",
    currency: "INR",
  },
  {
    id: "2",
    amount: 1200,
    category: "Transport",
    date: "2024-01-14",
    description: "Uber ride",
    spender: "You",
    type: "upi",
    currency: "INR",
  },
  {
    id: "3",
    amount: 5000,
    category: "Utilities",
    date: "2024-01-13",
    description: "Monthly electricity bill",
    spender: "You",
    type: "cash",
    currency: "INR",
  },
  {
    id: "4",
    amount: 750,
    category: "Entertainment",
    date: "2024-01-12",
    description: "Movie tickets",
    spender: "You",
    type: "credit-card",
    currency: "INR",
  },
  {
    id: "5",
    amount: 2000,
    category: "Shopping",
    date: "2024-01-11",
    description: "Groceries",
    spender: "You",
    type: "cash",
    currency: "INR",
  },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Food: { bg: "bg-orange-100", text: "text-orange-700" },
  Transport: { bg: "bg-blue-100", text: "text-blue-700" },
  Utilities: { bg: "bg-red-100", text: "text-red-700" },
  Entertainment: { bg: "bg-purple-100", text: "text-purple-700" },
  Shopping: { bg: "bg-green-100", text: "text-green-700" },
};

const TYPE_ICONS: Record<string, string> = {
  "credit-card": "💳",
  upi: "📱",
  cash: "💵",
};

export default function Dashboard() {
  const [expenses] = useState<Expense[]>(MOCK_EXPENSES);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const currentMonth = new Date().getMonth();
    const monthlyTotal = expenses
      .filter((exp) => new Date(exp.date).getMonth() === currentMonth)
      .reduce((sum, exp) => sum + exp.amount, 0);

    const categories = expenses.reduce(
      (acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    const topCategory = Object.entries(categories).sort(([, a], [, b]) => b - a)[0];

    return {
      total,
      monthlyTotal,
      expenseCount: expenses.length,
      topCategory,
    };
  }, [expenses]);

  const recentExpenses = expenses.slice(0, 5);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Expenses */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  ${stats.total.toFixed(2)}
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
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  ${stats.monthlyTotal.toFixed(2)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">January 2024</p>
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
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {stats.expenseCount}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Transactions</p>
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
                <p className="text-sm font-medium text-muted-foreground">Top Category</p>
                <h3 className="text-3xl font-bold text-foreground mt-2">
                  {stats.topCategory?.[0] || "N/A"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  ${(stats.topCategory?.[1] || 0).toFixed(2)}
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
                <h2 className="text-lg font-bold text-foreground">Recent Expenses</h2>
                <Link to="/expenses">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {recentExpenses.map((expense) => {
                  const colors = CATEGORY_COLORS[expense.category] || {
                    bg: "bg-gray-100",
                    text: "text-gray-700",
                  };
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center text-lg`}>
                          {TYPE_ICONS[expense.type] || "💰"}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{expense.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                              {expense.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(expense.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground text-lg">
                          ${expense.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{expense.currency}</p>
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
              <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
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
                <Link to="/reports">
                  <Button variant="outline" className="w-full">
                    View Reports
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Monthly Summary */}
            <Card className="p-6">
              <h3 className="font-bold text-foreground mb-4">Budget Status</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Monthly Limit</span>
                    <span className="text-sm font-medium text-foreground">$2,000</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-secondary to-primary h-2 rounded-full transition-all"
                      style={{ width: `${(stats.monthlyTotal / 2000) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ${(2000 - stats.monthlyTotal).toFixed(2)} remaining
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
