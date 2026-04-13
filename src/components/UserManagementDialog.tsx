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
    role: "client" as 'admin' | 'rh' | 'dg' | 'collaborator' | 'client',
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
      // Création (API: username, email, password, role, service)
      if (!formData.username || !formData.email || !formData.password) {
        return;
      }
      const createPayload: any = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: ['admin', 'collaborator', 'client', 'rh', 'dg'].includes(formData.role)
          ? formData.role
          : 'client',
      };
      if (formData.service) {
        createPayload.service = formData.service;
      }
      await createMutation.mutateAsync(createPayload);
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

        {/* Inputs en 2 colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Col 1: Username */}
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

          {/* Col 2: Email */}
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

          {/* Col 1: Mot de passe */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              <Lock className="h-3.5 w-3.5 inline mr-1" />
              Mot de passe {user && <span className="text-muted-foreground text-xs"></span>}
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

          {/* Col 2: Rôle */}
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
              
              {/* <option value="collaborator">Collaborateur</option> */}
              <option value="dg">Directeur Général</option>
              <option value="rh">RH</option>
              <option value="collaborator">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {formData.role === "admin"}
              {formData.role === "rh" }
              {formData.role === "dg"}
              {formData.role === "collaborator"}
              {formData.role === "client"}
            </p>
          </div>

          {/* Ligne entière: Service */}
          <div className="md:col-span-2">
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
