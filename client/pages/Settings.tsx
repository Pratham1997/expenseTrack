import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// --- Types ---
interface Category {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
}

interface Person {
  id: number;
  name: string;
  notes: string | null;
  relationshipType: string | null;
}

interface CreditCard {
  id: number;
  cardName: string;
  last4: string | null;
  bankName: string | null; // using this for "type"
  paymentMethodId: number;
}

interface PaymentMethod {
  id: number;
  name: string;
}

interface ExpenseApp {
  id: number;
  name: string;
  description: string | null;
}

const USER_ID = 1; // Hardcoded for now until Auth is ready

interface SettingsProps {
  tab?: "categories" | "spenders" | "cards" | "apps";
}

export default function Settings({ tab = "categories" }: SettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"categories" | "spenders" | "cards" | "apps">(tab);

  // Forms state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Category Form State
  const [newCategory, setNewCategory] = useState({ name: "", icon: "📝", color: "gray" });

  // Person Form State
  const [newPerson, setNewPerson] = useState<any>({ name: "", notes: "" });

  // Card Form State
  const [newCard, setNewCard] = useState({
    name: "",
    lastFour: "",
    type: "visa", // Will map to bankName
  });

  // App Form State
  const [newApp, setNewApp] = useState({ name: "", description: "" });

  useEffect(() => {
    setActiveTab(tab);
    resetForms();
  }, [tab]);

  const resetForms = () => {
    setShowAddForm(false);
    setEditingId(null);
    setNewCategory({ name: "", icon: "📝", color: "gray" });
    setNewPerson({ name: "", notes: "" });
    setNewCard({ name: "", lastFour: "", type: "visa" });
    setNewApp({ name: "", description: "" });
  };

  // --- Data Fetching ---
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch(`/api/categories?userId=${USER_ID}`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const { data: people = [] } = useQuery<Person[]>({
    queryKey: ["people"],
    queryFn: async () => {
      const res = await fetch(`/api/people?userId=${USER_ID}`);
      if (!res.ok) throw new Error("Failed to fetch people");
      return res.json();
    },
  });

  const { data: creditCards = [] } = useQuery<CreditCard[]>({
    queryKey: ["credit-cards"],
    queryFn: async () => {
      const res = await fetch(`/api/credit-cards?userId=${USER_ID}`);
      if (!res.ok) throw new Error("Failed to fetch credit cards");
      return res.json();
    },
  });

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const res = await fetch("/api/payment-methods");
      if (!res.ok) throw new Error("Failed to fetch payment methods");
      return res.json();
    },
  });

  // --- Mutations ---

  // 1. Categories
  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: USER_ID, isActive: true }),
      });
      if (!res.ok) throw new Error("Failed to create category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      resetForms();
      toast({ title: "Category created" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: Partial<Category> & { id: number }) => {
      const res = await fetch(`/api/categories/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      resetForms();
      toast({ title: "Category updated" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category deleted" });
    },
  });

  // 2. People (Spenders)
  const createPersonMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: USER_ID, isActive: true }),
      });
      if (!res.ok) throw new Error("Failed to create person");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      resetForms();
      toast({ title: "Person added" });
    },
  });

  const updatePersonMutation = useMutation({
    mutationFn: async (data: Partial<Person> & { id: number }) => {
      const res = await fetch(`/api/people/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update person");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      resetForms();
      toast({ title: "Person updated" });
    },
  });

  const deletePersonMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/people/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      toast({ title: "Person deleted" });
    },
  });

  // 3. Credit Cards
  const createCardMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Fetch current payment methods to see if we have one
      let res = await fetch("/api/payment-methods");
      if (!res.ok) throw new Error("Failed to check payment methods");
      let pms = await res.json();

      // 2. Try to find a suitable payment method
      let pmId = pms.find((p: any) => p.name === "Credit Card" || p.name === "Credit Cards")?.id;

      // 3. Fallback: use the first one if available
      if (!pmId && pms.length > 0) {
        pmId = pms[0].id;
      }

      // 4. If absolutely no payment methods exist, create a default one
      if (!pmId) {
        const createPmRes = await fetch("/api/payment-methods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Credit Card", isSystem: true, isActive: true })
        });

        if (!createPmRes.ok) throw new Error("Failed to create default payment method");

        const newPm = await createPmRes.json();
        pmId = newPm.id;
      }

      const payload = {
        userId: USER_ID,
        paymentMethodId: pmId,
        cardName: data.name,
        last4: data.lastFour,
        isActive: true,
        bankName: data.type, // Map UI 'type' to backend 'bankName'
      };

      const cardRes = await fetch("/api/credit-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!cardRes.ok) throw new Error("Failed to create card");
      return cardRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] }); // Refresh PMs too
      resetForms();
      toast({ title: "Credit Card added" });
    },
    onError: (err) => {
      toast({ title: "Error adding card", description: err.message, variant: "destructive" });
    }
  });

  const updateCardMutation = useMutation({
    mutationFn: async (data: any & { id: number }) => {
      const payload: any = {
        cardName: data.name,
        last4: data.lastFour,
        bankName: data.type,
      };

      const res = await fetch(`/api/credit-cards/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update credit card");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      resetForms();
      toast({ title: "Credit Card updated" });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/credit-cards/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      toast({ title: "Card deleted" });
    },
  });

  // Expense Apps
  const { data: expenseApps = [] } = useQuery<ExpenseApp[]>({
    queryKey: ["expense-apps"],
    queryFn: async () => {
      const res = await fetch(`/api/expense-apps?userId=${USER_ID}`);
      if (!res.ok) throw new Error("Failed to fetch expense apps");
      return res.json();
    },
  });

  const createAppMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/expense-apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: USER_ID, isActive: true }),
      });
      if (!res.ok) throw new Error("Failed to create app");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-apps"] });
      resetForms();
      toast({ title: "App added" });
    },
  });

  const updateAppMutation = useMutation({
    mutationFn: async (data: Partial<ExpenseApp> & { id: number }) => {
      const res = await fetch(`/api/expense-apps/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update app");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-apps"] });
      resetForms();
      toast({ title: "App updated" });
    },
  });

  const deleteAppMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/expense-apps/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-apps"] });
      toast({ title: "App deleted" });
    },
  });


  // --- Handlers ---
  const handleSaveCategory = () => {
    if (!newCategory.name.trim()) return;

    if (editingId) {
      updateCategoryMutation.mutate({
        id: editingId,
        name: newCategory.name,
        icon: newCategory.icon,
        color: newCategory.color,
      });
    } else {
      createCategoryMutation.mutate({
        name: newCategory.name,
        icon: newCategory.icon,
        color: newCategory.color,
      });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingId(category.id);
    setNewCategory({
      name: category.name,
      icon: category.icon || "📝",
      color: category.color || "gray",
    });
    setShowAddForm(true);
  };

  const handleSavePerson = () => {
    if (!newPerson.name.trim()) return;

    if (editingId) {
      updatePersonMutation.mutate({
        id: editingId,
        name: newPerson.name,
        notes: newPerson.notes,
        relationshipType: ""
      });
    } else {
      createPersonMutation.mutate({
        name: newPerson.name,
        notes: newPerson.notes,
        relationshipType: ""
      });
    }
  };

  const handleEditPerson = (person: Person) => {
    setEditingId(person.id);
    setNewPerson({
      name: person.name,
      notes: person.notes || "",
    });
    setShowAddForm(true);
  };

  const handleSaveCard = () => {
    if (!newCard.name.trim() || !newCard.lastFour.trim()) return;

    if (editingId) {
      updateCardMutation.mutate({
        id: editingId,
        ...newCard
      });
    } else {
      createCardMutation.mutate(newCard);
    }
  };

  const handleEditCard = (card: CreditCard) => {
    setEditingId(card.id);
    setNewCard({
      name: card.cardName,
      lastFour: card.last4 || "",
      type: (card.bankName as any) || "visa",
    });
    setShowAddForm(true);
  };

  const handleSaveApp = () => {
    if (!newApp.name.trim()) return;

    if (editingId) {
      updateAppMutation.mutate({
        id: editingId,
        name: newApp.name,
        description: newApp.description,
      });
    } else {
      createAppMutation.mutate({
        name: newApp.name,
        description: newApp.description,
      });
    }
  };

  const handleEditApp = (app: ExpenseApp) => {
    setEditingId(app.id);
    setNewApp({
      name: app.name,
      description: app.description || "",
    });
    setShowAddForm(true);
  };

  const isSaving =
    createCategoryMutation.isPending || updateCategoryMutation.isPending ||
    createPersonMutation.isPending || updatePersonMutation.isPending ||
    createCardMutation.isPending || updateCardMutation.isPending ||
    createAppMutation.isPending || updateAppMutation.isPending;

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
        <div className="flex gap-2 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "categories"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab("spenders")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "spenders"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Spenders
          </button>
          <button
            onClick={() => setActiveTab("cards")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "cards"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Credit Cards
          </button>
          <button
            onClick={() => setActiveTab("apps")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "apps"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Apps
          </button>
        </div>

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">
                Expense Categories
              </h2>
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </Button>
              )}
            </div>

            {showAddForm && (
              <Card className="p-4 bg-muted/30 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 md:hidden"
                  onClick={resetForms}
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <Input
                    placeholder="Category name"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Icon (e.g. 🍔)"
                    value={newCategory.icon}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, icon: e.target.value })
                    }
                    className="sm:w-24"
                    maxLength={2}
                  />
                  <Button onClick={handleSaveCategory} disabled={isSaving}>
                    {isSaving ? "Saving..." : (editingId ? "Update" : "Save")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForms}
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
                    <span className="text-3xl">{category.icon || "📁"}</span>
                    <h3 className="font-semibold text-foreground">
                      {category.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteCategoryMutation.mutate(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            {categories.length === 0 && (
              <div className="text-center text-muted-foreground py-8">No categories found. Add one to get started!</div>
            )}
          </div>
        )}

        {/* Spenders Tab */}
        {activeTab === "spenders" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">Spenders (People)</h2>
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Spender
                </Button>
              )}
            </div>

            {showAddForm && (
              <Card className="p-4 bg-muted/30 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 md:hidden"
                  onClick={resetForms}
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="flex gap-3 flex-col md:flex-row">
                  <Input
                    placeholder="Name"
                    value={newPerson.name}
                    onChange={(e) =>
                      setNewPerson({ ...newPerson, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Notes (optional)"
                    value={newPerson.notes}
                    onChange={(e) =>
                      setNewPerson({ ...newPerson, notes: e.target.value })
                    }
                  />
                  <Button onClick={handleSavePerson} disabled={isSaving}>
                    {isSaving ? "Saving..." : (editingId ? "Update" : "Save")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForms}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {people.map((person) => (
                <Card
                  key={person.id}
                  className="p-4 flex items-center justify-between hover:shadow-md transition-all"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {person.name}
                    </h3>
                    {person.notes && (
                      <p className="text-sm text-muted-foreground">
                        {person.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground uppercase mt-1">
                      {person.relationshipType}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditPerson(person)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deletePersonMutation.mutate(person.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            {people.length === 0 && (
              <div className="text-center text-muted-foreground py-8">No people added yet.</div>
            )}
          </div>
        )}

        {/* Credit Cards Tab */}
        {activeTab === "cards" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">
                Credit Cards
              </h2>
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Card
                </Button>
              )}
            </div>

            {showAddForm && (
              <Card className="p-4 bg-muted/30 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 md:hidden"
                  onClick={resetForms}
                >
                  <X className="w-4 h-4" />
                </Button>
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
                        type: e.target.value,
                      })
                    }
                    className="px-3 py-2 bg-background border border-border rounded-lg text-foreground cursor-pointer"
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">American Express</option>
                    <option value="other">Other</option>
                  </select>
                  <Button onClick={handleSaveCard} disabled={isSaving}>
                    {isSaving ? "Saving..." : (editingId ? "Update" : "Save")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForms}
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
                      {card.bankName ? card.bankName.toUpperCase() : "CARD"}
                    </div>
                    <div className="text-2xl font-bold tracking-widest">
                      •••• {card.last4}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-white/70 mb-1">CARD NAME</p>
                        <p className="font-semibold text-sm">{card.cardName}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                          onClick={() => handleEditCard(card)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                          onClick={() => deleteCardMutation.mutate(card.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {creditCards.length === 0 && (
              <div className="text-center text-muted-foreground py-8">No cards added yet.</div>
            )}
          </div>
        )}

        {/* Apps Tab */}
        {activeTab === "apps" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Expense Apps
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage apps like Swiggy, Uber, Zomato etc. for automatic descriptions.
                </p>
              </div>
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add App
                </Button>
              )}
            </div>

            {showAddForm && (
              <Card className="p-4 bg-muted/30 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 md:hidden"
                  onClick={resetForms}
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="flex gap-3 flex-col md:flex-row">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="App Name (e.g., Swiggy, Uber)"
                      value={newApp.name}
                      onChange={(e) =>
                        setNewApp({ ...newApp, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex-[2] space-y-2">
                    <Input
                      placeholder="Description (optional)"
                      value={newApp.description}
                      onChange={(e) =>
                        setNewApp({ ...newApp, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveApp} disabled={isSaving}>
                      {isSaving ? "Saving..." : (editingId ? "Update" : "Save")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetForms}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseApps.map((app) => (
                <Card
                  key={app.id}
                  className="p-4 hover:shadow-md transition-shadow relative group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{app.name}</h3>
                      {app.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {app.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditApp(app)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          deleteAppMutation.mutate(app.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {expenseApps.length === 0 && !showAddForm && (
                <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  <p>No expense apps added yet.</p>
                  <Button
                    variant="link"
                    onClick={() => setShowAddForm(true)}
                    className="mt-2"
                  >
                    Add your first app
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
