import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileSignature, Upload, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function SignatureSettings() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Charger les données utilisateur fraîches depuis l'API au montage
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const profile = await authService.getProfile();
        setUser(profile);
        console.log('Profil utilisateur chargé:', profile);
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger votre profil',
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez sélectionner une image',
      });
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'La taille du fichier ne doit pas dépasser 2MB',
      });
      return;
    }

    setSignatureFile(file);

    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      setSignaturePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérifier qu'au moins une modification est faite
    if (!signatureFile && !password) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez modifier au moins un élément',
      });
      return;
    }

    // Vérifier que les mots de passe correspondent si fournis
    if (password && password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
      });
      return;
    }

    // Vérifier la longueur du mot de passe
    if (password && password.length < 4) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 4 caractères',
      });
      return;
    }

    setIsLoading(true);

    try {
      const updatedUser = await authService.updateSignature(
        signatureFile || undefined,
        password || undefined
      );

      // Mettre à jour le contexte avec les nouvelles données
      setUser(updatedUser);
      
      console.log('Signature mise à jour:', updatedUser);

      toast({
        title: 'Succès',
        description: 'Votre signature a été mise à jour avec succès',
      });

      // Réinitialiser le formulaire
      setSignatureFile(null);
      setSignaturePreview(null);
      setPassword('');
      setConfirmPassword('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la signature:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour votre signature',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-3xl"
    >
      <div>
        <h1 className="text-2xl font-bold">Configuration de la signature</h1>
        <p className="text-muted-foreground text-sm">
          Configurez votre signature électronique et son mot de passe
        </p>
      </div>

      {isLoadingProfile ? (
        <div className="stat-card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-muted-foreground">Chargement du profil...</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="stat-card">
        <div className="flex items-center gap-2 mb-5">
          <FileSignature className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Signature électronique</h3>
        </div>

        <div className="space-y-6">
          {/* Signature actuelle */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Signature actuelle
            </label>
            {user?.signature_url ? (
              <div className="p-4 border border-border rounded-lg bg-muted/30">
                <img
                  src={user.signature_url}
                  alt="Signature actuelle"
                  className="max-h-32 object-contain"
                  onError={(e) => {
                    console.error('Erreur de chargement de l\'image:', user.signature_url);
                    e.currentTarget.src = '';
                    e.currentTarget.alt = 'Erreur de chargement';
                  }}
                />
              </div>
            ) : (
              <div className="p-4 border border-dashed border-border rounded-lg bg-muted/10 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucune signature configurée
                </p>
              </div>
            )}
          </div>

          {/* Upload nouvelle signature */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              {user?.signature_url ? 'Nouvelle signature' : 'Télécharger une signature'}
            </label>
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choisir un fichier
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {signatureFile && (
                <p className="text-sm text-muted-foreground">
                  Fichier sélectionné: {signatureFile.name}
                </p>
              )}
            </div>

            {/* Aperçu de la nouvelle signature */}
            {signaturePreview && (
              <div className="mt-3 p-4 border border-border rounded-lg bg-muted/30">
                <p className="text-sm font-medium mb-2">Aperçu:</p>
                <img
                  src={signaturePreview}
                  alt="Aperçu signature"
                  className="max-h-32 object-contain"
                />
              </div>
            )}
          </div>

          {/* Mot de passe de signature */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Mot de passe de signature
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Ce mot de passe sera demandé à chaque signature de document
              </p>
              <div className="relative max-w-sm">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {password && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Confirmer le mot de passe
                </label>
                <div className="relative max-w-sm">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSignatureFile(null);
                setSignaturePreview(null);
                setPassword('');
                setConfirmPassword('');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      </form>
      )}
    </motion.div>
  );
}
