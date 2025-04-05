import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SummaryCard from "@/components/SummaryCard";
import TransactionTable from "@/components/TransactionTable";
import PersonItem from "@/components/PersonItem";
import { TransactionWithPerson, PersonBalance } from "@shared/schema";

const Dashboard = () => {
  // Fetch financial summary
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["/api/summary"],
  });

  // Fetch recent transactions
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["/api/transactions"],
  });

  // Get top 5 most recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Fetch top debtors
  const { data: debtors = [], isLoading: isLoadingDebtors } = useQuery({
    queryKey: ["/api/summary/debtors"],
  });

  // Fetch top creditors
  const { data: creditors = [], isLoading: isLoadingCreditors } = useQuery({
    queryKey: ["/api/summary/creditors"],
  });

  return (
    <div>
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {isLoadingSummary ? (
          // Loading skeletons
          Array(3).fill(0).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32 mt-1" />
              </CardContent>
            </Card>
          ))
        ) : (
          // Actual summary cards
          <>
            <SummaryCard
              title="Total Owed to You"
              amount={summary?.totalOwedToYou || 0}
              type="owed"
              subtitle={`From ${summary?.debtorCount || 0} people`}
            />
            <SummaryCard
              title="Total You Owe"
              amount={summary?.totalYouOwe || 0}
              type="owing"
              subtitle={`To ${summary?.creditorCount || 0} people`}
            />
            <SummaryCard
              title="Net Balance"
              amount={summary?.netBalance || 0}
              type="balance"
              subtitle={`Updated ${new Date(summary?.lastUpdated || Date.now()).toLocaleTimeString()}`}
            />
          </>
        )}
      </div>

      {/* Recent Activity */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        {isLoadingTransactions ? (
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        ) : (
          <>
            <TransactionTable transactions={recentTransactions} />
            <div className="p-3 text-center">
              <Link href="/transactions">
                <Button variant="ghost" className="text-primary font-medium">
                  View All Transactions
                </Button>
              </Link>
            </div>
          </>
        )}
      </Card>

      {/* Top Debtors and Creditors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Debtors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Top Debtors</CardTitle>
            <p className="text-neutral-300 text-sm">People who owe you</p>
          </CardHeader>
          {isLoadingDebtors ? (
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          ) : (
            <ul>
              {debtors.length === 0 ? (
                <li className="p-4 text-center text-neutral-400">
                  No debtors found
                </li>
              ) : (
                debtors.map((debtor: PersonBalance) => (
                  <PersonItem
                    key={debtor.person.id}
                    personBalance={debtor}
                    type="debtor"
                  />
                ))
              )}
            </ul>
          )}
        </Card>

        {/* Top Creditors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Top Creditors</CardTitle>
            <p className="text-neutral-300 text-sm">People you owe</p>
          </CardHeader>
          {isLoadingCreditors ? (
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          ) : (
            <ul>
              {creditors.length === 0 ? (
                <li className="p-4 text-center text-neutral-400">
                  No creditors found
                </li>
              ) : (
                creditors.map((creditor: PersonBalance) => (
                  <PersonItem
                    key={creditor.person.id}
                    personBalance={creditor}
                    type="creditor"
                  />
                ))
              )}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
