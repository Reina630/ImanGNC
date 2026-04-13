import { Search, Upload, ScanLine, Bell, Moon, Sun, Menu, LogOut, Settings as SettingsIcon, User, Building2, Mail, FileText } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import courrierService from "@/services/courrierService";
import type { Courrier } from "@/types";

interface TopBarProps {
  onMobileMenuToggle?: () => void;
}

export default function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [courriers, setCourriers] = useState<Courrier[]>([]);
  const [loadingCourriers, setLoadingCourriers] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
      navigate("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // Générer les initiales de l'utilisateur
  const getInitials = () => {
    if (!user) return "U";
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return "Utilisateur";
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  };

  const getRoleBadge = () => {
    if (!user) return "";
    const roles = {
      admin: "Administrateur",
      collaborator: "Collaborateur",
      client: "Client",
    };
    return roles[user.role] || user.role;
  };

  // Charger les courriers pour extraire les contacts
  useEffect(() => {
    const fetchCourriers = async () => {
      if (search.length >= 2) {
        try {
          setLoadingCourriers(true);
          const data = await courrierService.getCourriers();
          setCourriers(data);
        } catch (error) {
          console.error("Erreur lors du chargement des courriers:", error);
        } finally {
          setLoadingCourriers(false);
        }
      }
    };

    const timer = setTimeout(fetchCourriers, 300); // Debounce
    return () => clearTimeout(timer);
  }, [search]);

  // Extraire les contacts uniques
  const allContacts = useMemo(() => {
    const contactsSet = new Set<string>();
    courriers.forEach((c) => {
      if (c.expediteur) contactsSet.add(c.expediteur);
      if (c.destinataire) contactsSet.add(c.destinataire);
    });
    return Array.from(contactsSet).sort();
  }, [courriers]);

  // Suggestions filtrées
  const suggestions = useMemo(() => {
    if (!search || search.length < 2) return { contacts: [], courriers: [] };
    
    const searchLower = search.toLowerCase();
    
    // Contacts qui matchent
    const matchingContacts = allContacts.filter(contact => 
      contact.toLowerCase().includes(searchLower)
    ).slice(0, 5);
    
    // Courriers qui matchent (par objet ou numéro registre)
    const matchingCourriers = courriers.filter(c => 
      c.objet?.toLowerCase().includes(searchLower) ||
      c.numero_registre?.toLowerCase().includes(searchLower)
    ).slice(0, 3);
    
    return { contacts: matchingContacts, courriers: matchingCourriers };
  }, [search, allContacts, courriers]);

  const handleContactClick = (contact: string) => {
    setSearch("");
    setShowSuggestions(false);
    navigate(`/courriers/entite/${encodeURIComponent(contact)}`);
  };

  const handleCourrierClick = (courrierId: number) => {
    setSearch("");
    setShowSuggestions(false);
    navigate(`/courriers/${courrierId}`);
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 flex items-center px-4 lg:px-6 gap-4">
      {/* Mobile menu */}
      <button onClick={onMobileMenuToggle} className="lg:hidden text-muted-foreground hover:text-foreground">
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="max-w-xl relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un contact, courrier..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
        />
        
        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && search.length >= 2 && (suggestions.contacts.length > 0 || suggestions.courriers.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
            >
              {/* Section Contacts */}
              {suggestions.contacts.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1.5 flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    Contacts
                  </div>
                  {suggestions.contacts.map((contact, idx) => (
                    <button
                      key={`contact-${idx}`}
                      onClick={() => handleContactClick(contact)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors flex items-center gap-2 group"
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      <span className="text-sm text-foreground group-hover:text-primary font-medium">{contact}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Section Courriers */}
              {suggestions.courriers.length > 0 && (
                <div className="p-2 border-t border-border">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1.5 flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    Courriers
                  </div>
                  {suggestions.courriers.map((courrier) => (
                    <button
                      key={courrier.id}
                      onClick={() => handleCourrierClick(courrier.id)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors group"
                    >
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground group-hover:text-primary font-medium truncate">
                            {courrier.objet}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {courrier.numero_registre} • {courrier.date_courrier ? new Date(courrier.date_courrier).toLocaleDateString('fr-FR') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {loadingCourriers && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Recherche en cours...
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* <Button size="sm" className="hidden sm:flex gap-2">
          <Upload className="h-4 w-4" />
          <span className="hidden md:inline">Importer</span>
        </Button> */}

        {/* <Button size="sm" variant="outline" className="hidden sm:flex gap-2">
          <ScanLine className="h-4 w-4" />
          <span className="hidden md:inline">Scanner</span>
        </Button> */}

        {/* <button onClick={toggleDark} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button> */}

        <NotificationsDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:block text-sm font-medium">{getUserDisplayName()}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{getUserDisplayName()}</span>
                <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                <span className="text-xs text-primary font-normal mt-1">{getRoleBadge()}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <SettingsIcon className="h-4 w-4 mr-2" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
