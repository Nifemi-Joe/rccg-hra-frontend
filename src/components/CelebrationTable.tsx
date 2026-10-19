import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cake, Heart, Gift, Mail, MessageSquare, Loader2 } from "lucide-react";
import { format, isToday, isTomorrow, addDays, isBefore, isAfter, parseISO } from "date-fns";
import { celebrationsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Celebration {
  id: string;
  memberId: string;
  memberName: string;
  type: "birthday" | "anniversary";
  date: string;
  phone?: string;
  email?: string;
}

export function CelebrationTable() {
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCelebrations();
  }, []);

  const fetchCelebrations = async () => {
    try {
      const response = await celebrationsApi.getUpcoming();
      setCelebrations(response.data as Celebration[]);
    } catch (error) {
      console.error("Error fetching celebrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const categorize = (items: Celebration[]) => {
    const today: Celebration[] = [];
    const upcoming: Celebration[] = [];
    const todayDate = new Date();
    const nextWeek = addDays(todayDate, 7);

    items.forEach((item) => {
      const celebrationDate = parseISO(item.date);
      if (isToday(celebrationDate)) {
        today.push(item);
      } else if (isAfter(celebrationDate, todayDate) && isBefore(celebrationDate, nextWeek)) {
        upcoming.push(item);
      }
    });

    return { today, upcoming };
  };

  const { today, upcoming } = categorize(celebrations);

  const sendWishes = async (celebration: Celebration, method: "email" | "sms") => {
    setSendingId(celebration.id);
    try {
      await celebrationsApi.sendWishes({
        memberId: celebration.memberId,
        type: celebration.type,
        method,
      });
      toast({
        title: "Success",
        description: `${celebration.type === "birthday" ? "Birthday" : "Anniversary"} wishes sent via ${method}!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send wishes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingId(null);
    }
  };

  const getDayLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE");
  };

  const CelebrationRow = ({ celebration }: { celebration: Celebration }) => (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              {celebration.type === "birthday" ? (
                <Cake className="h-5 w-5 text-primary" />
              ) : (
                <Heart className="h-5 w-5 text-destructive" />
              )}
            </div>
          </div>
          <div>
            <span className="font-medium">{celebration.memberName}</span>
            <p className="text-xs text-muted-foreground">{celebration.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {format(parseISO(celebration.date), "MMM dd, yyyy")}
      </TableCell>
      <TableCell>
        <Badge variant={isToday(parseISO(celebration.date)) ? "default" : "secondary"}>
          {getDayLabel(celebration.date)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={celebration.type === "birthday" ? "default" : "outline"}>
          <Gift className="h-3 w-3 mr-1" />
          {celebration.type === "birthday" ? "Birthday" : "Anniversary"}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">{celebration.phone || "-"}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => sendWishes(celebration, "email")}
            disabled={sendingId === celebration.id || !celebration.email}
          >
            {sendingId === celebration.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => sendWishes(celebration, "sms")}
            disabled={sendingId === celebration.id || !celebration.phone}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-muted">
            <Cake className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <CardTitle>Celebrations</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="today" className="gap-2">
              Today
              {today.length > 0 && (
                <Badge variant="default" className="ml-1 h-5 min-w-5 rounded-full px-1.5">
                  {today.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              Upcoming
              {upcoming.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5">
                  {upcoming.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            {today.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Cake className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No celebrations today</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden md:table-cell">Phone</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {today.map((celebration) => (
                      <CelebrationRow key={celebration.id} celebration={celebration} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No upcoming celebrations this week</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden md:table-cell">Phone</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcoming.map((celebration) => (
                      <CelebrationRow key={celebration.id} celebration={celebration} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
