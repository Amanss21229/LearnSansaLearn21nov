import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { UserPlus, LogIn } from "lucide-react";

export default function Welcome() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="font-heading text-4xl">{t("welcomeToSansaLearn")}</CardTitle>
          <CardDescription className="text-base">{t("getStarted")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => setLocation("/register")}
            className="w-full"
            size="lg"
            data-testid="button-create-account"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            {t("createAccount")}
          </Button>
          <Button
            onClick={() => setLocation("/login")}
            variant="outline"
            className="w-full"
            size="lg"
            data-testid="button-login"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {t("login")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
