import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { QRScanner } from '@/components/QRScanner';
import { attendanceApi } from '@/lib/api';
import { Check, ChevronsUpDown, QrCode, Loader2, CheckCircle2, Calendar, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/hralogo.png';

const checkinSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(10, 'Valid phone number is required'),
});

type CheckinFormData = z.infer<typeof checkinSchema>;

// Mock existing members for autocomplete
const mockMembers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phone: '1234567890' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '0987654321' },
  { id: '3', name: 'John Smith', email: 'johnsmith@example.com', phone: '5555555555' },
];

// Mock event data
const mockEvent = {
  id: '1',
  name: 'Sunday Service',
  description: 'Weekly Sunday worship service',
  start_date: '2024-01-07',
  start_time: '09:00',
  end_time: '12:00',
  location: 'Main Sanctuary',
  church_name: 'Grace Community Church',
};

export default function CheckIn() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [openMemberSearch, setOpenMemberSearch] = useState(false);
  const [selectedMember, setSelectedMember] = useState<typeof mockMembers[0] | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [event] = useState(mockEvent);

  const form = useForm<CheckinFormData>({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  const filteredMembers = mockMembers.filter((member) =>
    member.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleMemberSelect = (member: typeof mockMembers[0]) => {
    setSelectedMember(member);
    form.setValue('name', member.name);
    form.setValue('email', member.email);
    form.setValue('phone', member.phone);
    setOpenMemberSearch(false);
  };

  const onSubmit = async (data: CheckinFormData) => {
    setIsLoading(true);
    try {
      await attendanceApi.checkIn({
        eventId: eventId!,
        memberId: selectedMember?.id,
        guestName: !selectedMember ? data.name : undefined,
        guestEmail: !selectedMember ? data.email : undefined,
        guestPhone: !selectedMember ? data.phone : undefined,
      });
      setIsSuccess(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Check-in failed',
        description: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanResult = (result: string) => {
    // Handle scanned member QR code
    const member = mockMembers.find((m) => m.id === result);
    if (member) {
      handleMemberSelect(member);
      toast({
        title: 'Member found',
        description: `Welcome back, ${member.name}!`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Member not found',
        description: 'Please fill in your details manually.',
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-10">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
            </div>
            <CardTitle className="text-2xl font-display mb-2">You're checked in!</CardTitle>
            <CardDescription className="mb-2">
              Welcome to {event.name}
            </CardDescription>
            <p className="text-sm text-muted-foreground mb-6">
              Thank you for joining us today, {form.getValues('name')}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Check in another person
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Event Header */}
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Church" className="h-16 w-16" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">{event.church_name}</p>
            <CardTitle className="text-xl font-display mb-4">{event.name}</CardTitle>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {event.start_date}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {event.start_time} - {event.end_time}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.location}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-in Form */}
        <Card>
          <CardHeader>
            <CardTitle>Check In</CardTitle>
            <CardDescription>
              Enter your details or scan your member QR code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full mb-6 gap-2"
              onClick={() => setShowScanner(true)}
            >
              <QrCode className="h-4 w-4" />
              Scan Member QR Code
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or enter details</span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Name *</FormLabel>
                      <Popover open={openMemberSearch} onOpenChange={setOpenMemberSearch}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openMemberSearch}
                              className={cn(
                                'w-full justify-between',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value || 'Enter your name...'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search or type name..."
                              value={searchValue}
                              onValueChange={(value) => {
                                setSearchValue(value);
                                field.onChange(value);
                              }}
                            />
                            <CommandList>
                              <CommandEmpty>
                                <div className="p-2 text-sm">
                                  <p>No member found.</p>
                                  <p className="text-muted-foreground">
                                    Continue as "{searchValue}"
                                  </p>
                                </div>
                              </CommandEmpty>
                              <CommandGroup heading="Existing Members">
                                {filteredMembers.map((member) => (
                                  <CommandItem
                                    key={member.id}
                                    value={member.name}
                                    onSelect={() => handleMemberSelect(member)}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        selectedMember?.id === member.id
                                          ? 'opacity-100'
                                          : 'opacity-0'
                                      )}
                                    />
                                    <div>
                                      <p>{member.name}</p>
                                      <p className="text-xs text-muted-foreground">{member.email}</p>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          {...field}
                          disabled={!!selectedMember}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          {...field}
                          disabled={!!selectedMember}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedMember && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedMember(null);
                      form.reset();
                    }}
                    className="text-muted-foreground"
                  >
                    Clear selection (check in as new person)
                  </Button>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking in...
                    </>
                  ) : (
                    'Check In'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScanResult}
        onError={(error) =>
          toast({
            variant: 'destructive',
            title: 'Scanner error',
            description: error,
          })
        }
      />
    </div>
  );
}
