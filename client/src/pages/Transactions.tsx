import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Calendar, Filter } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { TransactionWithPerson } from "@shared/schema";
import TransactionTable from "@/components/TransactionTable";
import { Button } from "@/components/ui/button";
import AddNewModal from "@/components/AddNewModal";

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [personFilter, setPersonFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [modalOpen, setModalOpen] = useState(false);
  
  // Fetch all transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });
  
  // Fetch all people for filter dropdown
  const { data: people = [] } = useQuery({
    queryKey: ["/api/people"],
  });
  
  // Filter and sort transactions
  const filteredTransactions = transactions.filter((transaction: TransactionWithPerson) => {
    // Search filter
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.person.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Person filter
    const matchesPerson = 
      personFilter === "all" || 
      transaction.personId.toString() === personFilter;
    
    // Type filter
    const matchesType = 
      typeFilter === "all" || 
      (typeFilter === "debt" && transaction.isPersonDebtor) || 
      (typeFilter === "credit" && !transaction.isPersonDebtor);
    
    return matchesSearch && matchesPerson && matchesType;
  });
  
  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
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
  });
  
  return (
    <div>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Transactions</CardTitle>
            <Button 
              onClick={() => setModalOpen(true)}
              className="ml-auto"
            >
              Add Transaction
            </Button>
          </div>
          
          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search transactions..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={personFilter} onValueChange={setPersonFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All People" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All People</SelectItem>
                {people.map((person) => (
                  <SelectItem key={person.id} value={person.id.toString()}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="debt">Debt (They Owe You)</SelectItem>
                <SelectItem value="credit">Credit (You Owe Them)</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest">Highest Amount</SelectItem>
                <SelectItem value="lowest">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : sortedTransactions.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              {searchTerm || personFilter !== "all" || typeFilter !== "all" 
                ? "No transactions match your filters" 
                : "No transactions added yet"}
            </div>
          ) : (
            <TransactionTable transactions={sortedTransactions} />
          )}
        </CardContent>
      </Card>
      
      <AddNewModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default Transactions;
