import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileRedirect } from "@/components/MobileRedirect";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import DashboardRH from "./pages/DashboardRH";
import DashboardDG from "./pages/DashboardDG";
import Dashboard2 from "./pages/Dashboard2";
import DashboardDesign from "./pages/DashboardDesign";
import Documents from "./pages/Documents";
import Folders from "./pages/Folders";
import SearchPage from "./pages/SearchPage";
import SharedWithMe from "./pages/SharedWithMeNew";
import SharesPage from "./pages/SharesPage";
import Favorites from "./pages/Favorites";
import VersionHistory from "./pages/VersionHistory";
import ScanPage from "./pages/ScanPage";
import MobileScanPage from "./pages/MobileScanPage";
import AdminPanel from "./pages/AdminPanel";
import RegistreCourrierPage from "./pages/RegistreCourrierPage";
import RegistrePageNew from "./pages/RegistrePageNew";
import CourriersPrioritairesPage from "./pages/CourriersPrioritairesPage";
import ArchivesPage from "./pages/RegistrePageNew";
import DocumentArchivesPage from "./pages/DocumentArchivesPage";
import ArchivedDocumentDetails from "./pages/ArchivedDocumentDetails";
import ArchivedCourrierDetails from "./pages/ArchivedCourrierDetails";
import HistoriquePage from "./pages/HistoriquePage";
import NouveauCourrier from "./pages/NouveauCourrier";
import RepondreCourrierPage from "./pages/RepondreCourrierPage";
import DetailsCourrier from "./pages/DetailsCourrier";
import CourrierDetailsRHPage from "./pages/CourrierDetailsRHPage";
import HistoriqueEntite from "./pages/HistoriqueEntite";
import MesCourriers from "./pages/MesCourriers";
import VoirCourrierUser from "./pages/VoirCourrierUser";
import ArchiveReviewPage from "./pages/ArchiveReviewPage";


import TrackingCourrierPage from "./pages/TrackingCourrierPage";

import TrackerCourriersPage from "./pages/TrackerCourriersPage";
import DocumentationPage from "./pages/DocumentationPage";
import AffecterCourrierPage from "./pages/AffecterCourrierPage";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Redirection dynamique selon le rôle
import { useAuth } from "@/contexts/AuthContext";
function DashboardRedirect() {
  const { user } = useAuth();
  if (user?.role === "rh" || user?.role === "admin") return <DashboardRH />;
  if (user?.role === "dg") return <DashboardDG />;
  if (user?.role === "collaborator" || user?.role === "client") return <MesCourriers />;
  return <Dashboard />;
}

// Utiliser basename /ImanGNC seulement en production
const basename = import.meta.env.MODE === 'production' ? '/ImanGNC' : '';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={basename}>
          <AuthProvider>
          <MobileRedirect />
          <Routes>
            {/* Auth pages - no layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Mobile scan interface - no layout */}
            <Route path="/mobile-scan" element={
              <ProtectedRoute>
                <MobileScanPage />
              </ProtectedRoute>
            } />

            {/* App pages - with layout and protection */}
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<DashboardRedirect />} />
              <Route path="/dashboard-design" element={<DashboardDesign />} />
              <Route path="/dashboard2" element={<Dashboard2 />} />
              
              {/* Nouvelle route principale : Registre de Courrier */}
              <Route path="/mes-courriers" element={<MesCourriers />} />
              
              <Route path="/mes-courriers/traiter/:id" element={<VoirCourrierUser />} />
              
              {/* Routes réservées aux RH et Admin */}
              <Route path="/courriers" element={<ProtectedRoute requireRHOrAdmin><RegistreCourrierPage /></ProtectedRoute>} />
              <Route path="/registre-new" element={<ProtectedRoute requireRHOrAdmin><RegistrePageNew /></ProtectedRoute>} />
              <Route path="/courriers/affecter/:id" element={<ProtectedRoute requireRHOrAdmin><AffecterCourrierPage /></ProtectedRoute>} />
              <Route path="/courriers/nouveau" element={<ProtectedRoute requireRHOrAdmin><NouveauCourrier /></ProtectedRoute>} />
              <Route path="/courriers/repondre/:id" element={<ProtectedRoute requireRHOrAdmin><RepondreCourrierPage /></ProtectedRoute>} />
              <Route path="/courriers/prioritaires" element={<ProtectedRoute requireRHOrAdmin><CourriersPrioritairesPage /></ProtectedRoute>} />
              <Route path="/courriers/tracking" element={<ProtectedRoute requireRHOrAdmin><TrackingCourrierPage /></ProtectedRoute>} />
              
              <Route path="/courriers/suivi" element={<ProtectedRoute requireRHOrAdmin><TrackerCourriersPage /></ProtectedRoute>} />
              <Route path="/courriers/entite/:nom" element={<ProtectedRoute requireRHOrAdmin><HistoriqueEntite /></ProtectedRoute>} />
              <Route path="/courriers/:id/details-rh" element={<ProtectedRoute requireRHOrAdmin><CourrierDetailsRHPage /></ProtectedRoute>} />
              <Route path="/courriers/:id" element={<DetailsCourrier />} />
              <Route path="/archives" element={<ProtectedRoute requireRHOrAdmin><ArchivesPage /></ProtectedRoute>} />
              <Route path="/archives/nouveau" element={<ProtectedRoute requireRHOrAdmin><ArchiveReviewPage /></ProtectedRoute>} />
              <Route path="/archives/:id" element={<ProtectedRoute requireRHOrAdmin><ArchivedCourrierDetails /></ProtectedRoute>} />
              <Route path="/archives/documents" element={<DocumentArchivesPage />} />
              <Route path="/archives/documents/:id" element={<ArchivedDocumentDetails />} />
              <Route path="/historique" element={<HistoriquePage />} />
              
              {/* Routes de statistiques et documentation */}
              <Route path="/statistiques" element={<Dashboard />} /> {/* Temporaire, pourra être une page dédiée */}
              <Route path="/documentation" element={<DocumentationPage />} />
              
              {/* Anciennes routes conservées pour compatibilité (optionnel) */}
              <Route path="/documents" element={<Folders />} />
              <Route path="/folders" element={<Folders />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/shared" element={<SharedWithMe />} />
              <Route path="/shares" element={<SharesPage />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/history" element={<VersionHistory />} />
              <Route path="/scan" element={<ScanPage />} />
              
              {/* Paramètres - accessible à tous les utilisateurs authentifiés */}
              <Route path="/admin" element={<AdminPanel />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
