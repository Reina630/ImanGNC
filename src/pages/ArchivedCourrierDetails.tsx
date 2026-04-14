/**
 * Page de détails d'un courrier archivé — LECTURE SEULE
 * Affiche toutes les informations du courrier sans aucune action de workflow.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Mail,
  Send,
  Inbox,
  Building2,
  Archive,
  Clock,
  Download,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Tag,
  Hash,
  Paperclip,
  Eye,
  MessageSquare,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import courrierService from '@/services/courrierService';
import type { Courrier } from '@/types';
import { cn } from '@/lib/utils';

export default function ArchivedCourrierDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [courrier, setCourrier] = useState<Courrier | null>(null);
  const [versions, setVersions] = useState<Courrier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const [data, versionsList] = await Promise.all([
          courrierService.getCourrier(parseInt(id)),
          courrierService.getCourrierVersions(parseInt(id)).catch(() => []),
        ]);
        setCourrier(data);
        setVersions(versionsList);
      } catch {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger le courrier.' });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDownload = async () => {
    if (!courrier) return;
    try {
      await courrierService.telechargerFichier(courrier.id, courrier.numero_registre);
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de télécharger le fichier.' });
    }
  };

  const fmtDate = (ds: string | null | undefined) => {
    if (!ds) return '—';
    return new Date(ds).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const fmtSize = (bytes: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const isArchiveDirect = (c: Courrier) =>
    !c.a_circuit &&
    !(c.affectations_v2?.length) &&
    !(c.affectations_list?.length);

  // ── Chargement ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800020] mx-auto mb-4" />
          <p className="text-sm text-slate-500">Chargement du courrier…</p>
        </div>
      </div>
    );
  }

  if (!courrier) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 gap-4">
        <AlertCircle className="h-14 w-14 text-slate-300" />
        <p className="text-slate-500">Courrier introuvable.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/archives')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux archives
        </Button>
      </div>
    );
  }

  const direct = isArchiveDirect(courrier);

  // ── Affectations à afficher (v2 ou ancien système)
  const affectations = courrier.affectations_v2?.length
    ? courrier.affectations_v2
    : (courrier.affectations_list ?? []);

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#f7f9fb]">

      {/* ── Bandeau de navigation ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/archives')} className="gap-2 text-slate-600">
          <ArrowLeft className="h-4 w-4" />
          Retour aux archives
        </Button>

        <div className="flex items-center gap-2">
          {courrier.fichier && (
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Télécharger
            </Button>
          )}
        </div>
      </div>

      {/* ── Contenu principal ───────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ══ Colonne gauche : Aperçu du fichier ══════════════════════════════ */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Titre */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge variant="outline" className="font-mono text-xs font-bold">
                    {courrier.numero_registre}
                  </Badge>
                  {/* Type */}
                  {courrier.type_courrier === 'entrant' && (
                    <Badge className="bg-blue-100 text-blue-700 border-0 gap-1">
                      <Inbox className="h-3 w-3" />Entrant
                    </Badge>
                  )}
                  {courrier.type_courrier === 'sortant' && (
                    <Badge className="bg-green-100 text-green-700 border-0 gap-1">
                      <Send className="h-3 w-3" />Sortant
                    </Badge>
                  )}
                  {courrier.type_courrier === 'interne' && (
                    <Badge className="bg-amber-100 text-amber-700 border-0 gap-1">
                      <Building2 className="h-3 w-3" />Interne
                    </Badge>
                  )}
                  {/* Mode archivage */}
                  <Badge className={cn("border-0 gap-1 text-xs", direct ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                    {direct ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                    {direct ? 'Archivé directement' : 'Archivé après traitement'}
                  </Badge>
                  {courrier.urgent && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />Urgent
                    </Badge>
                  )}
                </div>
                <h1 className="text-lg font-bold text-slate-900 leading-snug">
                  {courrier.objet}
                </h1>
                {courrier.reference_structure && (
                  <p className="text-sm text-slate-500 mt-1">
                    Réf. : <span className="font-medium text-slate-700">{courrier.reference_structure}</span>
                  </p>
                )}
              </div>
              <Archive className="h-8 w-8 text-slate-300 flex-shrink-0" />
            </div>
          </div>

          {/* Aperçu du document */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex-1">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Eye className="h-4 w-4 text-slate-400" />
              Aperçu du document
            </div>
            {courrier.fichier ? (
              <div className="relative">
                {courrier.file_type === 'pdf' || courrier.fichier.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={`${courrier.fichier}#toolbar=0`}
                    title="Aperçu PDF"
                    className="w-full"
                    style={{ height: '70vh', minHeight: 400 }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <FileText className="h-16 w-16 text-slate-200" />
                    <p className="text-sm text-slate-500">
                      Fichier {courrier.file_type?.toUpperCase() || 'inconnu'} · {fmtSize(courrier.file_size)}
                    </p>
                    <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                      <Download className="h-4 w-4" />
                      Télécharger pour visualiser
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <FileText className="h-14 w-14 text-slate-200" />
                <p className="text-sm text-slate-400">Aucun fichier joint</p>
              </div>
            )}
          </div>

          {/* Pièces jointes */}
          {courrier.pieces_jointes?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Paperclip className="h-4 w-4 text-slate-400" />
                Pièces jointes ({courrier.pieces_jointes.length})
              </div>
              <ul className="divide-y divide-slate-100">
                {courrier.pieces_jointes.map((pj) => (
                  <li key={pj.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{pj.nom_fichier}</p>
                        <p className="text-xs text-slate-400">{fmtSize(pj.file_size)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <a href={pj.fichier_url} download target="_blank" rel="noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ══ Colonne droite : Informations ═══════════════════════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* ── Identification ── */}
          <Section icon={<Info className="h-4 w-4" />} title="Identification">
            <InfoRow label="N° registre" value={courrier.numero_registre} mono />
            {courrier.reference && <InfoRow label="Référence interne" value={courrier.reference} />}
            {courrier.reference_structure && <InfoRow label="Référence structure" value={courrier.reference_structure} />}
            {courrier.categorie_name && (
              <InfoRow label="Catégorie" value={<Badge variant="secondary" className="text-xs">{courrier.categorie_name}</Badge>} />
            )}
          </Section>

          {/* ── Parties prenantes ── */}
          <Section icon={<User className="h-4 w-4" />} title="Parties prenantes">
            {courrier.expediteur && <InfoRow label="Expéditeur" icon={<Mail className="h-3.5 w-3.5 text-slate-400" />} value={courrier.expediteur} />}
            {courrier.destinataire && <InfoRow label="Destinataire" icon={<Send className="h-3.5 w-3.5 text-slate-400" />} value={courrier.destinataire} />}
            {courrier.service_emetteur && <InfoRow label="Service émetteur" icon={<Building2 className="h-3.5 w-3.5 text-slate-400" />} value={courrier.service_emetteur} />}
            {courrier.service_concerne_display && <InfoRow label="Service concerné" icon={<Building2 className="h-3.5 w-3.5 text-slate-400" />} value={courrier.service_concerne_display} />}
          </Section>

          {/* ── Dates ── */}
          <Section icon={<Calendar className="h-4 w-4" />} title="Dates">
            {courrier.date_reception && <InfoRow label="Réception" icon={<Calendar className="h-3.5 w-3.5 text-slate-400" />} value={fmtDate(courrier.date_reception)} />}
            {courrier.date_envoi && <InfoRow label="Envoi" icon={<Calendar className="h-3.5 w-3.5 text-slate-400" />} value={fmtDate(courrier.date_envoi)} />}
            {(courrier as any).date_circulation && <InfoRow label="Circulation" icon={<Calendar className="h-3.5 w-3.5 text-slate-400" />} value={fmtDate((courrier as any).date_circulation)} />}
            <InfoRow label="Enregistré le" icon={<Clock className="h-3.5 w-3.5 text-slate-400" />} value={fmtDate(courrier.created_at)} />
            {courrier.updated_at && courrier.updated_at !== courrier.created_at && (
              <InfoRow label="Mis à jour le" icon={<Clock className="h-3.5 w-3.5 text-slate-400" />} value={fmtDate(courrier.updated_at)} />
            )}
          </Section>

          {/* ── Enregistrement ── */}
          <Section icon={<User className="h-4 w-4" />} title="Enregistrement">
            <InfoRow label="Enregistré par" value={courrier.enregistre_par_nom || '—'} />
            {courrier.mode_reception && <InfoRow label="Mode réception" value={courrier.mode_reception} />}
            {courrier.mode_envoi && <InfoRow label="Mode envoi" value={courrier.mode_envoi} />}
          </Section>

          {/* ── Fichier ── */}
          {courrier.fichier && (
            <Section icon={<FileText className="h-4 w-4" />} title="Fichier principal">
              <InfoRow label="Format" value={(courrier.file_type || 'inconnu').toUpperCase()} />
              <InfoRow label="Taille" value={fmtSize(courrier.file_size)} />
            </Section>
          )}

          {/* ── Notes ── */}
          {courrier.notes && (
            <Section icon={<MessageSquare className="h-4 w-4" />} title="Notes">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed px-1">{courrier.notes}</p>
            </Section>
          )}

          {/* ── Versions ── */}
          {versions.length > 1 && (
            <Section icon={<GitBranch className="h-4 w-4" />} title={`Versions (${versions.length})`}>
              <ul className="space-y-2">
                {versions.map((v) => (
                  <li key={v.id} className={cn("rounded-lg border px-3 py-2.5", v.est_version_actuelle ? "border-[#800020]/30 bg-[#800020]/5" : "border-slate-100 bg-slate-50")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={v.est_version_actuelle ? 'default' : 'outline'} className="text-xs">
                          V{v.version_number}
                        </Badge>
                        {v.est_version_actuelle && (
                          <span className="text-[10px] text-[#800020] font-medium">Actuelle</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{fmtDate(v.created_at)}</span>
                    </div>
                    {v.enregistre_par_nom && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {v.enregistre_par_nom}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* ── Historique des affectations (lecture seule) ── */}
          {affectations.length > 0 && (
            <Section icon={<CheckCircle2 className="h-4 w-4" />} title="Historique des affectations">
              <ul className="space-y-2">
                {affectations.map((a: any, idx: number) => (
                  <li key={a.id ?? idx} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {a.destinataire_nom || a.utilisateur_nom_complet || '—'}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 leading-none">
                        {a.statut_display || a.statut || '—'}
                      </Badge>
                    </div>
                    {(a.service_nom || a.utilisateur_service) && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {a.service_nom || a.utilisateur_service}
                      </p>
                    )}
                    {(a.action_requise_display || a.action_requise) && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Action : {a.action_requise_display || a.action_requise}
                      </p>
                    )}
                    {a.date_echeance && (
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Échéance : {fmtDate(a.date_echeance)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Composants utilitaires ─────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="px-4 py-3 space-y-2">
        {children}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-0.5">
      <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className={cn("text-xs text-slate-900 text-right", mono && "font-mono")}>
        {value ?? '—'}
      </span>
    </div>
  );
}

