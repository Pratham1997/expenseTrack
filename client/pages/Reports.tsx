import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Calendar } from "lucide-react";

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

const MOCK_EXPENSES: Expense[] = [
  {
    id: "1",
    amount: 450,
    category: "Food",
    date: "2024-01-15",
    description: "Lunch",
    spender: "You",
    type: "credit-card",
    currency: "INR",
  },
  {
    id: "2",
    amount: 1200,
    category: "Transport",
    date: "2024-01-14",
    description: "Uber",
    spender: "You",
    type: "upi",
    currency: "INR",
  },
  {
    id: "3",
    amount: 5000,
    category: "Utilities",
    date: "2024-01-13",
    description: "Electricity",
    spender: "You",
    type: "cash",
    currency: "INR",
  },
  {
    id: "4",
    amount: 750,
    category: "Entertainment",
    date: "2024-01-12",
    description: "Movies",
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
  {
    id: "6",
    amount: 850,
    category: "Food",
    date: "2024-01-10",
    description: "Coffee",
    spender: "You",
    type: "cash",
    currency: "INR",
  },
  {
    id: "7",
    amount: 3000,
    category: "Shopping",
    date: "2024-01-09",
    description: "Clothes",
    spender: "You",
    type: "credit-card",
    currency: "INR",
  },
  {
    id: "8",
    amount: 1500,
    category: "Transport",
    date: "2023-12-25",
    description: "Gas",
    spender: "You",
    type: "cash",
    currency: "INR",
  },
  {
    id: "9",
    amount: 2200,
    category: "Food",
    date: "2023-12-20",
    description: "Restaurant",
    spender: "You",
    type: "credit-card",
    currency: "INR",
  },
  {
    id: "10",
    amount: 4000,
    category: "Entertainment",
    date: "2023-12-15",
    description: "Tickets",
    spender: "You",
    type: "credit-card",
    currency: "INR",
  },
];

const COLORS = {
  Food: "#f97316",
  Transport: "#3b82f6",
  Utilities: "#ef4444",
  Entertainment: "#a855f7",
  Shopping: "#10b981",
};

export default function Reports() {
  const [expenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [reportType, setReportType] = useState<"monthly" | "yearly">("monthly");
  const [selectedMonth, setSelectedMonth] = useState("2024-01");
  const [selectedYear, setSelectedYear] = useState("2024");

  // Monthly breakdown data
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    expenses.forEach((exp) => {
      const month = exp.date.substring(0, 7);
      months[month] = (months[month] || 0) + exp.amount;
    });
    return Object.entries(months)
      .sort()
      .map(([month, amount]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        amount: parseFloat(amount.toFixed(2)),
      }));
  }, [expenses]);

  // Category breakdown for selected month
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    expenses
      .filter((exp) => exp.date.startsWith(selectedMonth))
      .forEach((exp) => {
        categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
      });
    return Object.entries(categories)
      .map(([category, amount]) => ({
        name: category,
        value: parseFloat(amount.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, selectedMonth]);

  // Type breakdown for selected month
  const typeData = useMemo(() => {
    const types: Record<string, number> = {};
    expenses
      .filter((exp) => exp.date.startsWith(selectedMonth))
      .forEach((exp) => {
        types[exp.type] = (types[exp.type] || 0) + exp.amount;
      });
    return Object.entries(types).map(([type, amount]) => ({
      name: type === "credit-card" ? "Credit Card" : type.toUpperCase(),
      value: parseFloat(amount.toFixed(2)),
    }));
  }, [expenses, selectedMonth]);

  // Yearly data
  const yearlyData = useMemo(() => {
    const years: Record<string, number> = {};
    expenses.forEach((exp) => {
      const year = exp.date.substring(0, 4);
      years[year] = (years[year] || 0) + exp.amount;
    });
    return Object.entries(years)
      .sort()
      .map(([year, amount]) => ({
        year,
        amount: parseFloat(amount.toFixed(2)),
      }));
  }, [expenses]);

  const selectedMonthTotal =
    expenses
      .filter((exp) => exp.date.startsWith(selectedMonth))
      .reduce((sum, exp) => sum + exp.amount, 0) || 0;

  const selectedYearTotal =
    expenses
      .filter((exp) => exp.date.startsWith(selectedYear))
      .reduce((sum, exp) => sum + exp.amount, 0) || 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your spending patterns and trends
          </p>
        </div>

        {/* Report Type Selector */}
        <div className="flex gap-2">
          <Button
            variant={reportType === "monthly" ? "default" : "outline"}
            onClick={() => setReportType("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={reportType === "yearly" ? "default" : "outline"}
            onClick={() => setReportType("yearly")}
          >
            Yearly
          </Button>
        </div>

        {reportType === "monthly" ? (
          <>
            {/* Monthly Report */}
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Select Month
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  />
                </div>
              </div>
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <h3 className="text-4xl font-bold text-foreground mt-2">
                  ${selectedMonthTotal.toFixed(2)}
                </h3>
              </div>
            </Card>

            {/* Monthly Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  By Category
                </h3>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) =>
                          `${name}: $${value.toFixed(2)}`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              COLORS[entry.name as keyof typeof COLORS] ||
                              "#666"
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${(value as number).toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-72 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </Card>

              {/* Payment Type Distribution */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  By Payment Type
                </h3>
                {typeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={typeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="currentColor" />
                      <YAxis stroke="currentColor" />
                      <Tooltip formatter={(value) => `$${(value as number).toFixed(2)}`} />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-72 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </Card>
            </div>

            {/* Category Details Table */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Category Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Category
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">
                        Amount
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">
                        % of Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData.map((cat) => (
                      <tr
                        key={cat.name}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-foreground">{cat.name}</td>
                        <td className="text-right py-3 px-4 font-semibold text-foreground">
                          ${cat.value.toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          {selectedMonthTotal > 0
                            ? ((cat.value / selectedMonthTotal) * 100).toFixed(1)
                            : 0}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* Yearly Report */}
            <Card className="p-6">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Expenses ({selectedYear})
                </p>
                <h3 className="text-4xl font-bold text-foreground mt-2">
                  ${selectedYearTotal.toFixed(2)}
                </h3>
              </div>
            </Card>

            {/* Yearly Trend Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Monthly Trend
              </h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      stroke="currentColor"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis stroke="currentColor" />
                    <Tooltip formatter={(value) => `$${(value as number).toFixed(2)}`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Monthly Expense"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </Card>

            {/* Yearly Summary Table */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Yearly Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Year
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">
                        Total Expenses
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">
                        Monthly Average
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.map((year) => (
                      <tr
                        key={year.year}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-foreground">{year.year}</td>
                        <td className="text-right py-3 px-4 font-semibold text-foreground">
                          ${year.amount.toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          ${(year.amount / 12).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
