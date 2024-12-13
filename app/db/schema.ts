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