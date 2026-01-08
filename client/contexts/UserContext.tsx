import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface User {
    id: number;
    name: string;
    email: string | null;
    baseCurrency: string;
}

interface UserContextType {
    userId: number;
    user: User | null;
    isLoading: boolean;
    switchUser: (id: number) => void;
    users: User[];
    refreshUsers: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const [userId, setUserId] = useState<number>(() => {
        const saved = localStorage.getItem("expense_track_user_id");
        return saved ? parseInt(saved) : 1;
    });

    const { data: users = [], refetch: refreshUsers } = useQuery<User[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await fetch("/api/users");
            if (!res.ok) throw new Error("Failed to fetch users");
            return res.json();
        },
    });

    const { data: user = null, isLoading } = useQuery<User>({
        queryKey: ["user", userId],
        queryFn: async () => {
            const res = await fetch(`/api/users/${userId}`);
            if (!res.ok) throw new Error("User not found");
            return res.json();
        },
        enabled: !!userId,
    });

    const switchUser = (id: number) => {
        setUserId(id);
        localStorage.setItem("expense_track_user_id", id.toString());
        // Invalidate all user-dependent data
        queryClient.invalidateQueries();
    };

    return (
        <UserContext.Provider value={{ userId, user, isLoading, switchUser, users, refreshUsers }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
