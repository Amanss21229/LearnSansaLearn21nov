import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Megaphone, ArrowLeft } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAnnouncementSchema, type Announcement, type InsertAnnouncement } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function Announcements() {
  const { user } = useUser();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const form = useForm<InsertAnnouncement>({
    resolver: zodResolver(insertAnnouncementSchema.extend({
      title: insertAnnouncementSchema.shape.title.min(1, "Title is required"),
      content: insertAnnouncementSchema.shape.content.min(1, "Content is required"),
    })),
    defaultValues: {
      title: "",
      content: "",
      stream: user?.stream || undefined,
      class: user?.adminClass || undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertAnnouncement) => apiRequest("POST", "/api/announcements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Announcement created successfully" });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertAnnouncement) => {
    createMutation.mutate(data);
  };

  const filteredAnnouncements = announcements?.filter(a => {
    if (!a.stream && !a.class) return true;
    if (a.stream && a.stream !== user?.stream) return false;
    if (a.class && a.class !== user?.class) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/home")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl">{t("announcements")}</h1>
              <p className="text-xs text-muted-foreground">{t("latestUpdates")}</p>
            </div>
          </div>
        </div>
        {user?.isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-create-announcement">
                <Plus className="w-4 h-4 mr-2" />
                {t("createAnnouncement")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("createNewAnnouncement")}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("title")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t("announcementTitle")} data-testid="input-announcement-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("content")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder={t("announcementContent")} rows={4} data-testid="textarea-announcement-content" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stream"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("targetStream")} ({t("optional")})</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-announcement-stream">
                              <SelectValue placeholder={t("allStreams")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">{t("allStreams")}</SelectItem>
                            <SelectItem value="School">School</SelectItem>
                            <SelectItem value="NEET">NEET</SelectItem>
                            <SelectItem value="JEE">JEE</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {user?.adminClass && (
                    <FormField
                      control={form.control}
                      name="class"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("targetClass")} ({t("optional")})</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder={t("allClasses")} data-testid="input-announcement-class" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-announcement">
                    {createMutation.isPending ? t("creating") : t("createAnnouncement")}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t("loading")}</p>
            </div>
          ) : filteredAnnouncements && filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map((announcement) => (
              <Card key={announcement.id} data-testid={`card-announcement-${announcement.id}`}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-start justify-between gap-2">
                    <span>{announcement.title}</span>
                    <span className="text-xs font-normal text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{announcement.content}</p>
                  <div className="flex gap-2 mt-3">
                    {announcement.stream && (
                      <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary">
                        {announcement.stream}
                      </span>
                    )}
                    {announcement.class && (
                      <span className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                        Class {announcement.class}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t("noAnnouncements")}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
