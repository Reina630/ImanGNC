import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Send,
  Save,
  FileText,
  Loader2,
  Reply,
  ListOrdered,
  CloudUpload,
  X,
  CheckCircle2,
  File,
  FileImage,
  FileType,
  PenLine,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import courrierService from "@/services/courrierService";
import affectationService from "@/services/affectationService";
import { useCategories } from "@/services/categoryHooks";
import type { Courrier } from "@/types";
import { jsPDF } from "jspdf";
import imanLogo from "@/assets/logo-iman.png";

type Tab = "uploader" | "rediger";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/jpg",
];
const ALLOWED_EXT = ".pdf,.doc,.docx,.jpg,.jpeg,.png";

function getFileIcon(file: File) {
  if (file.type === "application/pdf") return FileType;
  if (file.type.startsWith("image/")) return FileImage;
  return File;
}
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function RepondreCourrierPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const affectationSourceId = searchParams.get("affectation");
  const navigate = useNavigate();
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [courrierOriginal, setCourrierOriginal] = useState<Courrier | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tab, setTab] = useState<Tab>("uploader");

  const [objet, setObjet] = useState("");
  const [destinataire, setDestinataire] = useState("");
  const [message, setMessage] = useState("");
  const [dateEnvoi, setDateEnvoi] = useState(new Date().toISOString().split("T")[0]);
  const [modeEnvoi, setModeEnvoi] = useState("courrier");
  const [categorie, setCategorie] = useState("");

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await courrierService.getCourrier(parseInt(id));
        setCourrierOriginal(data);
        setDestinataire(data.expediteur ?? "");
        setObjet(`RE: ${data.objet}`);
        if (data.categorie) setCategorie(data.categorie.toString());
      } catch {
        toast({ title: "Erreur", description: "Courrier introuvable", variant: "destructive" });
        navigate("/courriers/suivi");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (tab === "rediger" && editorRef.current && courrierOriginal) {
      const defaultContent = `<p>Madame, Monsieur,</p>
<p>Suite à votre courrier référencé <strong>${courrierOriginal.numero_registre}</strong>${courrierOriginal.objet ? ` relatif à « ${courrierOriginal.objet} »` : ""}, nous avons bien pris connaissance de votre demande.</p>
<p><br></p><p><br></p>`;
      editorRef.current.innerHTML = defaultContent;
    }
  }, [tab, courrierOriginal]);

  useEffect(() => {
    if (uploadedFile && uploadedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(uploadedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [uploadedFile]);

  const execCmd = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value ?? undefined);
    editorRef.current?.focus();
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };
  const validateAndSetFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: "Format non supporté", description: "Formats acceptés : PDF, Word, JPG, PNG", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "Le fichier ne doit pas dépasser 20 Mo", variant: "destructive" });
      return;
    }
    setUploadedFile(file);
  };

  const htmlToText = (html: string): string => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    temp.querySelectorAll("p").forEach((p) => { p.innerHTML = p.innerHTML + "\n"; });
    temp.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
    return temp.textContent || temp.innerText || "";
  };

  const generateLetterFile = async (): Promise<File> => {
    const bodyContent = editorRef.current?.innerHTML || "";
    const bodyText = htmlToText(bodyContent);
    const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const logoImg = new Image();
    logoImg.src = imanLogo;
    await new Promise((resolve) => { logoImg.onload = resolve; logoImg.onerror = resolve; });
    const marginLeft = 25, marginRight = 25, pageWidth = 210, contentWidth = pageWidth - marginLeft - marginRight;
    let yPos = 20;
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      const lh = 15, lw = (logoImg.naturalWidth / logoImg.naturalHeight) * lh;
      pdf.addImage(logoImg, "PNG", marginLeft, yPos, lw, lh);
    }
    pdf.setFontSize(10); pdf.setTextColor(100);
    pdf.text(`Le ${today}`, pageWidth - marginRight, yPos + 5, { align: "right" });
    yPos += 25;
    pdf.setDrawColor(128, 0, 32); pdf.setLineWidth(0.5);
    pdf.line(marginLeft, yPos, pageWidth - marginRight, yPos); yPos += 10;
    pdf.setFontSize(14); pdf.setFont("helvetica", "bold"); pdf.setTextColor(128, 0, 32);
    pdf.text("IMAN GED", marginLeft, yPos); yPos += 7;
    pdf.setFontSize(9); pdf.setFont("helvetica", "normal"); pdf.setTextColor(120);
    pdf.text("Gestion Électronique de Documents", marginLeft, yPos);
    pdf.text("Email: imanged307@gmail.com", marginLeft, yPos + 5); yPos += 15;
    pdf.setFontSize(9); pdf.setFont("helvetica", "bold"); pdf.setTextColor(80);
    pdf.text("À L'ATTENTION DE", marginLeft, yPos); yPos += 5;
    pdf.setFontSize(11); pdf.setFont("helvetica", "normal"); pdf.setTextColor(0);
    pdf.text(destinataire, marginLeft, yPos); yPos += 12;
    pdf.setFontSize(10); pdf.setTextColor(80);
    [{ label: "Objet :", value: objet }, { label: "Référence :", value: courrierOriginal?.numero_registre || "" }, { label: "Date :", value: today }].forEach((item) => {
      pdf.setFont("helvetica", "bold"); pdf.text(item.label, marginLeft, yPos);
      pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(item.value, contentWidth - 40);
      pdf.text(lines, marginLeft + 35, yPos); yPos += 5 * lines.length;
    });
    yPos += 5;
    pdf.setDrawColor(200); pdf.setLineWidth(0.3);
    pdf.line(marginLeft, yPos, pageWidth - marginRight, yPos); yPos += 8;
    pdf.setFontSize(11); pdf.setFont("helvetica", "normal"); pdf.setTextColor(0);
    const bodyLines = pdf.splitTextToSize(bodyText, contentWidth);
    bodyLines.forEach((line: string) => {
      if (yPos > 270) { pdf.addPage(); yPos = 20; }
      pdf.text(line, marginLeft, yPos); yPos += 6;
    });
    yPos += 15;
    if (yPos > 250) { pdf.addPage(); yPos = 20; }
    pdf.setFont("helvetica", "normal"); pdf.text("Le Responsable,", marginLeft, yPos); yPos += 5;
    pdf.setFont("helvetica", "bold"); pdf.text("IMAN GED", marginLeft, yPos);
    const pdfBlob = pdf.output("blob");
    return new File([pdfBlob], `reponse-${courrierOriginal?.numero_registre ?? "courrier"}.pdf`, { type: "application/pdf" });
  };

  const handleSave = async (soumettre = false) => {
    if (!destinataire.trim() || !objet.trim()) {
      toast({ title: "Champs requis", description: "Veuillez remplir l'objet et le destinataire", variant: "destructive" });
      return;
    }
    if (tab === "rediger") {
      const bodyHtml = editorRef.current?.innerHTML ?? "";
      if (!bodyHtml || bodyHtml === "<br>" || bodyHtml.trim() === "") {
        toast({ title: "Corps vide", description: "Veuillez rédiger le contenu du courrier", variant: "destructive" });
        return;
      }
    } else if (tab === "uploader" && !uploadedFile) {
      toast({ title: "Aucun document", description: "Veuillez joindre le document de réponse", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("objet", objet);
      formData.append("destinataire", destinataire);
      formData.append("date_envoi", dateEnvoi);
      formData.append("mode_envoi", modeEnvoi);
      if (categorie) formData.append("categorie", categorie);
      if (tab === "rediger") {
        const bodyHtml = editorRef.current?.innerHTML ?? "";
        formData.set("contenu_lettre", bodyHtml);
      } else if (message.trim()) {
        formData.append("contenu_lettre", message);
      }
      const fichier = tab === "rediger" ? await generateLetterFile() : uploadedFile!;
      formData.append("fichier", fichier);

      let result;
      if (affectationSourceId) {
        // Endpoint dédié — accessible aux utilisateurs normaux
        formData.append("soumettre", soumettre ? "true" : "false");
        result = await affectationService.soumettreReponse(parseInt(affectationSourceId), formData);
      } else {
        // Fallback (RH seulement)
        formData.append("type_courrier", "sortant");
        formData.append("statut", soumettre ? "en_traitement" : "brouillon");
        if (courrierOriginal) formData.append("reponse_a", courrierOriginal.id.toString());
        result = await courrierService.createCourrier(formData);
      }

      toast({
        title: soumettre ? "Courrier soumis" : "Brouillon enregistré",
        description: soumettre
          ? `Le courrier ${result.numero_registre} a été soumis pour validation`
          : `Brouillon ${result.numero_registre} enregistré`,
      });
      navigate("/mes-courriers");
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.response?.data?.detail || err?.response?.data?.message || "Impossible de créer le courrier", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#800020]" />
          <p className="text-sm text-slate-500">Chargement du courrier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* En-tête */}
      <div className="bg-[#800020] border-b border-[#6a001a] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Reply className="h-4 w-4 text-white/60" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white">Répondre au courrier</h1>
            <span className="text-white/40 text-sm">—</span>
            <span className="font-mono text-xs text-white/70 truncate">{courrierOriginal?.numero_registre}</span>
            <span className="text-white/40 hidden sm:inline text-xs truncate">{courrierOriginal?.objet}</span>
          </div>
          <Badge className="bg-white/15 text-white/80 border-0 text-xs flex-shrink-0">Sortant</Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

          {/* Panneau principal */}
          <div className="space-y-4">

            {/* Onglets */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
              <button
                onClick={() => setTab("uploader")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === "uploader"
                    ? "bg-[#800020] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <CloudUpload className="h-4 w-4" />
                Importer un document
              </button>
              <button
                onClick={() => setTab("rediger")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === "rediger"
                    ? "bg-[#800020] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <PenLine className="h-4 w-4" />
                Rédiger le courrier
              </button>
            </div>

            {/* Champs communs */}
            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500 uppercase tracking-wide font-medium">À l'attention de *</Label>
                    <Input value={destinataire} onChange={(e) => setDestinataire(e.target.value)} placeholder="Nom / Organisme..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500 uppercase tracking-wide font-medium">Objet *</Label>
                    <Input value={objet} onChange={(e) => setObjet(e.target.value)} placeholder="Objet du courrier..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contenu de l'onglet */}
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>

                {tab === "uploader" ? (
                  <div className="space-y-4">
                    {/* Zone de dépôt */}
                    {!uploadedFile ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all min-h-[220px] ${
                          isDragOver ? "border-[#800020] bg-[#800020]/5 scale-[1.01]" : "border-slate-300 bg-white hover:border-[#800020]/50 hover:bg-slate-50"
                        }`}
                      >
                        <input ref={fileInputRef} type="file" accept={ALLOWED_EXT} className="hidden" onChange={handleFileInput} />
                        <div className={`p-4 rounded-full mb-3 transition-colors ${isDragOver ? "bg-[#800020]/10" : "bg-slate-100"}`}>
                          <CloudUpload className={`h-8 w-8 transition-colors ${isDragOver ? "text-[#800020]" : "text-slate-400"}`} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 mb-1">{isDragOver ? "Déposez le fichier ici" : "Glissez-déposez votre document"}</p>
                        <p className="text-xs text-slate-400 mb-3">ou cliquez pour parcourir</p>
                        <div className="flex gap-2">
                          {["PDF", "Word", "JPG", "PNG"].map((fmt) => (
                            <span key={fmt} className="text-xs border border-slate-200 text-slate-500 rounded-full px-2.5 py-0.5 font-medium">{fmt}</span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-300 mt-2">Taille maximale : 20 Mo</p>
                      </div>
                    ) : (
                      <Card className="shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-semibold">Document joint</span>
                          </div>
                          <button onClick={() => { setUploadedFile(null); setPreviewUrl(null); }} className="text-white/70 hover:text-white transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {previewUrl ? (
                                <img src={previewUrl} alt="Aperçu" className="w-16 h-20 object-cover rounded-lg border border-slate-200" />
                              ) : (
                                <div className="w-16 h-20 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                                  {(() => { const Icon = getFileIcon(uploadedFile); return <Icon className="h-7 w-7 text-slate-400" />; })()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">{uploadedFile.name}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{formatFileSize(uploadedFile.size)}</p>
                              <button onClick={() => { setUploadedFile(null); setPreviewUrl(null); }} className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                                <X className="h-3 w-3" />Changer de fichier
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Message d'accompagnement */}
                    <Card className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500 uppercase tracking-wide font-medium flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Message d'accompagnement
                            <span className="normal-case text-slate-300 font-normal">(optionnel)</span>
                          </Label>
                          <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ajoutez une note ou un commentaire qui accompagnera le document..."
                            className="resize-none text-sm min-h-[100px]"
                            maxLength={1000}
                          />
                          <p className="text-xs text-slate-300 text-right">{message.length}/1000</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  /* Éditeur */
                  <Card className="shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      {/* En-tête lettre */}
                      <div className="bg-gradient-to-r from-[#800020]/5 via-[#800020]/8 to-[#800020]/5 border-b px-6 py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#800020]/15 flex items-center justify-center">
                              <img src={imanLogo} alt="IMAN" className="h-6 w-6 object-contain" />
                            </div>
                            <div>
                              <div className="font-bold text-[#800020] text-sm">IMAN GED</div>
                              <div className="text-xs text-slate-400">Gestion Électronique de Documents</div>
                            </div>
                          </div>
                          <div className="text-right text-xs text-slate-400">
                            {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-200/60">
                          <span><span className="font-medium text-slate-600">Réf. :</span> <span className="font-mono">{courrierOriginal?.numero_registre}</span></span>
                          <span><span className="font-medium text-slate-600">À :</span> {destinataire || "—"}</span>
                          <span><span className="font-medium text-slate-600">Objet :</span> {objet || "—"}</span>
                        </div>
                      </div>
                      {/* Toolbar */}
                      <div className="flex items-center gap-0.5 px-4 py-2 border-b bg-slate-50/70">
                        {[{ icon: Bold, cmd: "bold", title: "Gras" }, { icon: Italic, cmd: "italic", title: "Italique" }, { icon: Underline, cmd: "underline", title: "Souligné" }].map(({ icon: Icon, cmd, title }) => (
                          <Button key={cmd} type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-200" onClick={() => execCmd(cmd)} title={title}><Icon className="h-3.5 w-3.5" /></Button>
                        ))}
                        <Separator orientation="vertical" className="h-5 mx-1.5" />
                        {[{ icon: AlignLeft, cmd: "justifyLeft", title: "Gauche" }, { icon: AlignCenter, cmd: "justifyCenter", title: "Centrer" }, { icon: AlignRight, cmd: "justifyRight", title: "Droite" }].map(({ icon: Icon, cmd, title }) => (
                          <Button key={cmd} type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-200" onClick={() => execCmd(cmd)} title={title}><Icon className="h-3.5 w-3.5" /></Button>
                        ))}
                        <Separator orientation="vertical" className="h-5 mx-1.5" />
                        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-200" onClick={() => execCmd("insertUnorderedList")}><List className="h-3.5 w-3.5" /></Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-200" onClick={() => execCmd("insertOrderedList")}><ListOrdered className="h-3.5 w-3.5" /></Button>
                      </div>
                      {/* Zone d'édition */}
                      <div className="px-6 pt-5 pb-2 min-h-[280px] bg-white">
                        <style>{`#letter-editor:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none}#letter-editor:focus{outline:none}#letter-editor p{margin:0 0 .6em 0}`}</style>
                        <div id="letter-editor" ref={editorRef} contentEditable suppressContentEditableWarning data-placeholder="Rédigez votre courrier ici..." className="min-h-[240px] text-sm leading-relaxed" style={{ fontFamily: "Arial, sans-serif", fontSize: "11pt", lineHeight: "1.75" }} />
                      </div>
                      {/* Formules */}
                      <div className="px-6 pb-4 pt-3 border-t bg-slate-50/50">
                        <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Formules de politesse</p>
                        <div className="flex flex-wrap gap-1.5">
                          {["Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.", "Dans l'attente de votre retour, veuillez recevoir l'expression de mes cordiales salutations.", "Avec mes cordiales salutations.", "Je reste à votre disposition pour tout renseignement complémentaire."].map((formule) => (
                            <button key={formule} type="button" title={formule} onClick={() => { if (editorRef.current) { document.execCommand("insertHTML", false, `<br><p><em>${formule}</em></p>`); editorRef.current.focus(); } }} className="text-xs text-slate-500 hover:text-[#800020] border border-slate-200 hover:border-[#800020]/30 rounded-md px-2.5 py-1 hover:bg-[#800020]/5 transition-colors text-left max-w-[200px] truncate">
                              {formule.length > 45 ? formule.substring(0, 45) + "…" : formule}
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-4 lg:sticky lg:top-4">
            <Card className="shadow-sm overflow-hidden">
              <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-300" />
                <span className="text-sm font-semibold text-white">Courrier d'origine</span>
              </div>
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">N° Registre</span>
                  <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">{courrierOriginal?.numero_registre}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Type</span>
                  <Badge className="bg-blue-100 text-blue-700 text-xs border-0">{courrierOriginal?.type_courrier === "entrant" ? "Entrant" : "Interne"}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">Expéditeur</span>
                  <span className="font-medium text-xs text-right max-w-[140px] truncate text-slate-700">{courrierOriginal?.expediteur}</span>
                </div>
                <Separator />
                <div><span className="text-slate-400 text-xs block mb-1">Objet</span><p className="text-xs text-slate-700 leading-relaxed">{courrierOriginal?.objet}</p></div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm font-semibold text-slate-800">Options d'envoi</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Date d'envoi prévue</Label>
                  <Input type="date" value={dateEnvoi} onChange={(e) => setDateEnvoi(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Mode d'envoi</Label>
                  <Select value={modeEnvoi} onValueChange={setModeEnvoi}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="courrier">Courrier postal</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="fax">Fax</SelectItem>
                      <SelectItem value="main_propre">Remise en main propre</SelectItem>
                      <SelectItem value="coursier">Coursier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Catégorie</Label>
                  <Select value={categorie} onValueChange={setCategorie}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />Workflow de validation</div>
              <p><strong>Brouillon</strong> : enregistré, modifiable avant soumission.</p>
              <p><strong>Soumettre</strong> : le courrier rejoint le flux de traitement/signature.</p>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full gap-2 border-slate-300 hover:border-slate-400" disabled={saving} onClick={() => handleSave(false)}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Enregistrer en brouillon
              </Button>
              <Button className="w-full gap-2 bg-[#800020] hover:bg-[#600018] text-white" disabled={saving} onClick={() => handleSave(true)}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Soumettre pour validation
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
