import {AvatarName} from '@/components/ui/avatar-name'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select.tsx'
import {Skeleton} from '@/components/ui/skeleton'
import {useToast} from '@/hooks/use-toast'
import {apiRequest} from '@/lib/queryClient'
import {transactionSorter} from '@/lib/utils.ts'
import {Person, PersonBalance, TransactionWithPerson} from '@shared/schema.ts'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {Mail, Phone, Users, X} from 'lucide-react'
import React, {useState} from 'react'
import TransactionTable from './TransactionTable'

interface PersonDetailsProps {
  personId: number;
  onClose: () => void;
}

const PersonDetails: React.FC<PersonDetailsProps> = ({ personId, onClose }) => {
  const { toast } = useToast();
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const queryClient = useQueryClient();
  
  // Fetch person details
  const { data: person, isLoading: isLoadingPerson } = useQuery<Person>({
    queryKey: [`/api/people/${personId}`],
    enabled: !!personId,
  });
  
  // Fetch person balance
  const { data: balanceData, isLoading: isLoadingBalance } = useQuery<PersonBalance>({
    queryKey: [`/api/people/${personId}/balance`],
    enabled: !!personId,
  });
  
  // Fetch person transactions
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<TransactionWithPerson[]>({
    queryKey: [`/api/people/${personId}/transactions`],
    enabled: !!personId,
  });
  
  const sortedTransactions = transactions.sort(transactionSorter(sortOrder));
  
  // Delete person mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/people/${personId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary/debtors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary/creditors"] });
      toast({
        title: "Success",
        description: "Person deleted successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete person: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(value));
  };
  
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this person? This will also delete all associated transactions.")) {
      deleteMutation.mutate();
    }
  };
  
  if (isLoadingPerson) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            <Skeleton className="h-8 w-40" />
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!person) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Person Not Found</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p>The requested person could not be found.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center">
          <AvatarName name={person.name} size="lg" className="mr-3" />
          <span>{person.name}</span>
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {/* Contact Information */}
          <div className="space-y-2">
            {person.relationship && (
              <div className="flex items-center text-sm text-neutral-500">
                <Users className="mr-2 h-4 w-4" />
                <span>{person.relationship}</span>
              </div>
            )}
            {person.email && (
              <div className="flex items-center text-sm text-neutral-500">
                <Mail className="mr-2 h-4 w-4" />
                <span>{person.email}</span>
              </div>
            )}
            {person.phone && (
              <div className="flex items-center text-sm text-neutral-500">
                <Phone className="mr-2 h-4 w-4" />
                <span>{person.phone}</span>
              </div>
            )}
          </div>
          
          {/* Balance */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            {isLoadingBalance ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="flex flex-col">
                <span className="text-sm text-neutral-500">Current Balance</span>
                <span className={`text-xl font-mono font-semibold
                ${
                  balanceData?.balance > 0 ? "text-positive" : balanceData?.balance < 0 ? "text-negative" : ""
                }`}>
                  {
                    balanceData?.balance > 0 ? `They owe you ${formatCurrency(balanceData.balance)}`
                      : balanceData?.balance < 0 ? `You owe them ${formatCurrency(Math.abs(balanceData.balance))}`
                      : "No balance"
                  }
                </span>
              </div>
            )}
          </div>
          
          {/* Transactions */}
          <div className="mt-4">
            <h3 className="font-medium text-lg mb-3">Transaction History</h3>
            
            <div className="mb-3">
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
            
            {isLoadingTransactions ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <TransactionTable transactions={sortedTransactions} />
            )}
          </div>
          
          {/* Actions */}
          <div className="mt-6 flex justify-end">
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={true}
              //disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Person"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonDetails;
