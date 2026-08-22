import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { ThemeProvider } from "@/lib/ThemeContext";
import { SearchProvider } from "@/lib/SearchContext";
import AppLayout from "./components/layout/AppLayout";
import PageLoader from "@/components/shared/PageLoader";
import { ShieldAlert } from "lucide-react";
import { useAdminAccess } from "@/lib/adminAccess";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const Home = lazy(() => import("./pages/Home"));
const News = lazy(() => import("./pages/News"));
const NewsArticle = lazy(() => import("./pages/NewsArticle"));
const Tournaments = lazy(() => import("./pages/Tournaments"));
const Teams = lazy(() => import("./pages/TEAMS"));
const PlayerProfile = lazy(() => import("./pages/PlayerProfile"));
const Leaderboard = lazy(() => import("./pages/LEADERBOARD"));
const Rankings = lazy(() => import("./pages/Rankings"));
const SignIn = lazy(() => import("./pages/SignIn"));
const Admin = lazy(() => import("./pages/Admin"));

function RouteFallback() {
  return <PageLoader label="Loading page" className="min-h-[50vh]" />;
}

function AdminAccessGate() {
  const { hasAdminAccess, isLoading } = useAdminAccess();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="max-w-lg rounded-[24px] border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl font-heading font-semibold tracking-wide">
            Checking admin access...
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Validating your control-room session.
          </p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="max-w-lg rounded-[24px] border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="size-6 text-destructive" />
          </div>
          <h1 className="mt-4 text-2xl font-heading font-semibold tracking-wide">
            ADMIN LOCKED
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sign in with an authorized Google admin account to unlock the
            control room.
          </p>
          <Link
            to={`/signin?returnTo=${encodeURIComponent(location.pathname)}`}
            className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Admin />
    </Suspense>
  );
}

const RoutedApp = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/app" element={<Navigate to="/" replace />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/players/:playerIgn" element={<PlayerProfile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:articleId" element={<NewsArticle />} />
          <Route path="/admin" element={<AdminAccessGate />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ThemeProvider>
      <SearchProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <RoutedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </SearchProvider>
    </ThemeProvider>
  );
}

export default App;
