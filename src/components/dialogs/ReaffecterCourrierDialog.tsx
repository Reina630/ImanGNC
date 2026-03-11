import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import courrierService from '@/services/courrierService';
import userService from '@/services/userService';
import { Building2, User as UserIcon } from 'lucide-react';

interface ReaffecterCourrierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affectationId: number;
  courrierNumero: string;
  onSuccess?: () => void;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  service: string;
}

export default function ReaffecterCourrierDialog({
  open,
  onOpenChange,
  affectationId,
  courrierNumero,
  onSuccess
}: ReaffecterCourrierDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Charger la liste des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userService.getUsers();
        setUsers(data);
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }

    setLoading(true);

    try {
      await courrierService.reaffecterCourrier(affectationId, {
        user_id: parseInt(selectedUserId),
        note
      });
      
      toast.success('Courrier réaffecté avec succès');
      onOpenChange(false);
      
      // Réinitialiser le formulaire
      setSelectedUserId('');
      setNote('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erreur lors de la réaffectation:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la réaffectation');
    } finally {
      setLoading(false);
    }
  };

  // Regrouper les utilisateurs par service
  const usersByService = users.reduce((acc, user) => {
    const service = user.service || 'autre';
    if (!acc[service]) {
      acc[service] = [];
    }
    acc[service].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  const servicesLabels: Record<string, string> = {
    'rh': 'Ressources Humaines',
    'comptabilite': 'Comptabilité',
    'direction': 'Direction',
    'technique': 'Service Technique',
    'commercial': 'Commercial',
    'juridique': 'Juridique',
    'informatique': 'Informatique',
    'logistique': 'Logistique',
    'autre': 'Autre',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Réaffecter le courrier {courrierNumero}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-select">Nouvel utilisateur destinataire *</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="user-select">
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(usersByService).map(([service, serviceUsers]) => (
                  <div key={service}>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {servicesLabels[service] || service}
                    </div>
                    {serviceUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-3 w-3" />
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name} (${user.username})`
                            : user.username}
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Motif de la réaffectation (optionnel)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Ce courrier concerne la comptabilité..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Réaffectation...' : 'Réaffecter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
