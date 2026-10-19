import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExportDropdown } from '@/components/ExportDropdown';
import { 
  Plus, 
  Calendar,
  Users,
  DollarSign,
  Mic
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

interface AttendanceItem {
  id: string;
  type: string;
  count: number;
}

interface OfferingItem {
  id: string;
  name: string;
  channel: string;
  amount: number;
}

interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: number;
}

const attendanceCategories = ['Men', 'Women', 'Children', 'First Timers', 'New Comers', 'Online'];

const mockReportData = {
  totalAttendance: 320,
  totalIncome: 15700,
  totalExpense: 1200,
  attendanceBreakdown: [
    { name: 'Men', value: 120, color: 'hsl(var(--primary))' },
    { name: 'Women', value: 145, color: 'hsl(var(--secondary))' },
    { name: 'Children', value: 55, color: 'hsl(var(--chart-3))' },
  ],
  incomeByChannel: [
    { channel: 'Cash', amount: 8000 },
    { channel: 'Transfer', amount: 5500 },
    { channel: 'Card', amount: 2200 },
  ],
};

export default function ServiceReportPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Form state
  const [date, setDate] = useState('');
  const [topic, setTopic] = useState('');
  const [preacher, setPreacher] = useState('');
  const [attendanceItems, setAttendanceItems] = useState<AttendanceItem[]>([]);
  const [offeringItems, setOfferingItems] = useState<OfferingItem[]>([]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);

  const addAttendanceItem = () => {
    if (selectedCategory) {
      setAttendanceItems([...attendanceItems, { 
        id: Date.now().toString(), 
        type: selectedCategory, 
        count: 0 
      }]);
      setSelectedCategory('');
    }
  };

  const updateAttendanceItem = (id: string, count: number) => {
    setAttendanceItems(attendanceItems.map(item =>
      item.id === id ? { ...item, count } : item
    ));
  };

  const removeAttendanceItem = (id: string) => {
    setAttendanceItems(attendanceItems.filter(item => item.id !== id));
  };

  const addOfferingItem = () => {
    setOfferingItems([...offeringItems, { 
      id: Date.now().toString(), 
      name: '', 
      channel: '', 
      amount: 0 
    }]);
  };

  const updateOfferingItem = (id: string, field: keyof OfferingItem, value: string | number) => {
    setOfferingItems(offeringItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { 
      id: Date.now().toString(), 
      category: '', 
      description: '', 
      amount: 0 
    }]);
  };

  const totalAttendance = attendanceItems.reduce((sum, item) => sum + item.count, 0);
  const totalOffering = offeringItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenseItems.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = () => {
    console.log('Creating service report:', {
      date, topic, preacher,
      attendanceItems, offeringItems, expenseItems
    });
    setIsCreating(false);
  };

  return (
    <DashboardLayout
      title="Service Report"
      actions={
        <Button className="gap-2" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4" />
          Create Report
        </Button>
      }
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Report Form */}
        <Card>
          <CardContent className="p-6 space-y-8">
            {/* Header Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date:</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="dd/mm/yyyy"
                />
              </div>
              <div className="space-y-2">
                <Label>Topic:</Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter topic"
                />
              </div>
              <div className="space-y-2">
                <Label>Preacher:</Label>
                <Input
                  value={preacher}
                  onChange={(e) => setPreacher(e.target.value)}
                  placeholder="Enter preacher name"
                />
              </div>
            </div>

            {/* Category Selector */}
            <div className="border-2 border-dashed border-muted rounded-lg p-6 flex justify-center">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {attendanceCategories
                    .filter(cat => !attendanceItems.find(item => item.type === cat))
                    .map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            {/* Add Attendance Section */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Add Attendance
              </h4>
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/5">
                    <TableHead>Attendance Type</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.type}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.count || ''}
                          onChange={(e) => updateAttendanceItem(item.id, parseInt(e.target.value) || 0)}
                          className="w-24"
                          min={0}
                        />
                      </TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttendanceItem(item.id)}
                          className="text-destructive"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center">
                <Button variant="link" onClick={addAttendanceItem} className="text-primary gap-1 p-0" disabled={!selectedCategory}>
                  <Plus className="h-4 w-4" />
                  Add Attendance Item
                </Button>
                <span className="font-bold">TOTAL: {totalAttendance}</span>
              </div>
            </div>

            {/* Add Offering Section */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Add Offering
              </h4>
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/5">
                    <TableHead>Offering Item</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offeringItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.name}
                          onChange={(e) => updateOfferingItem(item.id, 'name', e.target.value)}
                          placeholder="Offering type"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.channel}
                          onValueChange={(v) => updateOfferingItem(item.id, 'channel', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Channel" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="transfer">Transfer</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.amount || ''}
                          onChange={(e) => updateOfferingItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center">
                <Button variant="link" onClick={addOfferingItem} className="text-primary gap-1 p-0">
                  <Plus className="h-4 w-4" />
                  Add Offering Item
                </Button>
                <span className="font-bold">TOTAL: ${totalOffering.toFixed(2)}</span>
              </div>
            </div>

            {/* Add Expense Section */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                Add Expense
              </h4>
              <Table>
                <TableHeader>
                  <TableRow className="bg-destructive/5">
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.category}
                          onChange={(e) => setExpenseItems(expenseItems.map(i => 
                            i.id === item.id ? { ...i, category: e.target.value } : i
                          ))}
                          placeholder="Category"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => setExpenseItems(expenseItems.map(i => 
                            i.id === item.id ? { ...i, description: e.target.value } : i
                          ))}
                          placeholder="Description"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.amount || ''}
                          onChange={(e) => setExpenseItems(expenseItems.map(i => 
                            i.id === item.id ? { ...i, amount: parseFloat(e.target.value) || 0 } : i
                          ))}
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell className="text-right text-destructive">-${item.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center">
                <Button variant="link" onClick={addExpenseItem} className="text-primary gap-1 p-0">
                  <Plus className="h-4 w-4" />
                  Add Expense Item
                </Button>
                <span className="font-bold text-destructive">TOTAL: -${totalExpense.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <Button onClick={handleSubmit} className="px-8">
                Save Service Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={mockReportData.attendanceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {mockReportData.attendanceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Income by Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={mockReportData.incomeByChannel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="channel" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
