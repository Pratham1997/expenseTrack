import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    UserPlus,
    Settings2,
    Check,
    ChevronUp,
    User as UserIcon
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function UserSwitcher({ collapsed }: { collapsed?: boolean }) {
    const { user, users, switchUser, refreshUsers } = useUser();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isManageOpen, setIsManageOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [newName, setNewName] = useState("");

    const updateMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await fetch(`/api/users/${user?.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error("Failed to update user");
            return res.json();
        },
        onSuccess: () => {
            refreshUsers();
            queryClient.invalidateQueries({ queryKey: ["user", user?.id] });
            setIsManageOpen(false);
            toast({ title: "User renamed successfully" });
        }
    });

    const createMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, baseCurrency: "INR" }),
            });
            if (!res.ok) throw new Error("Failed to create user");
            return res.json();
        },
        onSuccess: (newUser) => {
            refreshUsers();
            setIsCreateOpen(false);
            setNewName("");
            toast({ title: "New user created" });
            switchUser(newUser.id);
        }
    });

    const handleRename = () => {
        if (editName.trim()) {
            updateMutation.mutate(editName);
        }
    };

    const handleCreate = () => {
        if (newName.trim()) {
            createMutation.mutate(newName);
        }
    };

    if (!user) return null;

    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className={`w-full flex items-center gap-3 px-2 h-14 hover:bg-sidebar-accent transition-colors ${collapsed ? 'justify-center' : 'justify-between'}`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-9 w-9 border border-sidebar-border">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            {!collapsed && (
                                <div className="flex flex-col items-start translate-y-[1px]">
                                    <span className="text-sm font-semibold text-sidebar-foreground truncate max-w-[120px]">
                                        {user.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                        Profile
                                    </span>
                                </div>
                            )}
                        </div>
                        {!collapsed && <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mb-2" align="start" side="right" sideOffset={10}>
                    <DropdownMenuLabel className="text-xs text-muted-foreground py-2">Switch Account</DropdownMenuLabel>
                    <div className="max-h-[200px] overflow-y-auto">
                        {users.map((u) => (
                            <DropdownMenuItem
                                key={u.id}
                                onClick={() => switchUser(u.id)}
                                className="flex items-center justify-between py-2 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${u.id === user.id ? 'bg-primary' : 'bg-transparent'}`} />
                                    <span className={u.id === user.id ? 'font-semibold' : ''}>{u.name}</span>
                                </div>
                                {u.id === user.id && <Check className="w-4 h-4 text-primary" />}
                            </DropdownMenuItem>
                        ))}
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => {
                            setEditName(user.name);
                            setIsManageOpen(true);
                        }}
                        className="gap-2 py-2 cursor-pointer"
                    >
                        <Settings2 className="w-4 h-4" />
                        <span>Manage Profile</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => setIsCreateOpen(true)}
                        className="gap-2 py-2 cursor-pointer text-primary focus:text-primary"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Create New User</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Rename Dialog */}
            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Update Profile</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">Display Name</label>
                        <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Enter name"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsManageOpen(false)}>Cancel</Button>
                        <Button onClick={handleRename} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? "Updating..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create User Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Create New Profile</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">Full Name</label>
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Personal Account"
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Each user profile gets its own unique categories, spenders, and expense records.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={createMutation.isPending}>
                            {createMutation.isPending ? "Creating..." : "Create Profile"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
