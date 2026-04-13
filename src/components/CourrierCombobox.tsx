/**
 * Composant Combobox pour sélectionner un courrier avec recherche
 * Utilisé pour le champ "en réponse à"
 */

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search, Mail, Inbox, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import courrierService from "@/services/courrierService";
import type { CourrierSearchResult } from "@/types";

interface CourrierComboboxProps {
  value?: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
  typeCourrier?: "entrant" | "sortant" | "interne";
  excludeId?: number;
  disabled?: boolean;
}

export function CourrierCombobox({
  value,
  onValueChange,
  placeholder = "Sélectionner un courrier...",
  typeCourrier,
  excludeId,
  disabled = false,
}: CourrierComboboxProps) {
  const [open, setOpen] = useState(false);
  const [courriers, setCourriers] = useState<CourrierSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Charger les courriers selon le type et la recherche
  useEffect(() => {
    const loadCourriers = async () => {
      setLoading(true);
      try {
        const results = await courrierService.searchCourriers({
          q: searchQuery,
          type: typeCourrier,
          exclude: excludeId,
        });
        setCourriers(results);
      } catch (error) {
        console.error("Erreur lors de la recherche de courriers:", error);
        setCourriers([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourriers();
  }, [searchQuery, typeCourrier, excludeId]);

  // Trouver le courrier sélectionné
  const selectedCourrier = courriers.find((c) => c.id === value);

  // Icône selon le type de courrier
  const getIcon = (type: string) => {
    switch (type) {
      case "entrant":
        return <Inbox className="h-3 w-3 text-blue-600" />;
      case "sortant":
        return <Send className="h-3 w-3 text-emerald-600" />;
      case "interne":
        return <Mail className="h-3 w-3 text-purple-600" />;
      default:
        return <Mail className="h-3 w-3" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          {selectedCourrier ? (
            <div className="flex items-center gap-2 truncate">
              {getIcon(selectedCourrier.type_courrier)}
              <span className="font-medium">{selectedCourrier.numero_registre}</span>
              <span className="text-muted-foreground truncate">
                - {selectedCourrier.objet}
              </span>
            </div>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher par numéro, objet, expéditeur..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Recherche en cours...
              </div>
            ) : courriers.length === 0 ? (
              <CommandEmpty>
                {searchQuery
                  ? "Aucun courrier trouvé."
                  : "Commencez à taper pour rechercher..."}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {courriers.map((courrier) => (
                  <CommandItem
                    key={courrier.id}
                    value={courrier.id.toString()}
                    onSelect={() => {
                      onValueChange(courrier.id === value ? null : courrier.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === courrier.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getIcon(courrier.type_courrier)}
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {courrier.numero_registre}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {courrier.type_courrier_display}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {courrier.objet}
                        </span>
                        {courrier.expediteur && (
                          <span className="text-xs text-muted-foreground truncate">
                            De: {courrier.expediteur}
                          </span>
                        )}
                      </div>
                      {courrier.date_principale && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(courrier.date_principale).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
