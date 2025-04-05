import { 
  people, 
  transactions, 
  type Person, 
  type InsertPerson, 
  type Transaction, 
  type InsertTransaction,
  type TransactionWithPerson,
  type FinancialSummary,
  type PersonBalance
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Person operations
  getPeople(): Promise<Person[]>;
  getPerson(id: number): Promise<Person | undefined>;
  createPerson(person: InsertPerson): Promise<Person>;
  updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person | undefined>;
  deletePerson(id: number): Promise<boolean>;
  
  // Transaction operations
  getTransactions(): Promise<TransactionWithPerson[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByPerson(personId: number): Promise<TransactionWithPerson[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  
  // Summary operations
  getFinancialSummary(): Promise<FinancialSummary>;
  getTopDebtors(limit?: number): Promise<PersonBalance[]>;
  getTopCreditors(limit?: number): Promise<PersonBalance[]>;
  getPersonBalance(personId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Person operations
  async getPeople(): Promise<Person[]> {
    return db.select().from(people);
  }
  
  async getPerson(id: number): Promise<Person | undefined> {
    const result = await db.select().from(people).where(eq(people.id, id));
    return result[0];
  }
  
  async createPerson(insertPerson: InsertPerson): Promise<Person> {
    const result = await db.insert(people).values({
      name: insertPerson.name,
      relationship: insertPerson.relationship || null,
      email: insertPerson.email || null,
      phone: insertPerson.phone || null,
    }).returning();
    
    return result[0];
  }
  
  async updatePerson(id: number, updateData: Partial<InsertPerson>): Promise<Person | undefined> {
    const result = await db.update(people)
      .set(updateData)
      .where(eq(people.id, id))
      .returning();
      
    return result[0];
  }
  
  async deletePerson(id: number): Promise<boolean> {
    // With cascade delete in schema, deleting a person will also delete their transactions
    const result = await db.delete(people)
      .where(eq(people.id, id))
      .returning({ id: people.id });
      
    return result.length > 0;
  }
  
  // Transaction operations
  async getTransactions(): Promise<TransactionWithPerson[]> {
    const result = await db.select({
      transaction: transactions,
      person: people
    })
    .from(transactions)
    .innerJoin(people, eq(transactions.personId, people.id));
    
    return result.map(r => ({
      ...r.transaction,
      person: r.person
    }));
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id));
    return result[0];
  }
  
  async getTransactionsByPerson(personId: number): Promise<TransactionWithPerson[]> {
    const result = await db.select({
      transaction: transactions,
      person: people
    })
    .from(transactions)
    .innerJoin(people, eq(transactions.personId, people.id))
    .where(eq(transactions.personId, personId));
    
    return result.map(r => ({
      ...r.transaction,
      person: r.person
    }));
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    // Ensure date is a proper Date object
    let date: Date;
    if (typeof insertTransaction.date === 'string') {
      date = new Date(insertTransaction.date);
    } else {
      date = insertTransaction.date;
    }
    
    const result = await db.insert(transactions).values({
      personId: insertTransaction.personId,
      amount: insertTransaction.amount,
      description: insertTransaction.description,
      date: date,
      isPersonDebtor: insertTransaction.isPersonDebtor
    }).returning();
    
    return result[0];
  }
  
  async updateTransaction(id: number, updateData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    // Ensure date is a proper Date object if it's provided
    let processedData: Partial<InsertTransaction> = { ...updateData };
    
    if (updateData.date) {
      if (typeof updateData.date === 'string') {
        processedData.date = new Date(updateData.date);
      }
    }
    
    const result = await db.update(transactions)
      .set(processedData)
      .where(eq(transactions.id, id))
      .returning();
      
    return result[0];
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db.delete(transactions)
      .where(eq(transactions.id, id))
      .returning({ id: transactions.id });
      
    return result.length > 0;
  }
  
  // Summary operations
  async getFinancialSummary(): Promise<FinancialSummary> {
    // This calculates the balance for each person
    const personBalances = await this.calculateAllPersonBalances();
    
    let totalOwedToYou = 0;
    let totalYouOwe = 0;
    let debtorCount = 0;
    let creditorCount = 0;
    
    // Sum up the net balances
    for (const balance of personBalances) {
      if (balance.balance > 0) {
        // They owe you (net)
        totalOwedToYou += Number(balance.balance);
        debtorCount++;
      } else if (balance.balance < 0) {
        // You owe them (net)
        totalYouOwe += Math.abs(Number(balance.balance));
        creditorCount++;
      }
      // If balance is 0, they don't count as either debtor or creditor
    }
    
    return {
      totalOwedToYou,
      totalYouOwe,
      netBalance: totalOwedToYou - totalYouOwe,
      debtorCount,
      creditorCount,
      lastUpdated: new Date()
    };
  }
  
  async getTopDebtors(limit: number = 5): Promise<PersonBalance[]> {
    const balances = await this.calculateAllPersonBalances();
    
    // Filter out people who owe you (positive balance)
    const debtors = balances
      .filter(pb => pb.balance > 0)
      .sort((a, b) => Number(b.balance) - Number(a.balance)) // Sort descending
      .slice(0, limit);
    
    return debtors;
  }
  
  async getTopCreditors(limit: number = 5): Promise<PersonBalance[]> {
    const balances = await this.calculateAllPersonBalances();
    
    // Filter out people you owe (negative balance)
    const creditors = balances
      .filter(pb => pb.balance < 0)
      .sort((a, b) => Number(a.balance) - Number(b.balance)) // Sort ascending to get most negative first
      .slice(0, limit);
    
    return creditors;
  }
  
  async getPersonBalance(personId: number): Promise<number> {
    const result = await db.select()
      .from(transactions)
      .where(eq(transactions.personId, personId));
      
    let netBalance = 0;
    
    for (const transaction of result) {
      if (transaction.isPersonDebtor) {
        // They owe you
        netBalance += Number(transaction.amount);
      } else {
        // You owe them
        netBalance -= Number(transaction.amount);
      }
    }
    
    // Positive balance: they owe you (net)
    // Negative balance: you owe them (net)
    // Zero balance: no debt in either direction
    return netBalance;
  }
  
  // Helper method to calculate balances for all people
  private async calculateAllPersonBalances(): Promise<PersonBalance[]> {
    const allPeople = await db.select().from(people);
    const allTransactions = await db.select().from(transactions);
    
    // Group transactions by person
    const personBalances: Map<number, PersonBalance> = new Map();
    
    // Initialize person balances
    for (const person of allPeople) {
      personBalances.set(person.id, {
        person,
        balance: 0,
        lastTransaction: null
      });
    }
    
    // Calculate balance for each person
    for (const transaction of allTransactions) {
      const personId = transaction.personId;
      
      if (!personBalances.has(personId)) {
        continue; // Skip if person doesn't exist (shouldn't happen with foreign key constraint)
      }
      
      const personBalance = personBalances.get(personId)!;
      
      // Update balance
      if (transaction.isPersonDebtor) {
        // They owe you
        personBalance.balance += Number(transaction.amount);
      } else {
        // You owe them
        personBalance.balance -= Number(transaction.amount);
      }
      
      // Update last transaction date
      if (!personBalance.lastTransaction || new Date(transaction.date) > personBalance.lastTransaction) {
        personBalance.lastTransaction = new Date(transaction.date);
      }
    }
    
    return Array.from(personBalances.values());
  }
}

export const storage = new DatabaseStorage();
