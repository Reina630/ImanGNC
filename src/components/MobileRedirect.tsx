/**
 * Composant pour rediriger automatiquement les utilisateurs mobiles
 * vers l'interface mobile simplifiée
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function MobileRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Vérifier si l'utilisateur est sur mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768;

    // Pages à exclure de la redirection
    const excludedPaths = ['/mobile-scan', '/login', '/forgot-password'];
    const isExcluded = excludedPaths.some(path => location.pathname.startsWith(path));

    // Si mobile, authentifié, et pas sur une page exclue, rediriger vers mobile-scan
    if (isMobile && isAuthenticated && !isExcluded) {
      navigate('/mobile-scan', { replace: true });
    }
  }, [location.pathname, isAuthenticated, navigate]);

  return null; // Ce composant ne rend rien
}
