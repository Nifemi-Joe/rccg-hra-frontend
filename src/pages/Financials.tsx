import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExportDropdown } from '@/components/ExportDropdown';
import {
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PiggyBank,
  Receipt,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// Mock data
const mockTransactions = [
  {
    id: '1',
    type: 'offering',
    amount: 5000,
    account: 'Main Church Account',
    date: '2024-01-07',
    description: 'Sunday Service Offering',
    recorded_by: 'John Doe',
  },
  {
    id: '2',
    type: 'tithe',
    amount: 2500,
    account: 'Tithe Account',
    member_name: 'Jane Smith',
    date: '2024-01-07',
    description: 'Monthly tithe',
    recorded_by: 'John Doe',
  },
  {
    id: '3',
    type: 'expense',
    amount: -1200,
    account: 'Main Church Account',
    category: 'Utilities',
    date: '2024-01-05',
    description: 'Electricity bill',
    recorded_by: 'Admin',
  },
  {
    id: '4',
    type: 'donation',
    amount: 10000,
    account: 'Building Fund',
    donor_name: 'Anonymous',
    date: '2024-01-03',
    description: 'Building project donation',
    recorded_by: 'John Doe',
  },
];

const mockAccounts = [
  { id: '1', name: 'Main Church Account', type: 'bank', balance: 45000 },
  { id: '2', name: 'Tithe Account', type: 'bank', balance: 12500 },
  { id: '3', name: 'Building Fund', type: 'bank', balance: 85000 },
  { id: '4', name: 'Cash App', type: 'digital', balance: 3200 },
  { id: '5', name: 'PayPal', type: 'digital', balance: 1800 },
];

const monthlyData = [
  { month: 'Jan', income: 35000, expenses: 12000 },
  { month: 'Feb', income: 42000, expenses: 15000 },
  { month: 'Mar', income: 38000, expenses: 11000 },
  { month: 'Apr', income: 45000, expenses: 18000 },
  { month: 'May', income: 52000, expenses: 14000 },
  { month: 'Jun', income: 48000, expenses: 16000 },
];

const incomeBreakdown = [
  { name: 'Tithes', value: 45000, color: 'hsl(var(--primary))' },
  { name: 'Offerings', value: 35000, color: 'hsl(var(--secondary))' },
  { name: 'Donations', value: 25000, color: 'hsl(var(--chart-3))' },
  { name: 'Other', value: 5000, color: 'hsl(var(--chart-4))' },
];

const expenseCategories = [
  'Utilities',
  'Maintenance',
  'Salaries',
  'Supplies',
  'Events',
  'Outreach',
  'Equipment',
  'Other',
];

const accountTypes = [
  { value: 'bank', label: 'Bank Account' },
  { value: 'digital', label: 'Digital Wallet' },
  { value: 'cash', label: 'Cash' },
  { value: 'custom', label: 'Custom' },
];

export default function Financials() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactionType, setTransactionType] = useState('all');
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [recordType, setRecordType] = useState<'offering' | 'tithe' | 'donation' | 'expense'>('offering');

  const totalIncome = mockTransactions
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = Math.abs(
    mockTransactions.filter((t) => t.amount < 0).reduce((acc, t) => acc + t.amount, 0)
  );

  const netBalance = totalIncome - totalExpenses;

  const filteredTransactions = mockTransactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.account.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = transactionType === 'all' || t.type === transactionType;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      offering: 'bg-primary/10 text-primary',
      tithe: 'bg-secondary/10 text-secondary',
      donation: 'bg-chart-3/10 text-chart-3',
      expense: 'bg-destructive/10 text-destructive',
    };
    return styles[type] || 'bg-muted text-muted-foreground';
  };

  return (
    <DashboardLayout
      title="Financials"
      actions={
        <div className="flex gap-2">
          <Dialog open={isAccountOpen} onOpenChange={setIsAccountOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Add Account</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogDescription>
                  Create a new account for receiving payments
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input placeholder="e.g., Building Fund" />
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select defaultValue="bank">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {accountTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea placeholder="Account description..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAccountOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAccountOpen(false)}>Add Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Record Transaction</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Transaction</DialogTitle>
                <DialogDescription>
                  Record a new financial transaction
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Select
                    value={recordType}
                    onValueChange={(v) => setRecordType(v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="offering">Offering</SelectItem>
                      <SelectItem value="tithe">Tithe</SelectItem>
                      <SelectItem value="donation">Donation</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" placeholder="0.00" className="pl-9" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Account</Label>
                  <Select defaultValue="1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {mockAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {recordType === 'tithe' && (
                  <div className="space-y-2">
                    <Label>Member Name</Label>
                    <Input placeholder="Select or enter member name" />
                  </div>
                )}

                {recordType === 'donation' && (
                  <div className="space-y-2">
                    <Label>Donor Name</Label>
                    <Input placeholder="Enter donor name (or Anonymous)" />
                  </div>
                )}

                {recordType === 'expense' && (
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select defaultValue="utilities">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat} value={cat.toLowerCase()}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Transaction description..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRecordOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsRecordOpen(false)}>Record</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Income</p>
                  <p className="text-xl md:text-2xl font-bold text-primary">
                    ${totalIncome.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 md:p-3 rounded-xl bg-primary/10">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-secondary">
                <ArrowUpRight className="h-3 w-3" />
                +12% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-xl md:text-2xl font-bold text-destructive">
                    ${totalExpenses.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 md:p-3 rounded-xl bg-destructive/10">
                  <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
                <ArrowDownRight className="h-3 w-3" />
                -5% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Net Balance</p>
                  <p className="text-xl md:text-2xl font-bold text-secondary">
                    ${netBalance.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 md:p-3 rounded-xl bg-secondary/10">
                  <Wallet className="h-5 w-5 md:h-6 md:w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Accounts</p>
                  <p className="text-xl md:text-2xl font-bold">{mockAccounts.length}</p>
                </div>
                <div className="p-2 md:p-3 rounded-xl bg-chart-3/10">
                  <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-chart-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="hsl(var(--primary))" name="Income" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Income Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={incomeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {incomeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Transactions and Accounts */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-6 border-b">
                <TabsList>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="accounts">Accounts</TabsTrigger>
                </TabsList>

                {activeTab === 'transactions' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-full sm:w-64"
                      />
                    </div>
                    <Select value={transactionType} onValueChange={setTransactionType}>
                      <SelectTrigger className="w-full sm:w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="offering">Offerings</SelectItem>
                        <SelectItem value="tithe">Tithes</SelectItem>
                        <SelectItem value="donation">Donations</SelectItem>
                        <SelectItem value="expense">Expenses</SelectItem>
                      </SelectContent>
                    </Select>
                    <ExportDropdown
                      data={filteredTransactions.map((t) => ({
                        Type: t.type,
                        Amount: t.amount,
                        Account: t.account,
                        Date: t.date,
                        Description: t.description,
                      }))}
                      filename="transactions"
                    />
                  </div>
                )}
              </div>

              <TabsContent value="transactions" className="m-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="hidden sm:table-cell">Type</TableHead>
                        <TableHead className="hidden md:table-cell">Account</TableHead>
                        <TableHead className="hidden lg:table-cell">Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-muted-foreground sm:hidden">
                                {transaction.type} • {transaction.date}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge className={getTypeBadge(transaction.type)}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {transaction.account}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {transaction.date}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                transaction.amount > 0 ? 'text-secondary' : 'text-destructive'
                              }
                            >
                              {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="accounts" className="m-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-muted">
                                {account.type === 'bank' ? (
                                  <Building2 className="h-4 w-4" />
                                ) : account.type === 'digital' ? (
                                  <CreditCard className="h-4 w-4" />
                                ) : (
                                  <PiggyBank className="h-4 w-4" />
                                )}
                              </div>
                              <span className="font-medium">{account.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {account.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${account.balance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
