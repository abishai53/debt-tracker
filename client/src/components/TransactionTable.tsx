import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { TransactionWithPerson } from "@shared/schema";
import { cn } from "@/lib/utils";

interface TransactionTableProps {
  transactions: TransactionWithPerson[];
  compact?: boolean;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ 
  transactions,
  compact = false
}) => {
  const formatCurrency = (value: number, isPersonDebtor: boolean) => {
    const formattedValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(value));
    
    return `${isPersonDebtor ? '+' : '-'}${formattedValue}`;
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "MMMM d, yyyy");
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-neutral-100">
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Person</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-neutral-500">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id} className="hover:bg-neutral-50">
                <TableCell className="text-sm">{formatDate(transaction.date)}</TableCell>
                <TableCell>{transaction.person.name}</TableCell>
                <TableCell className="text-neutral-400">{transaction.description}</TableCell>
                <TableCell className={cn(
                  "font-mono text-right",
                  transaction.isPersonDebtor ? "text-positive" : "text-negative"
                )}>
                  {formatCurrency(Number(transaction.amount), transaction.isPersonDebtor)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionTable;
