import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import ChatsList from "./pages/ChatsList";
import EnhancedChatView from "./pages/EnhancedChatView";
import NewGroupChat from "./pages/NewGroupChat";
import Settings from "./pages/Settings";
import FriendRequests from "./pages/FriendRequests";
import StatusView from "./pages/StatusView";
import SearchUsers from "./pages/SearchUsers";
import ProfileSetup from "./pages/ProfileSetup";
import { CallProvider } from "./contexts/CallContext";
import IncomingCallNotification from "./components/IncomingCallNotification";
import ActiveCallUI from "./components/ActiveCallUI";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useState, useEffect } from "react";
import { useBackend } from "@/lib/backend";
import { Loader2, Activity } from "lucide-react";
import PerformanceDashboard from "./components/PerformanceDashboard";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();
const PUBLISHABLE_KEY = "pk_test_ZmFpci1kdWNrbGluZy01OC5jbGVyay5hY2NvdW50cy5kZXYk";

function App() {
  if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Clerk publishable key");
  }

  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary/90",
          card: "shadow-lg",
        },
      }}
      supportEmail="support@example.com"
    >
      <QueryClientProvider client={queryClient}>
        <SignedOut>
          <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-md">
              <SignIn routing="hash" />
            </div>
          </div>
        </SignedOut>
        <SignedIn>
          <Router>
            <AppInner />
          </Router>
        </SignedIn>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function AppInner() {
  const backend = useBackend();
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      html, body {
        overscroll-behavior: none;
        overscroll-behavior-y: none;
        position: fixed;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      #root {
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      * {
        -webkit-overflow-scrolling: touch;
      }
      textarea {
        -webkit-user-select: text;
        user-select: text;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const checkProfileSetup = async () => {
      try {
        const user = await backend.user.getCurrentUser();
        setNeedsProfileSetup(!user.profileSetupCompleted);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileSetup();
  }, [backend]);

  const handleProfileComplete = () => {
    setNeedsProfileSetup(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (needsProfileSetup) {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <CallProvider>
        <Routes>
          <Route path="/" element={
            <ErrorBoundary fallbackTitle="Unable to load chats" showHomeButton={false}>
              <ChatsList />
            </ErrorBoundary>
          } />
          <Route path="/chat/:chatId" element={
            <ErrorBoundary fallbackTitle="Unable to load chat" onReset={() => window.history.back()}>
              <EnhancedChatView />
            </ErrorBoundary>
          } />
          <Route path="/new-group" element={<NewGroupChat />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/friend-requests" element={<FriendRequests />} />
          <Route path="/status" element={
            <ErrorBoundary fallbackTitle="Unable to load status">
              <StatusView />
            </ErrorBoundary>
          } />
          <Route path="/search" element={<SearchUsers />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <IncomingCallNotification />
        <ActiveCallUI />
        
        {import.meta.env.DEV && (
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 right-4 z-40 shadow-lg"
            onClick={() => setShowPerformanceDashboard(true)}
            title="Performance Monitor"
          >
            <Activity className="h-5 w-5" />
          </Button>
        )}
        
        {showPerformanceDashboard && (
          <PerformanceDashboard onClose={() => setShowPerformanceDashboard(false)} />
        )}
      </CallProvider>
    </div>
  );
}

export default App;
