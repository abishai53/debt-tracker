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

export class MemStorage implements IStorage {
  private people: Map<number, Person>;
  private transactions: Map<number, Transaction>;
  private peopleCurrentId: number;
  private transactionsCurrentId: number;

  constructor() {
    this.people = new Map();
    this.transactions = new Map();
    this.peopleCurrentId = 1;
    this.transactionsCurrentId = 1;
  }

  // Person operations
  async getPeople(): Promise<Person[]> {
    return Array.from(this.people.values());
  }

  async getPerson(id: number): Promise<Person | undefined> {
    return this.people.get(id);
  }

  async createPerson(insertPerson: InsertPerson): Promise<Person> {
    const id = this.peopleCurrentId++;
    const now = new Date();
    
    // Ensure null values for optional fields
    const person: Person = { 
      id, 
      name: insertPerson.name,
      relationship: insertPerson.relationship || null,
      email: insertPerson.email || null,
      phone: insertPerson.phone || null,
      createdAt: now
    };
    
    this.people.set(id, person);
    return person;
  }

  async updatePerson(id: number, updateData: Partial<InsertPerson>): Promise<Person | undefined> {
    const person = this.people.get(id);
    if (!person) return undefined;
    
    // Process update data to ensure correct null handling
    const processedUpdateData: Partial<Person> = {};
    
    if (updateData.name !== undefined) {
      processedUpdateData.name = updateData.name;
    }
    
    if (updateData.relationship !== undefined) {
      processedUpdateData.relationship = updateData.relationship || null;
    }
    
    if (updateData.email !== undefined) {
      processedUpdateData.email = updateData.email || null;
    }
    
    if (updateData.phone !== undefined) {
      processedUpdateData.phone = updateData.phone || null;
    }
    
    const updatedPerson = { ...person, ...processedUpdateData };
    this.people.set(id, updatedPerson);
    return updatedPerson;
  }

  async deletePerson(id: number): Promise<boolean> {
    return this.people.delete(id);
  }

  // Transaction operations
  async getTransactions(): Promise<TransactionWithPerson[]> {
    const transactions = Array.from(this.transactions.values());
    return transactions.map(transaction => {
      const person = this.people.get(transaction.personId);
      if (!person) throw new Error(`Person not found for transaction: ${transaction.id}`);
      return { ...transaction, person };
    });
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByPerson(personId: number): Promise<TransactionWithPerson[]> {
    const transactions = Array.from(this.transactions.values())
      .filter(t => t.personId === personId);
    
    const person = this.people.get(personId);
    if (!person) throw new Error(`Person not found: ${personId}`);
    
    return transactions.map(transaction => ({ ...transaction, person }));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionsCurrentId++;
    const now = new Date();
    
    // Ensure date is properly handled as a Date object
    const date = insertTransaction.date instanceof Date 
      ? insertTransaction.date 
      : new Date(insertTransaction.date);
    
    const transaction: Transaction = { 
      id, 
      ...insertTransaction,
      date, // Replace with our validated date
      createdAt: now
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: number, updateData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    // Handle date conversion if it's present in updateData
    let processedUpdateData = { ...updateData };
    if (updateData.date !== undefined && !(updateData.date instanceof Date)) {
      processedUpdateData.date = new Date(updateData.date);
    }
    
    const updatedTransaction = { ...transaction, ...processedUpdateData };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Summary operations
  async getFinancialSummary(): Promise<FinancialSummary> {
    const transactions = Array.from(this.transactions.values());
    let totalOwedToYou = 0;
    let totalYouOwe = 0;
    let debtorCount = 0;
    let creditorCount = 0;
    
    // Get unique debtors and creditors
    const debtors = new Set<number>();
    const creditors = new Set<number>();
    
    for (const transaction of transactions) {
      if (transaction.isPersonDebtor) {
        // They owe you (they paid)
        totalOwedToYou += Number(transaction.amount);
        debtors.add(transaction.personId);
      } else {
        // You owe them (you paid)
        totalYouOwe += Number(transaction.amount);
        creditors.add(transaction.personId);
      }
    }
    
    return {
      totalOwedToYou,
      totalYouOwe,
      netBalance: totalOwedToYou - totalYouOwe,
      debtorCount: debtors.size,
      creditorCount: creditors.size,
      lastUpdated: new Date()
    };
  }

  async getTopDebtors(limit: number = 5): Promise<PersonBalance[]> {
    const peopleBalances: Map<number, PersonBalance> = new Map();
    const transactions = Array.from(this.transactions.values());
    
    // Calculate balance for each person
    for (const transaction of transactions) {
      const personId = transaction.personId;
      const person = this.people.get(personId);
      if (!person) continue;
      
      if (!peopleBalances.has(personId)) {
        peopleBalances.set(personId, {
          person,
          balance: 0,
          lastTransaction: null
        });
      }
      
      const personBalance = peopleBalances.get(personId)!;
      
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
    
    // Filter out people who owe you (positive balance)
    const debtors = Array.from(peopleBalances.values())
      .filter(pb => pb.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);
    
    return debtors;
  }

  async getTopCreditors(limit: number = 5): Promise<PersonBalance[]> {
    const peopleBalances: Map<number, PersonBalance> = new Map();
    const transactions = Array.from(this.transactions.values());
    
    // Calculate balance for each person
    for (const transaction of transactions) {
      const personId = transaction.personId;
      const person = this.people.get(personId);
      if (!person) continue;
      
      if (!peopleBalances.has(personId)) {
        peopleBalances.set(personId, {
          person,
          balance: 0,
          lastTransaction: null
        });
      }
      
      const personBalance = peopleBalances.get(personId)!;
      
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
    
    // Filter out people you owe (negative balance)
    const creditors = Array.from(peopleBalances.values())
      .filter(pb => pb.balance < 0)
      .sort((a, b) => a.balance - b.balance) // Sort ascending to get largest negative first
      .slice(0, limit);
    
    return creditors;
  }

  async getPersonBalance(personId: number): Promise<number> {
    const transactions = Array.from(this.transactions.values())
      .filter(t => t.personId === personId);
    
    let balance = 0;
    
    for (const transaction of transactions) {
      if (transaction.isPersonDebtor) {
        // They owe you
        balance += Number(transaction.amount);
      } else {
        // You owe them
        balance -= Number(transaction.amount);
      }
    }
    
    return balance;
  }
}

export const storage = new MemStorage();
