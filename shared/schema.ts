import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Person schema
export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  relationship: text("relationship"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPersonSchema = createInsertSchema(people).pick({
  name: true,
  relationship: true,
  email: true,
  phone: true,
});

// Transaction schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").notNull().references(() => people.id, { onDelete: 'cascade' }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  isPersonDebtor: boolean("is_person_debtor").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  person: one(people, {
    fields: [transactions.personId],
    references: [people.id],
  }),
}));

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  personId: true,
  amount: true,
  description: true,
  date: true,
  isPersonDebtor: true,
}).extend({
  // Allow ISO string dates and convert them to Date objects
  date: z.union([
    z.date(),
    z.string().refine(
      (val) => !isNaN(new Date(val).getTime()),
      { message: "Invalid date string" }
    ).transform(val => new Date(val))
  ])
});

// Add relations for people after both tables are defined
export const peopleRelations = relations(people, ({ many }) => ({
  transactions: many(transactions),
}));

// Export types
export type Person = typeof people.$inferSelect;
export type InsertPerson = z.infer<typeof insertPersonSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// For displaying transactions with person info
export type TransactionWithPerson = Transaction & {
  person: Person;
};

// Summary type for dashboard
export type FinancialSummary = {
  totalOwedToYou: number;
  totalYouOwe: number;
  netBalance: number;
  debtorCount: number;
  creditorCount: number;
  lastUpdated: Date;
};

// Balance type for a person
export type PersonBalance = {
  person: Person;
  balance: number;
  lastTransaction: Date | null;
};
