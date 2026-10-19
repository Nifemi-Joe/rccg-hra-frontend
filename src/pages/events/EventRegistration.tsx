import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { ExportDropdown } from '@/components/ExportDropdown';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { 
  Plus, 
  Save, 
  Calendar, 
  Upload, 
  QrCode, 
  Link as LinkIcon, 
  Eye, 
  Edit, 
  Trash2,
  ImageIcon 
} from 'lucide-react';

const mockEvents = [
  { id: '1', name: 'Sunday Service' },
  { id: '2', name: 'Midweek Service' },
  { id: '3', name: 'Youth Conference 2024' },
];

const mockGroups = [
  { id: '1', name: 'Youth Ministry' },
  { id: '2', name: 'Worship Team' },
  { id: '3', name: 'Men\'s Fellowship' },
  { id: '4', name: 'Women\'s Ministry' },
];

const mockRegistrations = [
  { id: '1', event: 'Youth Conference 2024', date: '2024-03-15', registrations: 45, isPaid: true, price: 50, group: 'Youth Ministry' },
  { id: '2', event: 'Sunday Service', date: '2024-01-07', registrations: 320, isPaid: false, group: null },
];

export default function EventRegistration() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedEventForQR, setSelectedEventForQR] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    event: '',
    details: '',
    group: '',
    isPaid: false,
    price: '',
    bannerUrl: '',
    emailSubject: '',
    emailBody: '',
    smsMessage: '',
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In production, you'd upload to storage and get URL
      console.log('File selected:', file.name);
    }
  };

  const handleSubmit = () => {
    console.log('Creating event registration:', formData);
    setIsCreateOpen(false);
  };

  const handleGenerateQR = (event: any) => {
    setSelectedEventForQR(event);
    setShowQRDialog(true);
  };

  const copyLink = (eventId: string) => {
    const link = `${window.location.origin}/check-in/${eventId}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <DashboardLayout
      title="Event Registration"
      actions={
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Save className="h-4 w-4" />
          Save
        </Button>
      }
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Create/Edit Form */}
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="details">Primary Details</TabsTrigger>
                <TabsTrigger value="other">Other Info</TabsTrigger>
                <TabsTrigger value="communication">Email & SMS</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Form Fields */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Event</Label>
                      <Select
                        value={formData.event}
                        onValueChange={(v) => setFormData({ ...formData, event: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select from events and activities" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {mockEvents.map(event => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Event Details</Label>
                      <Textarea
                        value={formData.details}
                        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                        placeholder="Details"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Group</Label>
                      <Select
                        value={formData.group}
                        onValueChange={(v) => setFormData({ ...formData, group: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {mockGroups.map(group => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPaid"
                        checked={formData.isPaid}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, isPaid: checked as boolean })
                        }
                      />
                      <Label htmlFor="isPaid" className="cursor-pointer">
                        Mark as Paid Event
                      </Label>
                    </div>

                    {formData.isPaid && (
                      <div className="space-y-2">
                        <Label>Price ($)</Label>
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    )}
                  </div>

                  {/* Right Column - Banner Upload */}
                  <div className="space-y-2">
                    <Label>Upload Event Banner</Label>
                    <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px] hover:border-primary/50 transition-colors cursor-pointer"
                         onClick={() => document.getElementById('banner-upload')?.click()}>
                      {formData.bannerUrl ? (
                        <img src={formData.bannerUrl} alt="Banner preview" className="max-h-40 object-contain" />
                      ) : (
                        <>
                          <div className="border-2 border-dashed border-primary/30 rounded-full p-4 mb-4">
                            <Upload className="h-6 w-6 text-primary" />
                          </div>
                          <span className="text-primary font-medium">Upload</span>
                          <span className="text-sm text-muted-foreground mt-2">No file selected yet.</span>
                        </>
                      )}
                      <input
                        id="banner-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button onClick={handleSubmit} className="px-8">
                    Save and Continue
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="other" className="space-y-6">
                <p className="text-muted-foreground">Additional event configuration options will appear here.</p>
              </TabsContent>

              <TabsContent value="communication" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Email Notification</h4>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        value={formData.emailSubject}
                        onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                        placeholder="Registration confirmation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Body</Label>
                      <Textarea
                        value={formData.emailBody}
                        onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                        placeholder="Email content..."
                        rows={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">SMS Notification</h4>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        value={formData.smsMessage}
                        onChange={(e) => setFormData({ ...formData, smsMessage: e.target.value })}
                        placeholder="SMS content..."
                        rows={6}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Existing Registrations */}
        <Card>
          <CardContent className="p-0">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold">Event Registrations</h3>
              <ExportDropdown
                data={mockRegistrations.map(r => ({
                  Event: r.event,
                  Date: r.date,
                  Registrations: r.registrations,
                  Paid: r.isPaid ? 'Yes' : 'No',
                }))}
                filename="event-registrations"
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Registrations</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRegistrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">{reg.event}</TableCell>
                      <TableCell>{reg.date}</TableCell>
                      <TableCell>{reg.group || '-'}</TableCell>
                      <TableCell>{reg.registrations}</TableCell>
                      <TableCell>
                        {reg.isPaid ? (
                          <Badge className="bg-secondary/10 text-secondary">
                            Paid (${reg.price})
                          </Badge>
                        ) : (
                          <Badge variant="outline">Free</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleGenerateQR(reg)}
                            title="Generate QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => copyLink(reg.id)}
                            title="Copy Link"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
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

        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Event QR Code</DialogTitle>
              <DialogDescription>
                Scan this QR code to access the event check-in page
              </DialogDescription>
            </DialogHeader>
            {selectedEventForQR && (
              <div className="py-4">
                <QRCodeGenerator
                  value={`${window.location.origin}/check-in/${selectedEventForQR.id}`}
                  title={selectedEventForQR.event}
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQRDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
