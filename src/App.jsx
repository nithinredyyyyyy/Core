import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { ThemeProvider } from '@/lib/ThemeContext';
import { SearchProvider } from '@/lib/SearchContext';

import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import Teams from './pages/TEAMS';
import PlayerProfile from './pages/PlayerProfile';
import Leaderboard from './pages/LEADERBOARD';
import News from './pages/News';
import NewsArticle from './pages/NewsArticle';
import Fans from './pages/Fans';
import Admin from './pages/Admin';
import { ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const LOCAL_ADMIN_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function AdminAccessGate() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalAdmin = LOCAL_ADMIN_HOSTS.has(hostname);
  const { data: authUser, isLoading } = useQuery({
    queryKey: ['auth-me', isLocalAdmin ? 'local' : 'remote'],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="max-w-lg rounded-[24px] border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl font-heading font-bold tracking-wide">Checking admin access…</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Validating your control-room session.
          </p>
        </div>
      </div>
    );
  }

  if (!isLocalAdmin && authUser?.role !== 'admin') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="max-w-lg rounded-[24px] border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="mt-4 text-2xl font-heading font-bold tracking-wide">ADMIN LOCKED</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Set a valid admin key in this browser to unlock the control room on the deployed site.
          </p>
        </div>
      </div>
    );
  }

  return <Admin />;
}

function LeaderboardAccessGate() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalAdmin = LOCAL_ADMIN_HOSTS.has(hostname);
  const [searchParams] = useSearchParams();

  if (isLocalAdmin) {
    return <Leaderboard />;
  }

  const tournamentId = searchParams.get('tournament');
  const target = tournamentId ? `/tournaments?id=${encodeURIComponent(tournamentId)}` : '/tournaments';
  return <Navigate to={target} replace />;
}

const RoutedApp = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/players/:playerIgn" element={<PlayerProfile />} />
        <Route path="/leaderboard" element={<LeaderboardAccessGate />} />
        <Route path="/fans" element={<Fans />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:articleId" element={<NewsArticle />} />
        <Route path="/admin" element={<AdminAccessGate />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <SearchProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <RoutedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </SearchProvider>
    </ThemeProvider>
  )
}

export default App

