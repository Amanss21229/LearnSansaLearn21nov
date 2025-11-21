import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserPublic } from "@shared/schema";
import { LogIn, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const { t } = useLanguage();
  const { setUser } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showContactSupport, setShowContactSupport] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      return await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: (user: UserPublic) => {
      setUser(user);
      toast({
        title: t("success"),
        description: t("loginSuccess"),
      });
      setLocation("/");
    },
    onError: (error: any) => {
      setShowContactSupport(true);
      toast({
        title: t("error"),
        description: error.message || t("loginFailed"),
        variant: "destructive",
      });
    },
  });

  const handleClearAndRetry = () => {
    console.log("🧹 Clearing localStorage...");
    localStorage.clear();
    console.log("✅ LocalStorage cleared");
    window.location.reload();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowContactSupport(false);
    
    // Clear any stale data before login
    console.log("🧹 Pre-login: Clearing stale localStorage data");
    localStorage.removeItem("sansa-user");
    
    if (!username || !password) {
      toast({
        title: t("error"),
        description: t("fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-3xl">{t("welcomeBack")}</CardTitle>
          <CardDescription className="text-base">{t("loginToAccount")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("username")} *</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("username")}
                data-testid="input-login-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")} *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password")}
                data-testid="input-login-password"
              />
            </div>

            {showContactSupport && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t("loginFailedContact")}{" "}
                  <a
                    href="https://wa.me/919153021229"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline"
                    data-testid="link-whatsapp-support"
                  >
                    WhatsApp: 9153021229
                  </a>
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loginMutation.isPending}
              data-testid="button-submit-login"
            >
              {loginMutation.isPending ? (
                t("loading")
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  {t("login")}
                </>
              )}
            </Button>

            <div className="text-center space-y-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setLocation("/register")}
                data-testid="button-go-to-register"
              >
                {t("dontHaveAccount")}
              </Button>
              
              <div className="pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAndRetry}
                  className="w-full text-xs"
                  data-testid="button-clear-cache"
                >
                  🧹 Clear Cache & Retry
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Use this if login is not working
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
