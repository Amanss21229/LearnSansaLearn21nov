import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Image as ImageIcon, Mic, Sparkles, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AITutor() {
  const { t } = useLanguage();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest<{ response: string }>("POST", "/api/ai-tutor", { message });
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }]);
    },
  });

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(inputMessage);
    setInputMessage("");
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-purple-500/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl">{t("aiTutorGreeting")}</h1>
              <p className="text-sm text-muted-foreground">{t("aiTutorFeatures")}</p>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
              <h3 className="font-heading font-semibold text-lg mb-2">Start Learning with AIMAI</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Ask me any academic question, upload images of problems, or send audio queries. I'm here to help you learn!
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`message-${message.role}-${index}`}
            >
              {message.role === "assistant" && (
                <Avatar className="w-10 h-10 bg-gradient-to-br from-primary to-purple-500">
                  <AvatarFallback className="bg-transparent text-white">
                    <Sparkles className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] rounded-2xl p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-card border rounded-tl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-2 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {message.role === "user" && (
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {user?.name?.[0] || <User className="w-5 h-5" />}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-card">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <Button variant="outline" size="icon" data-testid="button-upload-image">
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" data-testid="button-audio">
            <Mic className="w-5 h-5" />
          </Button>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("typeMessage")}
            className="flex-1"
            data-testid="input-message"
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim() || sendMessageMutation.isPending}
            size="icon"
            data-testid="button-send"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
