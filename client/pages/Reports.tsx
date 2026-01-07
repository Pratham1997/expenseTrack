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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Calendar, TrendingUp, Users, Smartphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
  type?: string;
}

const COLORS = {
  Food: "#f97316",
  Transport: "#3b82f6",
  Utilities: "#ef4444",
  Entertainment: "#a855f7",
  Shopping: "#10b981",
  Health: "#ec4899",
  Education: "#8b5cf6",
  Other: "#6b7280",
};

const CHART_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#14b8a6"];

export default function Reports() {
  const [reportType, setReportType] = useState<"monthly" | "yearly" | "custom">("monthly");

  // Default to current month/year
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear().toString());
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // --- Data Fetching ---
  const { data: expenses = [], isLoading, error } = useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: async () => {
      const res = await fetch(`/api/expenses?limit=1000`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json();
    },
  });


  // Monthly breakdown data (All time trend)
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    expenses.forEach((exp) => {
      const month = exp.expenseDate.substring(0, 7);
      months[month] = (months[month] || 0) + parseFloat(exp.amountConverted);
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
      .filter((exp) => exp.expenseDate.startsWith(selectedMonth))
      .forEach((exp) => {
        const catName = exp.category?.name || "Uncategorized";
        categories[catName] = (categories[catName] || 0) + parseFloat(exp.amountConverted);
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
      .filter((exp) => exp.expenseDate.startsWith(selectedMonth))
      .forEach((exp) => {
        const typeName = exp.paymentMethod?.name || "Unknown";
        types[typeName] = (types[typeName] || 0) + parseFloat(exp.amountConverted);
      });
    return Object.entries(types).map(([type, amount]) => ({
      name: type,
      value: parseFloat(amount.toFixed(2)),
    }));
  }, [expenses, selectedMonth]);

  // App breakdown for selected month
  const appData = useMemo(() => {
    const apps: Record<string, number> = {};
    expenses
      .filter((exp) => exp.expenseDate.startsWith(selectedMonth))
      .forEach((exp) => {
        const appName = exp.expenseApp?.name || "Manual";
        apps[appName] = (apps[appName] || 0) + parseFloat(exp.amountConverted);
      });
    return Object.entries(apps)
      .map(([app, amount]) => ({
        name: app,
        value: parseFloat(amount.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 apps
  }, [expenses, selectedMonth]);

  // Spender breakdown for selected month
  const spenderData = useMemo(() => {
    const spenders: Record<string, number> = {};
    expenses
      .filter((exp) => exp.expenseDate.startsWith(selectedMonth))
      .forEach((exp) => {
        const spenderName = exp.paidByPerson?.name || "Me";
        spenders[spenderName] = (spenders[spenderName] || 0) + parseFloat(exp.amountConverted);
      });
    return Object.entries(spenders).map(([spender, amount]) => ({
      name: spender,
      value: parseFloat(amount.toFixed(2)),
    }));
  }, [expenses, selectedMonth]);

  // Yearly Category breakdown
  const yearlyCategoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    expenses
      .filter((exp) => exp.expenseDate.startsWith(selectedYear))
      .forEach((exp) => {
        const catName = exp.category?.name || "Uncategorized";
        categories[catName] = (categories[catName] || 0) + parseFloat(exp.amountConverted);
      });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, selectedYear]);

  // Yearly App breakdown
  const yearlyAppData = useMemo(() => {
    const apps: Record<string, number> = {};
    expenses
      .filter((exp) => exp.expenseDate.startsWith(selectedYear))
      .forEach((exp) => {
        const appName = exp.expenseApp?.name || "Manual";
        apps[appName] = (apps[appName] || 0) + parseFloat(exp.amountConverted);
      });
    return Object.entries(apps)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, selectedYear]);

  // Yearly Payment Method breakdown
  const yearlyPaymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {};
    expenses
      .filter((exp) => exp.expenseDate.startsWith(selectedYear))
      .forEach((exp) => {
        const methodName = exp.paymentMethod?.name || "Unknown";
        methods[methodName] = (methods[methodName] || 0) + parseFloat(exp.amountConverted);
      });
    return Object.entries(methods)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, selectedYear]);

  // Yearly Spender breakdown
  const yearlySpenderData = useMemo(() => {
    const spenders: Record<string, number> = {};
    expenses
      .filter((exp) => exp.expenseDate.startsWith(selectedYear))
      .forEach((exp) => {
        const spenderName = exp.paidByPerson?.name || "Me";
        spenders[spenderName] = (spenders[spenderName] || 0) + parseFloat(exp.amountConverted);
      });
    return Object.entries(spenders)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, selectedYear]);

  // Monthly trend specifically for the selected year
  const selectedYearTrend = useMemo(() => {
    const monthTotals: Record<number, number> = {};
    // Initialize all months to 0
    for (let i = 1; i <= 12; i++) monthTotals[i] = 0;

    expenses
      .filter((exp) => exp.expenseDate.startsWith(selectedYear))
      .forEach((exp) => {
        const month = parseInt(exp.expenseDate.substring(5, 7));
        monthTotals[month] += parseFloat(exp.amountConverted);
      });

    return Object.entries(monthTotals).map(([month, amount]) => {
      const date = new Date(parseInt(selectedYear), parseInt(month) - 1, 1);
      return {
        month: date.toLocaleDateString("en-US", { month: "short" }),
        amount: parseFloat(amount.toFixed(2)),
      };
    });
  }, [expenses, selectedYear]);

  // Day of week analysis
  const dayOfWeekData = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayTotals: Record<string, number> = {};

    expenses
      .filter((exp) => exp.expenseDate.startsWith(selectedMonth))
      .forEach((exp) => {
        const dayIndex = new Date(exp.expenseDate).getDay();
        const dayName = days[dayIndex];
        dayTotals[dayName] = (dayTotals[dayName] || 0) + parseFloat(exp.amountConverted);
      });

    return days.map(day => ({
      day,
      amount: parseFloat((dayTotals[day] || 0).toFixed(2)),
    }));
  }, [expenses, selectedMonth]);

  // Yearly data
  const yearlyData = useMemo(() => {
    const years: Record<string, number> = {};
    expenses.forEach((exp) => {
      const year = exp.expenseDate.substring(0, 4);
      years[year] = (years[year] || 0) + parseFloat(exp.amountConverted);
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
      .filter((exp) => exp.expenseDate.startsWith(selectedMonth))
      .reduce((sum, exp) => sum + parseFloat(exp.amountConverted), 0) || 0;

  const selectedYearTotal =
    expenses
      .filter((exp) => exp.expenseDate.startsWith(selectedYear))
      .reduce((sum, exp) => sum + parseFloat(exp.amountConverted), 0) || 0;

  const customRangeTotal = useMemo(() => {
    if (!customStartDate || !customEndDate) return 0;
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
    endDate.setHours(23, 59, 59, 999);

    return expenses
      .filter((exp) => {
        const expDate = new Date(exp.expenseDate);
        return expDate >= startDate && expDate <= endDate;
      })
      .reduce((sum, exp) => sum + parseFloat(exp.amountConverted), 0) || 0;
  }, [expenses, customStartDate, customEndDate]);

  // Custom range filtered expenses
  const customRangeExpenses = useMemo(() => {
    if (!customStartDate || !customEndDate) return [];
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
    endDate.setHours(23, 59, 59, 999);

    return expenses.filter((exp) => {
      const expDate = new Date(exp.expenseDate);
      return expDate >= startDate && expDate <= endDate;
    });
  }, [expenses, customStartDate, customEndDate]);

  if (isLoading) return <Layout><div className="flex justify-center p-8">Loading reports...</div></Layout>;
  if (error) return <Layout><div className="text-red-500 p-8">Error loading reports</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Reports & Analytics
          </h1>
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
          {/* <Button
            variant={reportType === "custom" ? "default" : "outline"}
            onClick={() => setReportType("custom")}
          >
            Custom Range
          </Button> */}
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
                <p className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </p>
                <h3 className="text-4xl font-bold text-foreground mt-2">
                  {formatCurrency(selectedMonthTotal)}
                </h3>
              </div>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p className="text-xl font-bold text-foreground">{categoryData.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Apps Used</p>
                    <p className="text-xl font-bold text-foreground">{appData.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Spenders</p>
                    <p className="text-xl font-bold text-foreground">{spenderData.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Monthly Charts - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  By Category
                </h3>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={categoryData}
                      layout="vertical"
                      margin={{ left: 20, right: 30, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              COLORS[entry.name as keyof typeof COLORS] ||
                              CHART_COLORS[index % CHART_COLORS.length]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
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
                  By Payment Method
                </h3>
                {typeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={typeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="currentColor" />
                      <YAxis stroke="currentColor" />
                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(value as number)
                        }
                      />
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

            {/* Monthly Charts - Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* App Distribution */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  By App (Top 10)
                </h3>
                {appData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={appData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" stroke="currentColor" />
                      <YAxis dataKey="name" type="category" width={100} stroke="currentColor" />
                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(value as number)
                        }
                      />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-72 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </Card>

              {/* Spender Distribution */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  By Spender
                </h3>
                {spenderData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={spenderData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) =>
                          `${name}: ${formatCurrency(value)}`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {spenderData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(value as number)
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-72 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </Card>
            </div>

            {/* Day of Week Analysis */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Spending by Day of Week
              </h3>
              {dayOfWeekData.some(d => d.amount > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" stroke="currentColor" />
                    <YAxis stroke="currentColor" />
                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value as number)
                      }
                    />
                    <Bar dataKey="amount" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-72 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </Card>

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
                        <td className="py-3 px-4 text-foreground">
                          {cat.name}
                        </td>
                        <td className="text-right py-3 px-4 font-semibold text-foreground">
                          {formatCurrency(cat.value)}
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          {selectedMonthTotal > 0
                            ? ((cat.value / selectedMonthTotal) * 100).toFixed(
                              1,
                            )
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
              <div className="flex items-center gap-4 mb-6">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Select Year
                  </label>
                  <input
                    type="number"
                    min="2000"
                    max={new Date().getFullYear() + 1}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-lg text-foreground w-32"
                  />
                </div>
              </div>
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Expenses ({selectedYear})
                </p>
                <h3 className="text-4xl font-bold text-foreground mt-2">
                  {formatCurrency(selectedYearTotal)}
                </h3>
              </div>
            </Card>

            {/* Yearly Trend Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Monthly Trend ({selectedYear})
              </h3>
              {selectedYearTrend.some(d => d.amount > 0) ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={selectedYearTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      stroke="currentColor"
                    />
                    <YAxis stroke="currentColor" />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Monthly Total"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  No data available for this year
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Expenses by Category
                </h3>
                {yearlyCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={yearlyCategoryData} layout="vertical" margin={{ left: 40, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="currentColor"
                        width={100}
                        fontSize={12}
                      />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {yearlyCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">No data available</div>
                )}
              </Card>

              {/* App Breakdown */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  Expenses by App
                </h3>
                {yearlyAppData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={yearlyAppData} layout="vertical" margin={{ left: 40, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="currentColor"
                        width={100}
                        fontSize={12}
                      />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {yearlyAppData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">No data available</div>
                )}
              </Card>

              {/* Payment Method Breakdown */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Payment Methods
                </h3>
                {yearlyPaymentMethodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={yearlyPaymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {yearlyPaymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
                )}
              </Card>

              {/* Spender Breakdown */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Expenses by Spender
                </h3>
                {yearlySpenderData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={yearlySpenderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {yearlySpenderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
                )}
              </Card>
            </div>

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
                        <td className="py-3 px-4 text-foreground">
                          {year.year}
                        </td>
                        <td className="text-right py-3 px-4 font-semibold text-foreground">
                          {formatCurrency(year.amount)}
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          {formatCurrency(year.amount / 12)}
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
