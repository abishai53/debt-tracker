import {Transaction} from '@shared/schema.ts'
import {type ClassValue, clsx} from 'clsx'
import {twMerge} from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format amount as currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Add plus/minus sign based on if it's a debt or credit
export function formatBalance(amount: number, isDebt: boolean): string {
  const formatted = formatCurrency(Math.abs(amount));
  return isDebt ? `+${formatted}` : `-${formatted}`;
}

// Get initials from a name
export function getInitials(name: string): string {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// Format a date for display
export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

// Format a date to show only month and day
export function formatShortDate(date: Date | string | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

// Custom text color based on balance
export function getBalanceColor(amount: number): string {
  if (amount > 0) return "text-positive";
  if (amount < 0) return "text-negative";
  return "";
}

export function transactionSorter(sortOrder: string) {
  return (a: Transaction, b: Transaction) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();

    if (sortOrder === "newest") {
      return dateB - dateA;
    } else if (sortOrder === "oldest") {
      return dateA - dateB;
    } else if (sortOrder === "highest") {
      return Number(b.amount) - Number(a.amount);
    } else {
      return Number(a.amount) - Number(b.amount);
    }
  };
}
