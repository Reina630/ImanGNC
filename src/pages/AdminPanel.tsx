import { useState } from "react";
import { Users, Shield, Plus, Pencil, Trash2, Loader2, AlertCircle, FolderOpen, Building2, FileSignature, RefreshCw, Palette, Check } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserManagementDialog } from "@/components/UserManagementDialog";
import { CategoryManagementDialog } from "@/components/CategoryManagementDialog";
import { ServiceManagementDialog } from "@/components/ServiceManagementDialog";
import { SignatureForm } from "@/components/SignatureForm";
import { useUsers, useUpdateUser } from "@/services";
import { useCategories, useDeleteCategory } from "@/services/categoryHooks";
import { useServices, useDeleteService } from "@/services/serviceHooks";
import type { User, Categorie } from "@/types";
import type { Service } from "@/services/serviceService";

export default function AdminPanel() {
  const { isAdmin, isRH } = useAuth();
  const { currentTheme, setTheme, themes } = useTheme();
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categorie | null>(null);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers();
  const updateUserMutation = useUpdateUser();

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const deleteCategoryMutation = useDeleteCategory();

  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useServices();
  const deleteServiceMutation = useDeleteService();

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserDialog(true);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserDialog(true);
  };

  const handleToggleActiveUser = async (user: User) => {
    if (user.is_active) {
      if (!confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) return;
    }
    await updateUserMutation.mutateAsync({ id: user.id, data: { is_active: !user.is_active } });
  };

  const handleEditCategory = (category: Categorie) => {
    setEditingCategory(category);
    setShowCategoryDialog(true);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryDialog(true);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Les courriers associés ne seront pas supprimés.')) {
      await deleteCategoryMutation.mutateAsync(categoryId);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowServiceDialog(true);
  };

  const handleAddService = () => {
    setEditingService(null);
    setShowServiceDialog(true);
  };

  const handleDeleteService = async (serviceId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce service ? Les utilisateurs associés ne seront pas supprimés.')) {
      await deleteServiceMutation.mutateAsync(serviceId);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary/10 text-primary';
      case 'rh': return 'bg-purple-500/10 text-purple-500';
      case 'collaborator': return 'bg-blue-500/10 text-blue-500';
      case 'client': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'rh': return 'RH';
      case 'collaborator': return 'Collaborateur';
      case 'client': return 'Client';
      default: return role;
    }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Paramètres</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">Gérez les utilisateurs, les services, les catégories de courriers et votre signature</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={(isAdmin || isRH) ? "users" : "signature"} className="space-y-5">
        <TabsList className="bg-muted/50 h-auto p-1">
          {(isAdmin || isRH) && (
            <>
              <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm">
                <Users className="h-3.5 w-3.5" /> Utilisateurs
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-1.5 text-xs sm:text-sm">
                <Building2 className="h-3.5 w-3.5" /> Services
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-1.5 text-xs sm:text-sm">
                <FolderOpen className="h-3.5 w-3.5" /> Catégories
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="signature" className="gap-1.5 text-xs sm:text-sm">
            <FileSignature className="h-3.5 w-3.5" /> Signature
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5 text-xs sm:text-sm">
            <Palette className="h-3.5 w-3.5" /> Apparence
          </TabsTrigger>
        </TabsList>

        {/* Users Tab - Uniquement pour Admin et RH */}
        {(isAdmin || isRH) && (
          <TabsContent value="users" className="space-y-4">
          <div className="stat-card overflow-hidden p-0">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Liste des utilisateurs</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {users.length} utilisateur{users.length > 1 ? 's' : ''}
                </p>
              </div>
              <Button onClick={handleAddUser} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </div>
            
            {usersLoading ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Chargement des utilisateurs...</p>
              </div>
            ) : usersError ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-3" />
                <p className="text-sm text-destructive">Erreur de chargement</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Aucun utilisateur</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className={!u.is_active ? "opacity-60 bg-muted/40" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{u.username}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {(u as any).service_nom || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs ${u.is_active ? "text-emerald-500" : "text-muted-foreground"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                          {u.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(u.date_joined).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(u)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {u.is_active ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActiveUser(u)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              disabled={updateUserMutation.isPending}
                              title="Désactiver"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActiveUser(u)}
                              className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-600"
                              disabled={updateUserMutation.isPending}
                              title="Réactiver"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
        )}

        {/* Services Tab - Uniquement pour Admin et RH */}
        {(isAdmin || isRH) && (
          <TabsContent value="services" className="space-y-4">
          <div className="stat-card overflow-hidden p-0">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Services de l'organisation</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {services.length} service{services.length > 1 ? 's' : ''}
                </p>
              </div>
              <Button onClick={handleAddService} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau service
              </Button>
            </div>
            
            {servicesLoading ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Chargement des services...</p>
              </div>
            ) : servicesError ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-3" />
                <p className="text-sm text-destructive">Erreur de chargement</p>
              </div>
            ) : services.length === 0 ? (
              <div className="p-8 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Aucun service</p>
                <p className="text-xs text-muted-foreground">Créez des services comme RH, Comptabilité, IT, etc.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Utilisateurs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((srv) => (
                    <TableRow key={srv.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <p className="text-sm font-medium">{srv.nom}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {srv.description || '—'}
                        </p>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {srv.nombre_utilisateurs || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditService(srv)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteService(srv.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            disabled={deleteServiceMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
        )}

        {/* Categories Tab - Uniquement pour Admin et RH */}
        {(isAdmin || isRH) && (
          <TabsContent value="categories" className="space-y-4">
          <div className="stat-card overflow-hidden p-0">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Catégories de courriers</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {categories.length} catégorie{categories.length > 1 ? 's' : ''}
                </p>
              </div>
              <Button onClick={handleAddCategory} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle catégorie
              </Button>
            </div>
            
            {categoriesLoading ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Chargement des catégories...</p>
              </div>
            ) : categoriesError ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-3" />
                <p className="text-sm text-destructive">Erreur de chargement</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Aucune catégorie</p>
                <p className="text-xs text-muted-foreground">Créez des catégories comme Devis, Facture, Demande, etc.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Courriers</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FolderOpen className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm font-medium">{cat.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {cat.description || '—'}
                        </p>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {cat.courriers_count || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCategory(cat)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            disabled={deleteCategoryMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
        )}

        {/* Signature Tab - Accessible à tous */}
        <TabsContent value="signature" className="space-y-4">
          <SignatureForm />
        </TabsContent>

        {/* Appearance Tab - Accessible à tous */}
        <TabsContent value="appearance" className="space-y-4">
          <div className="stat-card overflow-hidden p-0">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold">Personnaliser l'apparence</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Choisissez un thème pour personnaliser les couleurs de l'interface
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className={`relative p-5 rounded-xl border-2 transition-all hover:shadow-lg ${
                      currentTheme.id === theme.id
                        ? "border-primary shadow-md"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    {/* Badge de sélection */}
                    {currentTheme.id === theme.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}

                    {/* Aperçu des couleurs */}
                    <div className="flex gap-2 mb-4">
                      <div className={`h-12 w-12 rounded-lg ${theme.colors.sidebarBg} shadow-sm`} />
                      <div className="flex flex-col gap-1 flex-1">
                        <div className={`h-[18px] rounded ${theme.colors.primary} shadow-sm`} />
                        <div className={`h-[18px] rounded bg-gray-200 dark:bg-gray-700`} />
                      </div>
                    </div>

                    {/* Informations du thème */}
                    <div className="text-left">
                      <h4 className="font-semibold text-sm mb-1">{theme.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {theme.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Aperçu du thème actuel */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Thème actuel : {currentTheme.name}
                </h4>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${currentTheme.colors.sidebarBg} shadow-sm`} />
                    <span className="text-xs text-muted-foreground">Sidebar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${currentTheme.colors.primary} shadow-sm`} />
                    <span className="text-xs text-muted-foreground">Principal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${currentTheme.colors.sidebarActiveBg} shadow-sm`} />
                    <span className="text-xs text-muted-foreground">Actif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <UserManagementDialog 
        open={showUserDialog} 
        onOpenChange={(open) => {
          setShowUserDialog(open);
          if (!open) setEditingUser(null);
        }} 
        user={editingUser}
      />

      <ServiceManagementDialog 
        open={showServiceDialog} 
        onOpenChange={(open) => {
          setShowServiceDialog(open);
          if (!open) setEditingService(null);
        }} 
        service={editingService}
      />

      <CategoryManagementDialog 
        open={showCategoryDialog} 
        onOpenChange={(open) => {
          setShowCategoryDialog(open);
          if (!open) setEditingCategory(null);
        }} 
        category={editingCategory}
      />
    </motion.div>
  );
}
