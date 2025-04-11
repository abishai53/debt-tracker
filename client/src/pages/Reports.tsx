import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Skeleton} from '@/components/ui/skeleton'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {formatCurrency} from '@/lib/utils'
import {FinancialSummary, Person, type PersonBalance} from '@shared/schema.ts'
import {useQuery} from '@tanstack/react-query'
import {BarChart as BarChartIcon, TrendingDown, TrendingUp} from 'lucide-react'
import {useState} from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

const Reports = () => {
  const [timeFrame, setTimeFrame] = useState<string>("all");
  const [reportType, setReportType] = useState<string>("overview");
  
  // Fetch financial summary
  const { data: summary, isLoading: isLoadingSummary } = useQuery<FinancialSummary>({
    queryKey: ["/api/summary"],
  });
  
  // Fetch people
  const { data: people = [], isLoading: isLoadingPeople } = useQuery<Person[]>({
    queryKey: ["/api/people"],
  });
  
  // Fetch debtors and creditors
  const { data: debtors = [] } = useQuery<PersonBalance[]>({
    queryKey: ["/api/summary/debtors"],
  });
  
  const { data: creditors = [] } = useQuery<PersonBalance[]>({
    queryKey: ["/api/summary/creditors"],
  });
  
  // Prepare data for overview chart
  const overviewData = [
    { name: "Owed to You", value: summary?.totalOwedToYou || 0, color: "#4caf50" },
    { name: "You Owe", value: summary?.totalYouOwe || 0, color: "#f44336" },
  ];
  
  // Prepare data for pie charts
  const debtorData = debtors.map((debtor) => ({
    name: debtor.person.name,
    value: Math.abs(debtor.balance),
  }));
  
  const creditorData = creditors.map((creditor) => ({
    name: creditor.person.name,
    value: Math.abs(creditor.balance),
  }));
  
  // Custom colors for pie charts
  const COLORS = ["#1976d2", "#f50057", "#4caf50", "#ff9800", "#9c27b0", "#00bcd4", "#795548"];
  
  // Custom tooltip formatter for currency
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-neutral-600">
            {`${payload[0].name}: ${formatCurrency(payload[0].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Financial Reports</CardTitle>
            <Select value={timeFrame} onValueChange={setTimeFrame}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Frame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={reportType} onValueChange={setReportType}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center">
                <BarChartIcon className="mr-2 h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="debtors" className="flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Debtors
              </TabsTrigger>
              <TabsTrigger value="creditors" className="flex items-center">
                <TrendingDown className="mr-2 h-4 w-4" />
                Creditors
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="pt-4">
                <h3 className="text-lg font-medium mb-4">Financial Overview</h3>
                {isLoadingSummary ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={overviewData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                          formatter={(value) => [`$${value}`, "Amount"]}
                        />
                        <Bar dataKey="value" name="Amount">
                          {overviewData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-neutral-500 font-medium mb-2">Net Position</h4>
                    <p className={`text-2xl font-mono font-medium ${
                      (summary?.netBalance || 0) >= 0 ? "text-positive" : "text-negative"
                    }`}>
                      {formatCurrency(summary?.netBalance || 0)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-neutral-500 font-medium mb-2">Total People</h4>
                    <p className="text-2xl font-medium">{people.length || 0}</p>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Debtors: {summary?.debtorCount || 0}</span>
                      <span>Creditors: {summary?.creditorCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="debtors">
              <div className="pt-4">
                <h3 className="text-lg font-medium mb-4">Debtor Distribution</h3>
                {isLoadingPeople || debtorData.length === 0 ? (
                  <div className="text-center py-8">
                    {isLoadingPeople ? (
                      <Skeleton className="h-[300px] w-full" />
                    ) : (
                      <p className="text-neutral-400">No debtors found</p>
                    )}
                  </div>
                ) : (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={debtorData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {debtorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Top Debtor Details</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    {debtorData.length > 0 ? (
                      <ul className="space-y-2">
                        {debtorData.slice(0, 3).map((debtor, index) => (
                          <li key={index} className="flex justify-between">
                            <span>{debtor.name}</span>
                            <span className="font-mono text-positive">
                              {formatCurrency(debtor.value)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-neutral-400 text-center">No debtors to display</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="creditors">
              <div className="pt-4">
                <h3 className="text-lg font-medium mb-4">Creditor Distribution</h3>
                {isLoadingPeople || creditorData.length === 0 ? (
                  <div className="text-center py-8">
                    {isLoadingPeople ? (
                      <Skeleton className="h-[300px] w-full" />
                    ) : (
                      <p className="text-neutral-400">No creditors found</p>
                    )}
                  </div>
                ) : (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={creditorData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {creditorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Top Creditor Details</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    {creditorData.length > 0 ? (
                      <ul className="space-y-2">
                        {creditorData.slice(0, 3).map((creditor, index) => (
                          <li key={index} className="flex justify-between">
                            <span>{creditor.name}</span>
                            <span className="font-mono text-negative">
                              {formatCurrency(creditor.value)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-neutral-400 text-center">No creditors to display</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
