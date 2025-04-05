import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertPersonSchema, 
  insertTransactionSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // People routes
  app.get("/api/people", async (req: Request, res: Response) => {
    try {
      const people = await storage.getPeople();
      res.json(people);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch people" });
    }
  });

  app.get("/api/people/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const person = await storage.getPerson(id);
      if (!person) {
        return res.status(404).json({ message: "Person not found" });
      }
      
      res.json(person);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch person" });
    }
  });

  app.post("/api/people", async (req: Request, res: Response) => {
    try {
      const validatedData = insertPersonSchema.parse(req.body);
      const person = await storage.createPerson(validatedData);
      res.status(201).json(person);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create person" });
    }
  });

  app.put("/api/people/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const validatedData = insertPersonSchema.partial().parse(req.body);
      const updatedPerson = await storage.updatePerson(id, validatedData);
      
      if (!updatedPerson) {
        return res.status(404).json({ message: "Person not found" });
      }
      
      res.json(updatedPerson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update person" });
    }
  });

  app.delete("/api/people/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deletePerson(id);
      if (!success) {
        return res.status(404).json({ message: "Person not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete person" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  app.get("/api/people/:id/transactions", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const transactions = await storage.getTransactionsByPerson(id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch person's transactions" });
    }
  });

  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.put("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const validatedData = insertTransactionSchema.partial().parse(req.body);
      const updatedTransaction = await storage.updateTransaction(id, validatedData);
      
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deleteTransaction(id);
      if (!success) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Summary routes
  app.get("/api/summary", async (req: Request, res: Response) => {
    try {
      const summary = await storage.getFinancialSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch financial summary" });
    }
  });

  app.get("/api/summary/debtors", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const debtors = await storage.getTopDebtors(limit);
      res.json(debtors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top debtors" });
    }
  });

  app.get("/api/summary/creditors", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const creditors = await storage.getTopCreditors(limit);
      res.json(creditors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top creditors" });
    }
  });

  app.get("/api/people/:id/balance", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const person = await storage.getPerson(id);
      if (!person) {
        return res.status(404).json({ message: "Person not found" });
      }
      
      const balance = await storage.getPersonBalance(id);
      res.json({ personId: id, balance });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch person's balance" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
