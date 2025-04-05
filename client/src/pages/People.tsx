import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { Person, PersonBalance } from "@shared/schema";
import { AvatarName } from "@/components/ui/avatar-name";
import { cn, formatCurrency } from "@/lib/utils";
import PersonDetails from "@/components/PersonDetails";

const People = () => {
  const params = useParams<{ id: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(
    params.id ? parseInt(params.id) : null
  );

  // Fetch all people
  const { data: people = [], isLoading: isLoadingPeople } = useQuery({
    queryKey: ["/api/people"],
  });

  // Calculate balances for all people
  const { data: debtors = [] } = useQuery({
    queryKey: ["/api/summary/debtors", { limit: 100 }],
  });

  const { data: creditors = [] } = useQuery({
    queryKey: ["/api/summary/creditors", { limit: 100 }],
  });

  // Combine debtors and creditors to get all people with balances
  const peopleWithBalances: Record<string, PersonBalance> = {};
  
  // Add debtors
  debtors.forEach((debtor: PersonBalance) => {
    peopleWithBalances[debtor.person.id] = debtor;
  });
  
  // Add creditors
  creditors.forEach((creditor: PersonBalance) => {
    peopleWithBalances[creditor.person.id] = creditor;
  });

  // Filtered people based on search
  const filteredPeople = people.filter((person: Person) => 
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (person.relationship && person.relationship.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePersonClick = (personId: number) => {
    setSelectedPersonId(personId);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className={`md:col-span-${selectedPersonId ? 2 : 3}`}>
        <Card>
          <CardHeader>
            <CardTitle>People</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search by name or relationship..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPeople ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredPeople.length === 0 ? (
              <p className="text-center py-8 text-neutral-400">
                {searchTerm ? "No people match your search" : "No people added yet"}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredPeople.map((person: Person) => {
                  const personBalance = peopleWithBalances[person.id];
                  const balance = personBalance ? personBalance.balance : 0;
                  
                  return (
                    <div
                      key={person.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-neutral-50",
                        selectedPersonId === person.id && "bg-neutral-100"
                      )}
                      onClick={() => handlePersonClick(person.id)}
                    >
                      <div className="flex items-center">
                        <AvatarName name={person.name} size="sm" className="mr-3" />
                        <div>
                          <p className="font-medium">{person.name}</p>
                          {person.relationship && (
                            <p className="text-xs text-neutral-400">{person.relationship}</p>
                          )}
                        </div>
                      </div>
                      {balance !== 0 && (
                        <span className={cn(
                          "font-mono text-sm font-medium",
                          balance > 0 ? "text-positive" : "text-negative"
                        )}>
                          {formatCurrency(Math.abs(balance))}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {selectedPersonId && (
        <div className="md:col-span-1">
          <PersonDetails 
            personId={selectedPersonId} 
            onClose={() => setSelectedPersonId(null)} 
          />
        </div>
      )}
    </div>
  );
};

export default People;
