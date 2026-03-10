import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireRHOrAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireRHOrAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isRHOrAdmin, loading } = useAuth();
  const location = useLocation();

  // Attendre que le chargement soit terminé
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si non authentifié, rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si admin requis et l'utilisateur n'est pas admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Si RH ou Admin requis et l'utilisateur n'a pas le bon rôle
  if (requireRHOrAdmin && !isRHOrAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
