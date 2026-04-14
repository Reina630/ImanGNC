import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, RotateCcw, Mail, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import notificationService, { type Notification } from "@/services/notificationService";
import { usePolling } from "@/hooks/usePolling";

const TYPE_CONFIG: Record<string, { icon: typeof AlertTriangle; bg: string; border: string; iconColor: string; label: string }> = {
  courrier_affecte: {
    icon: Mail,
    bg: "bg-blue-50",
    border: "border-blue-300",
    iconColor: "text-blue-600",
    label: "Affectation",
  },
  courrier_renvoye: {
    icon: RotateCcw,
    bg: "bg-amber-50",
    border: "border-amber-400",
    iconColor: "text-amber-600",
    label: "Renvoi",
  },
  courrier_urgent: {
    icon: AlertTriangle,
    bg: "bg-red-50",
    border: "border-red-400",
    iconColor: "text-red-600",
    label: "Urgent",
  },
};

const DEFAULT_CONFIG = TYPE_CONFIG.courrier_urgent;

function AlerteItem({
  alerte,
  onDismiss,
  // carousel controls (optional)
  total,
  index,
  onPrev,
  onNext,
}: {
  alerte: Notification;
  onDismiss: (id: number) => void;
  total?: number;
  index?: number;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[alerte.type] ?? DEFAULT_CONFIG;
  const Icon = cfg.icon;
  const isCarousel = total !== undefined && total > 1;

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 shadow-sm ${cfg.bg} ${cfg.border}`}>
      {/* Icône */}
      <Icon className={`h-4 w-4 shrink-0 ${cfg.iconColor}`} />

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wide shrink-0 ${cfg.iconColor}`}>
            {cfg.label}
          </span>
          <span className="text-xs font-semibold text-slate-800 truncate">{alerte.titre}</span>
        </div>
        <p className="text-xs text-slate-600 mt-0.5 truncate">{alerte.message}</p>
      </div>

      {/* Spacer (already provided by flex-1 above) */}
      <div className="shrink-0" />

      {/* Contrôles carrousel */}
      {isCarousel && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onPrev} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors">
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span className="text-[10px] text-slate-500 font-medium w-8 text-center">
            {(index ?? 0) + 1}/{total}
          </span>
          <button onClick={onNext} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors">
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        {alerte.courrier_id && (
          <button
            onClick={() => { onDismiss(alerte.id); navigate(`/courriers/${alerte.courrier_id}/details-rh`); }}
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded transition-colors ${cfg.iconColor} hover:bg-white/70`}
          >
            Voir <ArrowRight className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={() => onDismiss(alerte.id)}
          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-white/70 transition-colors"
          title="Ignorer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function AlertesBanner() {
  const [alertes, setAlertes] = useState<Notification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadAlertes = useCallback(async () => {
    try {
      const data = await notificationService.getAlertes();
      console.log('[AlertesBanner] alertes reçues:', data);
      setAlertes(data);
    } catch (err) {
      console.error('[AlertesBanner] erreur getAlertes:', err);
    }
  }, []);

  useEffect(() => { loadAlertes(); }, [loadAlertes]);
  usePolling(loadAlertes, 20_000);

  // Clamp index when alerts are dismissed
  useEffect(() => {
    if (alertes.length > 0 && currentIndex >= alertes.length) {
      setCurrentIndex(alertes.length - 1);
    }
  }, [alertes.length, currentIndex]);

  const handleDismiss = async (id: number) => {
    setAlertes((prev) => prev.filter((a) => a.id !== id));
    try {
      await notificationService.dismisserAlerte(id);
    } catch {
      // le polling rechargera au prochain cycle
    }
  };

  if (alertes.length === 0) return null;

  const isCarousel = alertes.length > 1;
  const alerte = alertes[currentIndex] ?? alertes[0];

  const handlePrev = () => setCurrentIndex((i) => (i - 1 + alertes.length) % alertes.length);
  const handleNext = () => setCurrentIndex((i) => (i + 1) % alertes.length);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={alerte.id}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
      >
        <AlerteItem
          alerte={alerte}
          onDismiss={handleDismiss}
          total={isCarousel ? alertes.length : undefined}
          index={isCarousel ? currentIndex : undefined}
          onPrev={isCarousel ? handlePrev : undefined}
          onNext={isCarousel ? handleNext : undefined}
        />
      </motion.div>
    </AnimatePresence>
  );
}
