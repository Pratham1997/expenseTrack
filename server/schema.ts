import {
    mysqlTable,
    bigint,
    varchar,
    char,
    timestamp,
    text,
    boolean,
    int,
    tinyint,
    decimal,
    datetime,
    uniqueIndex,
    index,
    primaryKey,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";

// -- Users --
export const users = mysqlTable("users", {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    email: varchar("email", { length: 255 }).unique(),
    name: varchar("name", { length: 255 }),
    baseCurrency: char("base_currency", { length: 3 }).notNull().default("INR"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .onUpdateNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
    categories: many(categories),
    people: many(people),
    creditCards: many(creditCards),
    expenseApps: many(expenseApps),
    expenses: many(expenses),
    monthlyNotes: many(monthlyNotes),
}));

// -- Categories --
export const categories = mysqlTable("categories", {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    userId: bigint("user_id", { mode: "number" })
        .notNull()
        .references(() => users.id),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 20 }),
    icon: varchar("icon", { length: 50 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .onUpdateNow(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    user: one(users, {
        fields: [categories.userId],
        references: [users.id],
    }),
    expenses: many(expenses),
}));

// -- People --
export const people = mysqlTable("people", {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    userId: bigint("user_id", { mode: "number" })
        .notNull()
        .references(() => users.id),
    name: varchar("name", { length: 150 }).notNull(),
    notes: text("notes"),
    relationshipType: varchar("relationship_type", { length: 50 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .onUpdateNow(),
});

export const peopleRelations = relations(people, ({ one, many }) => ({
    user: one(users, {
        fields: [people.userId],
        references: [users.id],
    }),
    expensesPaid: many(expenses, { relationName: "paidBy" }),
    participations: many(expenseParticipants),
}));

// -- Payment Methods --
export const paymentMethods = mysqlTable("payment_methods", {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    name: varchar("name", { length: 50 }).notNull(),
    isSystem: boolean("is_system").default(true),
});

export const paymentMethodsRelations = relations(paymentMethods, ({ many }) => ({
    creditCards: many(creditCards),
    expenses: many(expenses),
}));

// -- Credit Cards --
export const creditCards = mysqlTable("credit_cards", {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    userId: bigint("user_id", { mode: "number" })
        .notNull()
        .references(() => users.id),
    paymentMethodId: bigint("payment_method_id", { mode: "number" })
        .notNull()
        .references(() => paymentMethods.id),
    cardName: varchar("card_name", { length: 100 }).notNull(),
    bankName: varchar("bank_name", { length: 100 }),
    last4: char("last4", { length: 4 }),
    billingCycleStart: tinyint("billing_cycle_start"),
    billingCycleEnd: tinyint("billing_cycle_end"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .onUpdateNow(),
});

export const creditCardsRelations = relations(creditCards, ({ one, many }) => ({
    user: one(users, {
        fields: [creditCards.userId],
        references: [users.id],
    }),
    paymentMethod: one(paymentMethods, {
        fields: [creditCards.paymentMethodId],
        references: [paymentMethods.id],
    }),
    expenses: many(expenses),
}));

// -- Expense Apps --
export const expenseApps = mysqlTable("expense_apps", {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    userId: bigint("user_id", { mode: "number" })
        .notNull()
        .references(() => users.id),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .onUpdateNow(),
});

export const expenseAppsRelations = relations(expenseApps, ({ one, many }) => ({
    user: one(users, {
        fields: [expenseApps.userId],
        references: [users.id],
    }),
    expenses: many(expenses),
}));

// -- Currencies --
export const currencies = mysqlTable("currencies", {
    code: char("code", { length: 3 }).primaryKey(),
    name: varchar("name", { length: 50 }),
    symbol: varchar("symbol", { length: 10 }),
});

// -- Expenses --
export const expenses = mysqlTable(
    "expenses",
    {
        id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
        userId: bigint("user_id", { mode: "number" })
            .notNull()
            .references(() => users.id),
        categoryId: bigint("category_id", { mode: "number" }).references(
            () => categories.id
        ),
        paidByPersonId: bigint("paid_by_person_id", { mode: "number" }).references(
            () => people.id
        ),
        paymentMethodId: bigint("payment_method_id", { mode: "number" })
            .notNull()
            .references(() => paymentMethods.id),
        creditCardId: bigint("credit_card_id", { mode: "number" }).references(
            () => creditCards.id
        ),
        expenseAppId: bigint("expense_app_id", { mode: "number" }).references(
            () => expenseApps.id
        ),

        amountOriginal: decimal("amount_original", { precision: 12, scale: 2 })
            .notNull(),
        currencyOriginal: char("currency_original", { length: 3 })
            .notNull()
            .references(() => currencies.code),
        exchangeRate: decimal("exchange_rate", { precision: 12, scale: 6 }),
        amountConverted: decimal("amount_converted", {
            precision: 12,
            scale: 2,
        }).notNull(),

        expenseDate: datetime("expense_date").notNull(),
        notes: text("notes"),
        isDeleted: boolean("is_deleted").default(false),

        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .onUpdateNow(),
    },
    (table) => ({
        dateIdx: index("idx_expenses_date").on(table.expenseDate),
        categoryIdx: index("idx_expenses_category").on(table.categoryId),
        paymentIdx: index("idx_expenses_payment").on(table.paymentMethodId),
        appIdx: index("idx_expenses_app").on(table.expenseAppId),
    })
);

export const expensesRelations = relations(expenses, ({ one, many }) => ({
    user: one(users, {
        fields: [expenses.userId],
        references: [users.id],
    }),
    category: one(categories, {
        fields: [expenses.categoryId],
        references: [categories.id],
    }),
    paidByPerson: one(people, {
        fields: [expenses.paidByPersonId],
        references: [people.id],
        relationName: "paidBy",
    }),
    paymentMethod: one(paymentMethods, {
        fields: [expenses.paymentMethodId],
        references: [paymentMethods.id],
    }),
    creditCard: one(creditCards, {
        fields: [expenses.creditCardId],
        references: [creditCards.id],
    }),
    expenseApp: one(expenseApps, {
        fields: [expenses.expenseAppId],
        references: [expenseApps.id],
    }),
    currency: one(currencies, {
        fields: [expenses.currencyOriginal],
        references: [currencies.code],
    }),
    participants: many(expenseParticipants),
}));

// -- Expense Participants --
export const expenseParticipants = mysqlTable(
    "expense_participants",
    {
        id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
        expenseId: bigint("expense_id", { mode: "number" })
            .notNull()
            .references(() => expenses.id, { onDelete: "cascade" }),
        personId: bigint("person_id", { mode: "number" })
            .notNull()
            .references(() => people.id),
        shareAmount: decimal("share_amount", { precision: 12, scale: 2 }).notNull(),
        isSettled: boolean("is_settled").default(false),

        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .onUpdateNow(),
    },
    (table) => ({
        personIdx: index("idx_participants_person").on(table.personId),
    })
);

export const expenseParticipantsRelations = relations(
    expenseParticipants,
    ({ one }) => ({
        expense: one(expenses, {
            fields: [expenseParticipants.expenseId],
            references: [expenses.id],
        }),
        person: one(people, {
            fields: [expenseParticipants.personId],
            references: [people.id],
        }),
    })
);

// -- Monthly Notes --
export const monthlyNotes = mysqlTable(
    "monthly_notes",
    {
        id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
        userId: bigint("user_id", { mode: "number" })
            .notNull()
            .references(() => users.id),
        year: int("year").notNull(),
        month: tinyint("month").notNull(),
        notes: text("notes"),

        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .onUpdateNow(),
    },
    (table) => ({
        uniqUserMonth: uniqueIndex("uniq_user_month").on(
            table.userId,
            table.year,
            table.month
        ),
    })
);

export const monthlyNotesRelations = relations(monthlyNotes, ({ one }) => ({
    user: one(users, {
        fields: [monthlyNotes.userId],
        references: [users.id],
    }),
}));

// -- Settlements --
export const settlements = mysqlTable("settlements", {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    userId: bigint("user_id", { mode: "number" })
        .notNull()
        .references(() => users.id),
    fromPersonId: bigint("from_person_id", { mode: "number" })
        .notNull()
        .references(() => people.id),
    toPersonId: bigint("to_person_id", { mode: "number" })
        .notNull()
        .references(() => people.id),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    settlementDate: datetime("settlement_date").notNull(),
    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .onUpdateNow(),
});

export const settlementsRelations = relations(settlements, ({ one }) => ({
    user: one(users, {
        fields: [settlements.userId],
        references: [users.id],
    }),
    fromPerson: one(people, {
        fields: [settlements.fromPersonId],
        references: [people.id],
        relationName: "settlementFrom",
    }),
    toPerson: one(people, {
        fields: [settlements.toPersonId],
        references: [people.id],
        relationName: "settlementTo",
    }),
}));
