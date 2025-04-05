import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  insertPersonSchema, 
  insertTransactionSchema, 
  type InsertPerson, 
  type InsertTransaction 
} from "@shared/schema";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Receipt, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddNewModalProps {
  open: boolean;
  onClose: () => void;
}

const transactionFormSchema = insertTransactionSchema.extend({
  transactionType: z.enum(["they-paid", "you-paid"]),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

const AddNewModal: React.FC<AddNewModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>("transaction");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Transaction form
  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      personId: 0,
      amount: 0,
      description: "",
      date: new Date(),
      isPersonDebtor: true,
      transactionType: "they-paid",
    },
  });

  // Person form
  const personForm = useForm<InsertPerson>({
    resolver: zodResolver(insertPersonSchema),
    defaultValues: {
      name: "",
      relationship: "",
      email: "",
      phone: "",
    },
  });

  // Get people for dropdown
  const { data: people = [] } = useQuery({
    queryKey: ["/api/people"],
    enabled: open,
  });

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary/debtors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary/creditors"] });
      toast({
        title: "Success",
        description: "Transaction added successfully",
        variant: "default",
      });
      transactionForm.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add transaction: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add person mutation
  const addPersonMutation = useMutation({
    mutationFn: async (data: InsertPerson) => {
      const response = await apiRequest("POST", "/api/people", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      toast({
        title: "Success",
        description: "Person added successfully",
        variant: "default",
      });
      personForm.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add person: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmitTransaction = (data: TransactionFormValues) => {
    // Transform form data to match API expectations
    const transactionData: InsertTransaction = {
      personId: Number(data.personId),
      amount: Number(data.amount),
      description: data.description,
      date: new Date(data.date),
      isPersonDebtor: data.transactionType === "they-paid", // They paid = They owe you (debtor)
    };
    
    addTransactionMutation.mutate(transactionData);
  };

  const onSubmitPerson = (data: InsertPerson) => {
    addPersonMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New</DialogTitle>
          <DialogDescription>
            Create a new transaction or add a new person to your records.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transaction" className="flex items-center">
              <Receipt className="mr-2 h-4 w-4" />
              Transaction
            </TabsTrigger>
            <TabsTrigger value="person" className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Person
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="transaction">
            <Form {...transactionForm}>
              <form onSubmit={transactionForm.handleSubmit(onSubmitTransaction)} className="space-y-4 pt-4">
                <FormField
                  control={transactionForm.control}
                  name="personId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Person</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a person" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {people.length === 0 ? (
                            <SelectItem value="no-people" disabled>
                              No people added yet
                            </SelectItem>
                          ) : (
                            people.map((person) => (
                              <SelectItem key={person.id} value={person.id.toString()}>
                                {person.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={transactionForm.control}
                  name="transactionType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Transaction Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="they-paid" id="they-paid" />
                            <label htmlFor="they-paid">They paid you</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="you-paid" id="you-paid" />
                            <label htmlFor="you-paid">You paid them</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={transactionForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0.01"
                            step="0.01"
                            className="pl-8"
                            placeholder="0.00"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={transactionForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="What was this for?" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={transactionForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          value={field.value instanceof Date 
                            ? format(field.value, "yyyy-MM-dd") 
                            : field.value as string
                          }
                          onChange={(e) => {
                            field.onChange(e.target.value ? new Date(e.target.value) : new Date());
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                  <Button 
                    type="submit" 
                    disabled={addTransactionMutation.isPending || !people.length}
                  >
                    {addTransactionMutation.isPending ? "Saving..." : "Save Transaction"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="person">
            <Form {...personForm}>
              <form onSubmit={personForm.handleSubmit(onSubmitPerson)} className="space-y-4 pt-4">
                <FormField
                  control={personForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter full name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={personForm.control}
                  name="relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Friend, Family, Coworker, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={personForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="email@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={personForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(123) 456-7890" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                  <Button 
                    type="submit" 
                    disabled={addPersonMutation.isPending}
                  >
                    {addPersonMutation.isPending ? "Saving..." : "Add Person"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewModal;
