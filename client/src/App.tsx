import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { UserProvider, useUser } from "@/contexts/UserContext";
import BottomNav from "@/components/BottomNav";
import Welcome from "@/pages/welcome";
import Login from "@/pages/login";
import Registration from "@/pages/registration";
import Home from "@/pages/home";
import TestPage from "@/pages/test-page";
import AITutor from "@/pages/ai-tutor";
import Chat from "@/pages/chat";
import Profile from "@/pages/profile";
import Announcements from "@/pages/announcements";

function AuthenticatedApp() {
  const { user } = useUser();
  const [location] = useLocation();

  // Allow access to welcome, login, and registration pages without authentication
  const publicRoutes = ["/", "/welcome", "/login", "/register"];
  const isPublicRoute = publicRoutes.includes(location);

  if (!user && !isPublicRoute) {
    return <Redirect to="/" />;
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Welcome} />
        <Route path="/welcome" component={Welcome} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Registration} />
        <Route component={() => <Redirect to="/" />} />
      </Switch>
    );
  }

  return (
    <div className="h-screen flex flex-col pb-16">
      <div className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={() => <Redirect to="/home" />} />
          <Route path="/welcome" component={() => <Redirect to="/home" />} />
          <Route path="/login" component={() => <Redirect to="/home" />} />
          <Route path="/register" component={() => <Redirect to="/home" />} />
          <Route path="/home" component={Home} />
          <Route path="/announcements" component={Announcements} />
          <Route path="/test" component={TestPage} />
          <Route path="/ai-tutor" component={AITutor} />
          <Route path="/chat" component={Chat} />
          <Route path="/profile" component={Profile} />
          <Route component={() => <Redirect to="/home" />} />
        </Switch>
      </div>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <UserProvider>
          <AuthenticatedApp />
        </UserProvider>
      </LanguageProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
