import { useState } from "react";
import { Users, Shield, Plus, Pencil, Trash2, Loader2, AlertCircle, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserManagementDialog } from "@/components/UserManagementDialog";
import { CategoryManagementDialog } from "@/components/CategoryManagementDialog";
import { useUsers, useDeleteUser } from "@/services";
import { useCategories, useDeleteCategory } from "@/services/categoryHooks";
import type { User, Categorie } from "@/types";

export default function AdminPanel() {
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categorie | null>(null);
  
  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers();
  const deleteMutation = useDeleteUser();

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const deleteCategoryMutation = useDeleteCategory();

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserDialog(true);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserDialog(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) {
      await deleteMutation.mutateAsync(userId);
    }
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
          <h1 className="text-2xl font-bold">Administration</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">Gérez les utilisateurs et les catégories de courriers</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-5">
        <TabsList className="bg-muted/50 h-auto p-1">
          <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5" /> Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5 text-xs sm:text-sm">
            <FolderOpen className="h-3.5 w-3.5" /> Catégories de courriers
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
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
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            disabled={deleteMutation.isPending}
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

        {/* Categories Tab */}
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
      </Tabs>

      <UserManagementDialog 
        open={showUserDialog} 
        onOpenChange={(open) => {
          setShowUserDialog(open);
          if (!open) setEditingUser(null);
        }} 
        user={editingUser}
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
