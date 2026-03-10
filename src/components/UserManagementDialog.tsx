import { useState, useEffect } from "react";
import { X, Loader2, User as UserIcon, Mail, Lock, Shield, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateUser, useUpdateUser } from "@/services";
import { useServices } from "@/services/serviceHooks";
import type { User } from "@/types";

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function UserManagementDialog({ open, onOpenChange, user }: UserManagementDialogProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "client" as "admin" | "collaborator" | "client",
    service: null as number | null,
  });

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const { data: services = [] } = useServices();

  // Pré-remplir le formulaire si on édite
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: "",
        role: user.role,
        service: (user as any).service || null,
      });
    } else {
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "client",
        service: null,
      });
    }
  }, [user, open]);

  const handleSubmit = async () => {
    if (!user) {
      // Création
      if (!formData.username || !formData.email || !formData.password) {
        return;
      }
      await createMutation.mutateAsync({
        ...formData,
        service: formData.service || undefined,
      });
    } else {
      // Modification (sans le password s'il est vide)
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        service: formData.service || null,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      await updateMutation.mutateAsync({ id: user.id, data: updateData });
    }
    onOpenChange(false);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
          <DialogDescription>
            {user 
              ? "Modifiez les informations de l'utilisateur" 
              : "Créez un nouveau compte utilisateur"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              <UserIcon className="h-3.5 w-3.5 inline mr-1" />
              Nom d'utilisateur <span className="text-destructive">*</span>
            </label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="johndoe"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              <Mail className="h-3.5 w-3.5 inline mr-1" />
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@exemple.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              <Lock className="h-3.5 w-3.5 inline mr-1" />
              Mot de passe {user && <span className="text-muted-foreground text-xs">(laisser vide pour ne pas modifier)</span>}
              {!user && <span className="text-destructive">*</span>}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required={!user}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              <Shield className="h-3.5 w-3.5 inline mr-1" />
              Rôle <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            >
              <option value="client">Client (Lecture seule)</option>
              <option value="collaborator">Collaborateur (Peut créer et modifier)</option>
              <option value="admin">Administrateur (Accès complet)</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {formData.role === "admin" && "Accès complet au système, gestion des utilisateurs"}
              {formData.role === "collaborator" && "Peut créer, modifier et supprimer des documents"}
              {formData.role === "client" && "Peut uniquement consulter les documents partagés"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              <Building2 className="h-3.5 w-3.5 inline mr-1" />
              Service
            </label>
            <select
              value={formData.service || ""}
              onChange={(e) => setFormData({ ...formData, service: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            >
              <option value="">Aucun service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.nom}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Les utilisateurs d'un service verront les courriers qui leur sont affectés
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isPending || !formData.username || !formData.email || (!user && !formData.password)}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {user ? "Modification..." : "Création..."}
              </>
            ) : (
              user ? "Modifier" : "Créer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
