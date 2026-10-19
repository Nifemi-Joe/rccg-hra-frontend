import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ExportDropdown } from '@/components/ExportDropdown';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Mic,
  TrendingUp,
  TrendingDown,
  Edit,
  Eye,
  Trash2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data
const mockServiceReports = [
  {
    id: '1',
    eventName: 'Sunday Service',
    date: '2024-01-07',
    preacher: 'Pastor John Doe',
    topic: 'Walking in Faith',
    attendance: { men: 120, women: 145, children: 55 },
    totalAttendance: 320,
    firstTimers: 12,
    newComers: 5,
    offerings: 5200,
    tithes: 8500,
    donations: 2000,
    expenses: 1200,
    channels: { cash: 8000, transfer: 5500, card: 2200 },
  },
  {
    id: '2',
    eventName: 'Sunday Service',
    date: '2024-01-14',
    preacher: 'Pastor Jane Smith',
    topic: 'The Power of Prayer',
    attendance: { men: 135, women: 160, children: 60 },
    totalAttendance: 355,
    firstTimers: 8,
    newComers: 3,
    offerings: 6100,
    tithes: 9200,
    donations: 1500,
    expenses: 950,
    channels: { cash: 9200, transfer: 6000, card: 1600 },
  },
];

const attendanceBreakdown = [
  { name: 'Men', value: 120, color: 'hsl(var(--primary))' },
  { name: 'Women', value: 145, color: 'hsl(var(--secondary))' },
  { name: 'Children', value: 55, color: 'hsl(var(--chart-3))' },
];

const financialBreakdown = [
  { category: 'Cash', amount: 8000 },
  { category: 'Bank Transfer', amount: 5500 },
  { category: 'Card', amount: 2200 },
];

export default function ServiceReports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<typeof mockServiceReports[0] | null>(null);
  const [viewReport, setViewReport] = useState(false);

  const [formData, setFormData] = useState({
    eventName: '',
    date: '',
    preacher: '',
    topic: '',
    men: '',
    women: '',
    children: '',
    firstTimers: '',
    newComers: '',
    offerings: '',
    tithes: '',
    donations: '',
    expenses: '',
    cashAmount: '',
    transferAmount: '',
    cardAmount: '',
    notes: '',
  });

  const filteredReports = mockServiceReports.filter(
    (report) =>
      report.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.preacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Service Reports"
      actions={
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Report</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Service Report</DialogTitle>
              <DialogDescription>
                Record all details from the service
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Event Details */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Event Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Event Name</Label>
                    <Select
                      value={formData.eventName}
                      onValueChange={(v) => setFormData({ ...formData, eventName: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="sunday-service">Sunday Service</SelectItem>
                        <SelectItem value="midweek-service">Midweek Service</SelectItem>
                        <SelectItem value="special-service">Special Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Preaching Details */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Sermon Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preacher</Label>
                    <Input
                      value={formData.preacher}
                      onChange={(e) => setFormData({ ...formData, preacher: e.target.value })}
                      placeholder="Pastor John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Topic/Title</Label>
                    <Input
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      placeholder="Walking in Faith"
                    />
                  </div>
                </div>
              </div>

              {/* Attendance */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Attendance Breakdown
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Men</Label>
                    <Input
                      type="number"
                      value={formData.men}
                      onChange={(e) => setFormData({ ...formData, men: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Women</Label>
                    <Input
                      type="number"
                      value={formData.women}
                      onChange={(e) => setFormData({ ...formData, women: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Children</Label>
                    <Input
                      type="number"
                      value={formData.children}
                      onChange={(e) => setFormData({ ...formData, children: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>First Timers</Label>
                    <Input
                      type="number"
                      value={formData.firstTimers}
                      onChange={(e) => setFormData({ ...formData, firstTimers: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>New Comers</Label>
                    <Input
                      type="number"
                      value={formData.newComers}
                      onChange={(e) => setFormData({ ...formData, newComers: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Financials */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Offerings ($)</Label>
                    <Input
                      type="number"
                      value={formData.offerings}
                      onChange={(e) => setFormData({ ...formData, offerings: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tithes ($)</Label>
                    <Input
                      type="number"
                      value={formData.tithes}
                      onChange={(e) => setFormData({ ...formData, tithes: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Donations ($)</Label>
                    <Input
                      type="number"
                      value={formData.donations}
                      onChange={(e) => setFormData({ ...formData, donations: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expenses ($)</Label>
                    <Input
                      type="number"
                      value={formData.expenses}
                      onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Channels */}
              <div className="space-y-4">
                <h4 className="font-medium">Payment Channels</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cash ($)</Label>
                    <Input
                      type="number"
                      value={formData.cashAmount}
                      onChange={(e) => setFormData({ ...formData, cashAmount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Transfer ($)</Label>
                    <Input
                      type="number"
                      value={formData.transferAmount}
                      onChange={(e) => setFormData({ ...formData, transferAmount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Card ($)</Label>
                    <Input
                      type="number"
                      value={formData.cardAmount}
                      onChange={(e) => setFormData({ ...formData, cardAmount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about the service..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateOpen(false)}>Save Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-xl md:text-2xl font-bold">{mockServiceReports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-xl bg-secondary/10">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Avg Attendance</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {Math.round(
                      mockServiceReports.reduce((acc, r) => acc + r.totalAttendance, 0) /
                        mockServiceReports.length
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-xl bg-chart-3/10">
                  <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-chart-3" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Income</p>
                  <p className="text-xl md:text-2xl font-bold">
                    $
                    {mockServiceReports
                      .reduce((acc, r) => acc + r.offerings + r.tithes + r.donations, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 rounded-xl bg-warning/10">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-warning" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">First Timers</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {mockServiceReports.reduce((acc, r) => acc + r.firstTimers, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Breakdown (Last Service)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={attendanceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {attendanceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Channels (Last Service)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={financialBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="category" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>All Service Reports</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                <ExportDropdown
                  data={filteredReports.map((r) => ({
                    Event: r.eventName,
                    Date: r.date,
                    Preacher: r.preacher,
                    Topic: r.topic,
                    'Total Attendance': r.totalAttendance,
                    Men: r.attendance.men,
                    Women: r.attendance.women,
                    Children: r.attendance.children,
                    'First Timers': r.firstTimers,
                    Offerings: r.offerings,
                    Tithes: r.tithes,
                    Donations: r.donations,
                    Expenses: r.expenses,
                  }))}
                  filename="service-reports"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead className="hidden md:table-cell">Preacher</TableHead>
                    <TableHead className="hidden lg:table-cell">Topic</TableHead>
                    <TableHead className="text-right">Attendance</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Income</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{report.eventName}</p>
                          <p className="text-sm text-muted-foreground">{report.date}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{report.preacher}</TableCell>
                      <TableCell className="hidden lg:table-cell">{report.topic}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{report.totalAttendance}</Badge>
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        <span className="text-secondary">
                          ${(report.offerings + report.tithes + report.donations).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedReport(report);
                              setViewReport(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Report Dialog */}
        <Dialog open={viewReport} onOpenChange={setViewReport}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Service Report Details</DialogTitle>
              <DialogDescription>
                {selectedReport?.eventName} - {selectedReport?.date}
              </DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Preacher</Label>
                    <p className="font-medium">{selectedReport.preacher}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Topic</Label>
                    <p className="font-medium">{selectedReport.topic}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground mb-2 block">Attendance</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold">{selectedReport.attendance.men}</p>
                        <p className="text-xs text-muted-foreground">Men</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold">{selectedReport.attendance.women}</p>
                        <p className="text-xs text-muted-foreground">Women</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold">{selectedReport.attendance.children}</p>
                        <p className="text-xs text-muted-foreground">Children</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-chart-3">{selectedReport.firstTimers}</p>
                        <p className="text-xs text-muted-foreground">First Timers</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-secondary">{selectedReport.newComers}</p>
                        <p className="text-xs text-muted-foreground">New Comers</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground mb-2 block">Financials</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xl font-bold text-secondary">${selectedReport.offerings.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Offerings</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xl font-bold text-primary">${selectedReport.tithes.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Tithes</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xl font-bold text-chart-3">${selectedReport.donations.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Donations</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xl font-bold text-destructive">${selectedReport.expenses.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Expenses</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground mb-2 block">Payment Channels</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-lg font-bold">${selectedReport.channels.cash.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Cash</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-lg font-bold">${selectedReport.channels.transfer.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Transfer</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-lg font-bold">${selectedReport.channels.card.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Card</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewReport(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
