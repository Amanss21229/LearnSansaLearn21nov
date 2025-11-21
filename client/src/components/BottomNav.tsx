import { Home, FileText, Sparkles, MessageCircle, User } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();

  const tabs = [
    { path: "/home", icon: Home, label: t("home"), testId: "nav-home" },
    { path: "/test", icon: FileText, label: t("test"), testId: "nav-test" },
    { path: "/ai-tutor", icon: Sparkles, label: t("aiTutor"), testId: "nav-ai-tutor" },
    { path: "/chat", icon: MessageCircle, label: t("chat"), testId: "nav-chat" },
    { path: "/profile", icon: User, label: t("profile"), testId: "nav-profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around px-2 z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => setLocation(tab.path)}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
              isActive
                ? "text-primary"
                : "text-muted-foreground hover-elevate"
            }`}
            data-testid={tab.testId}
          >
            <Icon className={`w-6 h-6 ${isActive ? "fill-primary" : ""}`} />
            <span className={`text-xs ${isActive ? "font-semibold" : "font-medium"}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
