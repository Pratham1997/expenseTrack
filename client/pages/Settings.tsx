import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Spender {
  id: string;
  name: string;
  email?: string;
}

interface CreditCard {
  id: string;
  name: string;
  lastFour: string;
  type: "visa" | "mastercard" | "amex" | "other";
}

const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Food", icon: "🍔", color: "orange" },
  { id: "2", name: "Transport", icon: "🚗", color: "blue" },
  { id: "3", name: "Utilities", icon: "💡", color: "red" },
  { id: "4", name: "Entertainment", icon: "🎬", color: "purple" },
  { id: "5", name: "Shopping", icon: "🛍️", color: "green" },
];

const MOCK_SPENDERS: Spender[] = [
  { id: "1", name: "You" },
  { id: "2", name: "Alice Johnson", email: "alice@example.com" },
  { id: "3", name: "Bob Smith", email: "bob@example.com" },
];

const MOCK_CREDIT_CARDS: CreditCard[] = [
  { id: "1", name: "Personal Visa", lastFour: "4242", type: "visa" },
  { id: "2", name: "Work Mastercard", lastFour: "5555", type: "mastercard" },
];

interface SettingsProps {
  tab?: "categories" | "spenders" | "cards";
}

export default function Settings({ tab = "categories" }: SettingsProps) {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [spenders, setSpenders] = useState<Spender[]>(MOCK_SPENDERS);
  const [creditCards, setCreditCards] =
    useState<CreditCard[]>(MOCK_CREDIT_CARDS);

  const [activeTab, setActiveTab] = useState<
    "categories" | "spenders" | "cards"
  >(tab);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", email: "", icon: "📝" });
  const [newCard, setNewCard] = useState({
    name: "",
    lastFour: "",
    type: "visa" as const,
  });

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((cat) => cat.id !== id));
  };

  const handleDeleteSpender = (id: string) => {
    setSpenders(spenders.filter((spender) => spender.id !== id));
  };

  const handleDeleteCard = (id: string) => {
    setCreditCards(creditCards.filter((card) => card.id !== id));
  };

  const handleAddCategory = () => {
    if (newItem.name.trim()) {
      const newCategory: Category = {
        id: Math.random().toString(),
        name: newItem.name,
        icon: newItem.icon,
        color: "gray",
      };
      setCategories([...categories, newCategory]);
      setNewItem({ name: "", email: "", icon: "📝" });
      setShowAddForm(false);
    }
  };

  const handleAddSpender = () => {
    if (newItem.name.trim()) {
      const newSpender: Spender = {
        id: Math.random().toString(),
        name: newItem.name,
        email: newItem.email,
      };
      setSpenders([...spenders, newSpender]);
      setNewItem({ name: "", email: "", icon: "📝" });
      setShowAddForm(false);
    }
  };

  const handleAddCard = () => {
    if (newCard.name.trim() && newCard.lastFour.trim()) {
      const card: CreditCard = {
        id: Math.random().toString(),
        name: newCard.name,
        lastFour: newCard.lastFour,
        type: newCard.type,
      };
      setCreditCards([...creditCards, card]);
      setNewCard({ name: "", lastFour: "", type: "visa" });
      setShowAddForm(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your categories, spenders, and payment methods
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "categories"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab("spenders")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "spenders"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Spenders
          </button>
          <button
            onClick={() => setActiveTab("cards")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "cards"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Credit Cards
          </button>
        </div>

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">
                Expense Categories
              </h2>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </div>

            {showAddForm && (
              <Card className="p-4 bg-muted/30">
                <div className="flex gap-3">
                  <Input
                    placeholder="Category name"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Icon"
                    value={newItem.icon}
                    onChange={(e) =>
                      setNewItem({ ...newItem, icon: e.target.value })
                    }
                    maxLength={2}
                  />
                  <Button onClick={handleAddCategory}>Save</Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="p-4 flex items-center justify-between hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{category.icon}</span>
                    <h3 className="font-semibold text-foreground">
                      {category.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Spenders Tab */}
        {activeTab === "spenders" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">Spenders</h2>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Spender
              </Button>
            </div>

            {showAddForm && (
              <Card className="p-4 bg-muted/30">
                <div className="flex gap-3 flex-col md:flex-row">
                  <Input
                    placeholder="Name"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Email (optional)"
                    value={newItem.email}
                    onChange={(e) =>
                      setNewItem({ ...newItem, email: e.target.value })
                    }
                  />
                  <Button onClick={handleAddSpender}>Save</Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {spenders.map((spender) => (
                <Card
                  key={spender.id}
                  className="p-4 flex items-center justify-between hover:shadow-md transition-all"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {spender.name}
                    </h3>
                    {spender.email && (
                      <p className="text-sm text-muted-foreground">
                        {spender.email}
                      </p>
                    )}
                  </div>
                  {spender.id !== "1" && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteSpender(spender.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Credit Cards Tab */}
        {activeTab === "cards" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">
                Credit Cards
              </h2>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Card
              </Button>
            </div>

            {showAddForm && (
              <Card className="p-4 bg-muted/30">
                <div className="flex gap-3 flex-col md:flex-row">
                  <Input
                    placeholder="Card Name (e.g., Personal Visa)"
                    value={newCard.name}
                    onChange={(e) =>
                      setNewCard({ ...newCard, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Last 4 digits"
                    value={newCard.lastFour}
                    onChange={(e) =>
                      setNewCard({ ...newCard, lastFour: e.target.value })
                    }
                    maxLength={4}
                  />
                  <select
                    value={newCard.type}
                    onChange={(e) =>
                      setNewCard({
                        ...newCard,
                        type: e.target.value as
                          | "visa"
                          | "mastercard"
                          | "amex"
                          | "other",
                      })
                    }
                    className="px-3 py-2 bg-background border border-border rounded-lg text-foreground cursor-pointer"
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">American Express</option>
                    <option value="other">Other</option>
                  </select>
                  <Button onClick={handleAddCard}>Save</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCard({ name: "", lastFour: "", type: "visa" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creditCards.map((card) => (
                <Card
                  key={card.id}
                  className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden"
                >
                  {/* Card decoration */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-10 -mb-10" />

                  <div className="relative space-y-4">
                    <div className="text-lg font-bold tracking-wider">
                      {card.type.toUpperCase()}
                    </div>
                    <div className="text-2xl font-bold tracking-widest">
                      •••• {card.lastFour}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-white/70 mb-1">CARD NAME</p>
                        <p className="font-semibold text-sm">{card.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
