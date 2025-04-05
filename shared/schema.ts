import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
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
  personId: integer("person_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  isPersonDebtor: boolean("is_person_debtor").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  personId: true,
  amount: true,
  description: true,
  date: true,
  isPersonDebtor: true,
});

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
