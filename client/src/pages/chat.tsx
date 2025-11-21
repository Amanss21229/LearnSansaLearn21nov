import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Plus, Send, Smile, Pin, Image as ImageIcon, UserPlus, X, Check, Users2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { containsBadWords } from "@/lib/badWords";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import type { Group, Message, GroupMember } from "@shared/schema";
import EmojiPicker from "@/components/EmojiPicker";

export default function Chat() {
  const { t } = useLanguage();
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState<{ type: 'community' | 'group'; group?: Group } | null>({ type: 'community' });
  const [messageInput, setMessageInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Array<Message & { userName: string; userPhoto?: string }>>([]);
  const [groupName, setGroupName] = useState("");
  const [groupUsername, setGroupUsername] = useState("");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("community");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's groups
  const { data: myGroups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups/my", user?.id],
    enabled: !!user,
  });

  // Fetch join requests for current group
  const { data: joinRequests = [] } = useQuery({
    queryKey: ["/api/groups/join-requests", selectedChat?.group?.id],
    enabled: !!selectedChat?.group && selectedChat.type === 'group' && user?.id === selectedChat.group.creatorId,
  });

  // Fetch chat settings
  const { data: chatSettings } = useQuery<{ isEnabled: boolean }>({
    queryKey: ["/api/chat/settings", user?.stream],
    enabled: !!user,
  });

  // Create group mutation
  const createGroupMutation = useMutation<Group, Error, { name: string; username: string; creatorId: string }>({
    mutationFn: async (data: { name: string; username: string; creatorId: string }) => {
      return await apiRequest<Group>("POST", "/api/groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups/my"] });
      setGroupName("");
      setGroupUsername("");
      setCreateGroupOpen(false);
      toast({ title: t("success"), description: "Group created successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    },
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return await apiRequest("POST", `/api/groups/${groupId}/join`, { userId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups/my"] });
      toast({ title: t("success"), description: "Join request sent!" });
    },
  });

  // Accept join request
  const acceptJoinMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      return await apiRequest("PATCH", `/api/groups/members/${membershipId}`, { status: "accepted" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups/join-requests"] });
      toast({ title: t("success"), description: "Member accepted!" });
    },
  });

  // Toggle chat settings
  const toggleChatMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return await apiRequest("PATCH", `/api/chat/settings/${user?.stream}`, { isEnabled: enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/settings"] });
    },
  });

  // Pin message mutation
  const pinMessageMutation = useMutation({
    mutationFn: async ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) => {
      return await apiRequest("PATCH", `/api/messages/${messageId}/pin`, { isPinned });
    },
    onSuccess: (data) => {
      // Update local message state
      setMessages(prev => prev.map(msg => 
        msg.id === data.id 
          ? { ...msg, isPinned: data.isPinned }
          : msg
      ));
      toast({ title: t("success"), description: data.isPinned ? "Message pinned!" : "Message unpinned!" });
    },
  });

  // Socket.IO connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket.io");
      newSocket.emit("auth", { userId: user.id });
    });

    newSocket.on("new_message", (message: Message & { userName: string; userPhoto?: string }) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on("reaction_added", (data: { messageId: string; emoji: string; userId: string; reactions: any }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, reactions: data.reactions }
          : msg
      ));
    });

    newSocket.on("message_pinned", (data: { messageId: string; isPinned: boolean }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, isPinned: data.isPinned }
          : msg
      ));
    });

    newSocket.on("chat_disabled", (data: { message: string }) => {
      toast({
        title: "Chat disabled",
        description: data.message,
        variant: "destructive",
      });
    });

    newSocket.on("bad_word_detected", (data: { message: string }) => {
      toast({
        title: "Message blocked",
        description: data.message,
        variant: "destructive",
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  // Fetch messages when chat changes
  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      try {
        let url = "";
        if (selectedChat.type === "community") {
          url = `/api/messages/community/${user?.stream}`;
        } else if (selectedChat.group) {
          url = `/api/messages/group/${selectedChat.group.id}`;
          socket?.emit("join_group", { groupId: selectedChat.group.id });
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchMessages();
  }, [selectedChat, user, socket]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!messageInput.trim() || !socket || !user) return;

    if (containsBadWords(messageInput)) {
      toast({
        title: "Message blocked",
        description: "Your message contains inappropriate content",
        variant: "destructive",
      });
      return;
    }

    let content = messageInput;
    let type: "text" | "image" = "text";

    // Handle image upload
    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        content = data.url;
        type = "image";
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Could not upload image",
          variant: "destructive",
        });
        return;
      }
    }

    const messageData: any = {
      content,
      type,
    };

    if (selectedChat?.type === "group" && selectedChat.group) {
      messageData.groupId = selectedChat.group.id;
    } else {
      messageData.stream = user.stream;
    }

    socket.emit("send_message", messageData);
    setMessageInput("");
    setImageFile(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!socket || !user) return;
    socket.emit("add_reaction", { messageId, emoji });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        toast({ title: t("success"), description: "Image selected" });
      } else {
        toast({
          title: "Invalid file",
          description: "Please select an image file",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || !groupUsername.trim() || !user) return;
    
    createGroupMutation.mutate({
      name: groupName,
      username: groupUsername,
      creatorId: user.id,
    });
  };

  const hasBadWords = containsBadWords(messageInput);
  const isChatEnabled = chatSettings?.isEnabled !== false;

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            {activeTab === "groups" && (
              <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
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
                      <Input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder={t("groupName")}
                        data-testid="input-group-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("groupUsername")}</Label>
                      <Input
                        value={groupUsername}
                        onChange={(e) => setGroupUsername(e.target.value)}
                        placeholder={t("groupUsername")}
                        data-testid="input-group-username"
                      />
                    </div>
                    <Button
                      onClick={handleCreateGroup}
                      disabled={createGroupMutation.isPending}
                      className="w-full"
                      data-testid="button-submit-group"
                    >
                      {createGroupMutation.isPending ? t("creating") : t("createGroup")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === "community" && (
              <Card
                className={`hover-elevate active-elevate-2 cursor-pointer ${
                  selectedChat?.type === "community" ? "border-primary" : ""
                }`}
                onClick={() => setSelectedChat({ type: "community" })}
                data-testid="card-community-chat"
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{user?.stream} Community</div>
                    <div className="text-xs text-muted-foreground">
                      All {user?.stream} students
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "groups" && myGroups.map((group) => (
              <Card
                key={group.id}
                className={`hover-elevate active-elevate-2 cursor-pointer ${
                  selectedChat?.type === "group" && selectedChat.group?.id === group.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedChat({ type: "group", group })}
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
                  {group.creatorId === user?.id && (
                    <Badge variant="secondary" className="text-xs">Admin</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {selectedChat?.type === "group" && selectedChat.group
                  ? selectedChat.group.name[0]
                  : <MessageCircle className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-heading font-semibold text-lg">
                {selectedChat?.type === "group" && selectedChat.group
                  ? selectedChat.group.name
                  : `${user?.stream} Community`}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedChat?.type === "group" && selectedChat.group
                  ? `@${selectedChat.group.username}`
                  : t("communityChat")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.isAdmin && selectedChat?.type === "community" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleChatMutation.mutate(!isChatEnabled)}
                data-testid="button-toggle-chat"
              >
                {isChatEnabled ? "Disable Chat" : "Enable Chat"}
              </Button>
            )}
            {selectedChat?.type === "group" && selectedChat.group?.creatorId === user?.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowJoinRequests(!showJoinRequests)}
                data-testid="button-join-requests"
              >
                <Users2 className="w-4 h-4 mr-2" />
                Requests {joinRequests.length > 0 && `(${joinRequests.length})`}
              </Button>
            )}
          </div>
        </div>

        {/* Join Requests Panel */}
        {showJoinRequests && selectedChat?.type === "group" && (
          <div className="p-4 border-b bg-muted/30">
            <h3 className="font-semibold mb-3">Join Requests</h3>
            <div className="space-y-2">
              {!joinRequests || (Array.isArray(joinRequests) && joinRequests.length === 0) ? (
                <p className="text-sm text-muted-foreground">No pending requests</p>
              ) : (
                Array.isArray(joinRequests) && joinRequests.map((request: any) => (
                  <div key={request.id} className="flex items-center justify-between p-2 bg-card rounded-md">
                    <span className="text-sm">{request.userName || "Unknown"}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => acceptJoinMutation.mutate(request.id)}
                        data-testid={`button-accept-${request.id}`}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-reject-${request.id}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {!isChatEnabled && selectedChat?.type === "community" && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chat is currently disabled by admin</p>
              </div>
            )}

            {isChatEnabled && messages.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}

            {isChatEnabled && messages.map((message, index) => (
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
                <div className="flex flex-col gap-1 max-w-[70%]">
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.userId === user?.id
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border rounded-tl-sm"
                    }`}
                  >
                    {message.userId !== user?.id && (
                      <p className="text-xs font-semibold mb-1 opacity-90">{message.userName}</p>
                    )}
                    {message.type === "image" ? (
                      <img src={message.content} alt="Chat image" className="rounded-md max-w-full" />
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs opacity-70">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                      {message.isPinned && (
                        <Pin className="w-3 h-3 opacity-70" />
                      )}
                    </div>
                  </div>
                  {message.reactions && typeof message.reactions === 'object' && Object.keys(message.reactions).length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {Object.entries(message.reactions as Record<string, string[]>).map(([emoji, userIds]) => (
                        <Badge
                          key={emoji}
                          variant="secondary"
                          className="text-xs cursor-pointer hover-elevate"
                          onClick={() => handleReaction(message.id, emoji)}
                          data-testid={`reaction-${emoji}`}
                        >
                          {emoji} {Array.isArray(userIds) ? userIds.length : 0}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1">
                    <EmojiPicker onSelect={(emoji) => handleReaction(message.id, emoji)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        data-testid={`button-react-${index}`}
                      >
                        <Smile className="w-3 h-3 mr-1" />
                        React
                      </Button>
                    </EmojiPicker>
                  </div>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-card">
          {imageFile && (
            <div className="mb-2 p-2 bg-muted rounded-md flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span className="text-sm flex-1">{imageFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImageFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <EmojiPicker onSelect={handleEmojiSelect} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-image"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !hasBadWords && isChatEnabled && sendMessage()}
              placeholder={isChatEnabled ? t("sendMessage") : "Chat is disabled"}
              className="flex-1"
              disabled={!isChatEnabled}
              data-testid="input-chat-message"
            />
            <Button
              onClick={sendMessage}
              disabled={!messageInput.trim() || hasBadWords || !isChatEnabled}
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
