import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Folders from "./pages/Folders";
import SearchPage from "./pages/SearchPage";
import SharedWithMe from "./pages/SharedWithMeNew";
import SharesPage from "./pages/SharesPage";
import Favorites from "./pages/Favorites";
import VersionHistory from "./pages/VersionHistory";
import ScanPage from "./pages/ScanPage";
import AdminPanel from "./pages/AdminPanel";
import SettingsPage from "./pages/SettingsPage";
import RegistreCourrierPage from "./pages/RegistreCourrierPage";
import CourriersPrioritairesPage from "./pages/CourriersPrioritairesPage";
import ArchivesPage from "./pages/ArchivesPage";
import PartagesPage from "./pages/PartagesPage";
import NouveauCourrier from "./pages/NouveauCourrier";
import DetailsCourrier from "./pages/DetailsCourrier";
import HistoriqueEntite from "./pages/HistoriqueEntite";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth pages - no layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* App pages - with layout and protection */}
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Dashboard />} />
              
              {/* Nouvelle route principale : Registre de Courrier */}
              <Route path="/courriers" element={<RegistreCourrierPage />} />
              <Route path="/courriers/nouveau" element={<NouveauCourrier />} />
              <Route path="/courriers/prioritaires" element={<CourriersPrioritairesPage />} />
              <Route path="/courriers/entite/:nom" element={<HistoriqueEntite />} />
              <Route path="/courriers/:id" element={<DetailsCourrier />} />
              <Route path="/archives" element={<ArchivesPage />} />
              <Route path="/partages" element={<PartagesPage />} />
              
              {/* Routes de statistiques et paramètres */}
              <Route path="/statistiques" element={<Dashboard />} /> {/* Temporaire, pourra être une page dédiée */}
              <Route path="/settings" element={<SettingsPage />} />
              
              {/* Anciennes routes conservées pour compatibilité (optionnel) */}
              <Route path="/documents" element={<Folders />} />
              <Route path="/folders" element={<Folders />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/shared" element={<SharedWithMe />} />
              <Route path="/shares" element={<SharesPage />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/history" element={<VersionHistory />} />
              <Route path="/scan" element={<ScanPage />} />
              
              {/* Admin only */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminPanel />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
