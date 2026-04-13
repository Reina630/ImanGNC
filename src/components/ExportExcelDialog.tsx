import { useState } from "react";
import { FileSpreadsheet, CheckSquare, Square, Filter, Columns, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ExportFilters {
  date_debut?: string;
  date_fin?: string;
  type_courrier?: string;
  statut?: string;
  concerne?: string;   // recherche sur expediteur ET destinataire
  service?: string;
  urgent?: boolean;
}

export interface ExportField {
  key: string;
  label: string;
  defaultChecked: boolean;
}

const FIELD_GROUPS: { title: string; fields: ExportField[] }[] = [
  {
    title: "Identification",
    fields: [
      { key: "numero_registre", label: "N° Registre", defaultChecked: true },
      { key: "type_courrier",   label: "Type",         defaultChecked: true },
      { key: "statut",          label: "Statut",        defaultChecked: true },
      { key: "urgent",          label: "Urgent",        defaultChecked: false },
    ],
  },
  {
    title: "Dates",
    fields: [
      { key: "date_reception", label: "Date Réception",   defaultChecked: true },
      { key: "mode_reception", label: "Mode de réception", defaultChecked: false },
      { key: "date_envoi",     label: "Date Envoi",        defaultChecked: true },
      { key: "mode_envoi",     label: "Mode d'envoi",      defaultChecked: false },
    ],
  },
  {
    title: "Parties",
    fields: [
      { key: "expediteur",   label: "Expéditeur",   defaultChecked: true },
      { key: "destinataire", label: "Destinataire", defaultChecked: true },
    ],
  },
  {
    title: "Contenu",
    fields: [
      { key: "objet",            label: "Objet",            defaultChecked: true },
      { key: "reference",        label: "Référence",        defaultChecked: true },
      { key: "categorie",        label: "Catégorie",        defaultChecked: false },
      { key: "service_concerne", label: "Service Concerné", defaultChecked: true },
      { key: "notes",            label: "Notes",            defaultChecked: true },
    ],
  },
  {
    title: "Métadonnées",
    fields: [
      { key: "enregistre_par", label: "Enregistré par",         defaultChecked: true },
      { key: "created_at",     label: "Date d'enregistrement",  defaultChecked: true },
    ],
  },
];

const ALL_FIELDS = FIELD_GROUPS.flatMap((g) => g.fields);

interface Props {
  open: boolean;
  onClose: () => void;
  contacts: string[];   // liste unique expediteurs + destinataires
  onExport: (exportFilters: ExportFilters, fields: string[]) => Promise<void>;
}

const EMPTY_FILTERS: ExportFilters = {};

export function ExportExcelDialog({ open, onClose, contacts, onExport }: Props) {
  const initialChecked = () =>
    Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f.defaultChecked]));

  const [checked, setChecked] = useState<Record<string, boolean>>(initialChecked);
  const [exportFilters, setExportFilters] = useState<ExportFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(false);
  const [concerneOpen, setConcerneOpen] = useState(false);

  const allChecked = ALL_FIELDS.every((f) => checked[f.key]);
  const noneChecked = ALL_FIELDS.every((f) => !checked[f.key]);

  const toggle = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleAll = () => {
    const newValue = !allChecked;
    setChecked(Object.fromEntries(ALL_FIELDS.map((f) => [f.key, newValue])));
  };

  const setFilter = (key: keyof ExportFilters, value: string | boolean | undefined) =>
    setExportFilters((prev) => ({ ...prev, [key]: value || undefined }));

  const resetFilters = () => setExportFilters(EMPTY_FILTERS);

  const handleExport = async () => {
    const selected = ALL_FIELDS.filter((f) => checked[f.key]).map((f) => f.key);
    if (selected.length === 0) return;
    setLoading(true);
    try {
      await onExport(exportFilters, selected);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = ALL_FIELDS.filter((f) => checked[f.key]).length;
  const activeFilterCount = Object.values(exportFilters).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Exporter en Excel
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="filtres">
          <TabsList className="w-full">
            <TabsTrigger value="filtres" className="flex-1 gap-2">
              <Filter className="h-3.5 w-3.5" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1.5 py-0.5 leading-none">
                  {activeFilterCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="colonnes" className="flex-1 gap-2">
              <Columns className="h-3.5 w-3.5" />
              Colonnes ({selectedCount})
            </TabsTrigger>
          </TabsList>

          {/* ─── Onglet Filtres ─── */}
          <TabsContent value="filtres" className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date début</Label>
                <Input
                  type="date"
                  value={exportFilters.date_debut ?? ""}
                  onChange={(e) => setFilter("date_debut", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date fin</Label>
                <Input
                  type="date"
                  value={exportFilters.date_fin ?? ""}
                  onChange={(e) => setFilter("date_fin", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Type de courrier</Label>
                <Select
                  value={exportFilters.type_courrier ?? ""}
                  onValueChange={(v) => setFilter("type_courrier", v === "all" ? undefined : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Tous les types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="entrant">Courrier entrant</SelectItem>
                    <SelectItem value="sortant">Courrier sortant</SelectItem>
                    <SelectItem value="interne">Courrier interne</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Statut</Label>
                <Select
                  value={exportFilters.statut ?? ""}
                  onValueChange={(v) => setFilter("statut", v === "all" ? undefined : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="recu">Reçu</SelectItem>
                    <SelectItem value="en_traitement">En traitement</SelectItem>
                    <SelectItem value="traite">Traité</SelectItem>
                    <SelectItem value="archive">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Concerné (expéditeur / destinataire)</Label>
                <Popover open={concerneOpen} onOpenChange={setConcerneOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate text-sm">
                        {exportFilters.concerne || "Tous les contacts"}
                      </span>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        {exportFilters.concerne && (
                          <X
                            className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilter("concerne", undefined);
                            }}
                          />
                        )}
                        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[420px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher un contact..." />
                      <CommandList>
                        <CommandEmpty>Aucun contact trouvé.</CommandEmpty>
                        <CommandGroup>
                          {contacts.map((c) => (
                            <CommandItem
                              key={c}
                              value={c}
                              onSelect={(val) => {
                                setFilter("concerne", val === exportFilters.concerne ? undefined : val);
                                setConcerneOpen(false);
                              }}
                              className={exportFilters.concerne === c ? "bg-accent" : ""}
                            >
                              {c}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Service concerné</Label>
                <Select
                  value={exportFilters.service ?? ""}
                  onValueChange={(v) => setFilter("service", v === "all" ? undefined : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Tous les services" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les services</SelectItem>
                    <SelectItem value="rh">Ressources Humaines</SelectItem>
                    <SelectItem value="comptabilite">Comptabilité</SelectItem>
                    <SelectItem value="direction">Direction</SelectItem>
                    <SelectItem value="technique">Service Technique</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="juridique">Juridique</SelectItem>
                    <SelectItem value="informatique">Informatique</SelectItem>
                    <SelectItem value="logistique">Logistique</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 pt-5">
                <Checkbox
                  id="urgent_filter"
                  checked={exportFilters.urgent === true}
                  onCheckedChange={(c) => setFilter("urgent", c === true ? true : undefined)}
                />
                <Label htmlFor="urgent_filter" className="cursor-pointer">Urgents uniquement</Label>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Réinitialiser les filtres
              </button>
            )}
          </TabsContent>

          {/* ─── Onglet Colonnes ─── */}
          <TabsContent value="colonnes" className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-sm text-muted-foreground">
                {selectedCount} colonne{selectedCount > 1 ? "s" : ""} sélectionnée{selectedCount > 1 ? "s" : ""}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={toggleAll}
              >
                {allChecked ? (
                  <><CheckSquare className="h-3.5 w-3.5" /> Tout désélectionner</>
                ) : (
                  <><Square className="h-3.5 w-3.5" /> Tout sélectionner</>
                )}
              </Button>
            </div>

            <Separator />

            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {FIELD_GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wide">
                    {group.title}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.fields.map((field) => (
                      <div key={field.key} className="flex items-center gap-2">
                        <Checkbox
                          id={field.key}
                          checked={checked[field.key]}
                          onCheckedChange={() => toggle(field.key)}
                        />
                        <Label htmlFor={field.key} className="text-sm font-normal cursor-pointer">
                          {field.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading || noneChecked}
            className="gap-2"
          >
            {loading ? (
              "Export en cours..."
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                Exporter ({selectedCount} colonnes)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
