import { relations } from "drizzle-orm";
import { pgTable, varchar, boolean, timestamp, text, uuid, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    isSubscribed: boolean("is_subscribed").notNull().default(false),
    subscriptionEnds: timestamp("subscription_ends", { mode: "date" }),
}, (table) => {
    return {
        emailIndex: uniqueIndex("email_idx").on(table.email),
    };
});

export const todos = pgTable("todos", {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text("title").notNull(),
    completed: boolean("completed").notNull().default(false),
    userId: varchar("user_id", { length: 36 }).references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const stripeSubscriptions = pgTable("stripe_subscriptions", {
    id: varchar("id", { length: 255 }).primaryKey(), // Stripe subscription ID
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
    customerId: varchar("customer_id", { length: 255 }).notNull(),
    priceId: varchar("price_id", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(), // e.g., active, canceled
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    endDate: timestamp("end_date", { mode: "date" }).notNull(),
    cancelAt: boolean("cancel_at").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});


// Relationships
export const usersRelations = relations(users, ({ many }) => ({
    todos: many(todos),
}));

export const todosRelations = relations(todos, ({ one }) => ({
    user: one(users, {
        fields: [todos.userId],
        references: [users.id],
    }),
}));

export const stripeSubscriptionsRelations = relations(stripeSubscriptions, ({ one }) => ({
    user: one(users, {
        fields: [stripeSubscriptions.userId],
        references: [users.id],
    }),
}));