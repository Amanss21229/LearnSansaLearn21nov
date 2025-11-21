import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Plus, Send, Smile, Pin, Users, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { containsBadWords } from "@/lib/badWords";
import { useToast } from "@/hooks/use-toast";
import type { Group, Message } from "@shared/schema";

export default function Chat() {
  const { t } = useLanguage();
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Array<Message & { userName: string; userPhoto?: string }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: myGroups } = useQuery<Group[]>({
    queryKey: ["/api/groups/my", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/groups/my/${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch groups");
      return response.json();
    },
    enabled: !!user,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; username: string }) => {
      return await apiRequest<Group>("POST", "/api/groups", {
        ...data,
        creatorId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups/my"] });
      toast({ title: t("success"), description: "Group created successfully!" });
    },
  });

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
      if (user) {
        socket.send(JSON.stringify({ type: "auth", userId: user.id }));
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        setMessages(prev => [...prev, data.message]);
      }
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!messageInput.trim() || !ws || !user) return;

    if (containsBadWords(messageInput)) {
      toast({
        title: "Message blocked",
        description: "Your message contains inappropriate content",
        variant: "destructive",
      });
      return;
    }

    ws.send(JSON.stringify({
      type: "sendMessage",
      groupId: selectedGroup?.id,
      stream: user.stream,
      content: messageInput,
    }));

    setMessageInput("");
  };

  const hasBadWords = containsBadWords(messageInput);

  return (
    <div className="h-full flex">
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <Tabs defaultValue="community" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="community" className="flex-1" data-testid="tab-community">
                {t("communityChat")}
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex-1" data-testid="tab-groups">
                Groups
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" data-testid="button-create-group">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("createGroup")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("createGroup")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("groupName")}</Label>
                    <Input placeholder={t("groupName")} data-testid="input-group-name" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("groupUsername")}</Label>
                    <Input placeholder={t("groupUsername")} data-testid="input-group-username" />
                  </div>
                  <Button className="w-full" data-testid="button-submit-group">
                    {t("createGroup")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card
              className="hover-elevate active-elevate-2 cursor-pointer"
              onClick={() => setSelectedGroup(null)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{user?.stream} Community</div>
                  <div className="text-xs text-muted-foreground">All {user?.stream} students</div>
                </div>
              </CardContent>
            </Card>

            {myGroups?.map((group) => (
              <Card
                key={group.id}
                className="hover-elevate active-elevate-2 cursor-pointer"
                onClick={() => setSelectedGroup(group)}
                data-testid={`card-group-${group.id}`}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{group.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold">{group.name}</div>
                    <div className="text-xs text-muted-foreground">@{group.username}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {selectedGroup ? selectedGroup.name[0] : <MessageCircle className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-heading font-semibold text-lg">
                {selectedGroup?.name || `${user?.stream} Community`}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedGroup ? `@${selectedGroup.username}` : "Community chat"}
              </p>
            </div>
          </div>
          {user?.isAdmin && (
            <Button variant="outline" size="sm" data-testid="button-pin-message">
              <Pin className="w-4 h-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.userId === user?.id ? "justify-end" : "justify-start"}`}
                data-testid={`message-${index}`}
              >
                {message.userId !== user?.id && (
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={message.userPhoto} />
                    <AvatarFallback>{message.userName[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    message.userId === user?.id
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border rounded-tl-sm"
                  }`}
                >
                  {message.userId !== user?.id && (
                    <p className="text-xs font-semibold mb-1 opacity-90">{message.userName}</p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-card">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" data-testid="button-emoji">
              <Smile className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" data-testid="button-image">
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !hasBadWords && sendMessage()}
              placeholder={t("sendMessage")}
              className="flex-1"
              data-testid="input-chat-message"
            />
            <Button
              onClick={sendMessage}
              disabled={!messageInput.trim() || hasBadWords}
              size="icon"
              data-testid="button-send-message"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          {hasBadWords && (
            <p className="text-xs text-destructive mt-2">Message contains inappropriate content</p>
          )}
        </div>
      </div>
    </div>
  );
}
