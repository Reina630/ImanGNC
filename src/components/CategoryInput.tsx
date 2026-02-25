import { useState, useEffect } from 'react';
import { X, Plus, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Categorie } from '@/types';
import categoryService from '@/services/categoryService';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CategoryInputProps {
  selectedCategory: number | null;
  onChange: (categoryId: number | null) => void;
  className?: string;
}

export default function CategoryInput({ selectedCategory, onChange, className }: CategoryInputProps) {
  const [allCategories, setAllCategories] = useState<Categorie[]>([]);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categories = await categoryService.getCategories();
      setAllCategories(categories || []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      setAllCategories([]);
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    if (!categoryName.trim()) return;

    try {
      const category = await categoryService.getOrCreateCategory(categoryName.trim());
      
      // Sélectionner la catégorie
      onChange(category.id);

      // Mettre à jour la liste des catégories si nouvelle
      if (Array.isArray(allCategories) && !allCategories.find(c => c.id === category.id)) {
        setAllCategories([...allCategories, category]);
      }

      setInputValue('');
      setOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la catégorie:', error);
    }
  };

  const handleRemoveCategory = () => {
    onChange(null);
  };

  const getSelectedCategoryData = (): Categorie | null => {
    if (!Array.isArray(allCategories) || !selectedCategory) return null;
    return allCategories.find(cat => cat.id === selectedCategory) || null;
  };

  const getAvailableCategories = (): Categorie[] => {
    if (!Array.isArray(allCategories)) return [];
    return allCategories;
  };

  const selectedCategoryData = getSelectedCategoryData();

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Catégorie</span>
      </div>

      {/* Catégorie sélectionnée */}
      {selectedCategoryData && (
        <div className="mb-2">
          <Badge variant="secondary" className="gap-1">
            {selectedCategoryData.name}
            <button
              type="button"
              onClick={handleRemoveCategory}
              className="ml-1 hover:bg-destructive/20 rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {/* Ajouter/Changer une catégorie */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start text-muted-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            {selectedCategoryData ? 'Changer la catégorie' : 'Ajouter une catégorie'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Rechercher ou créer une catégorie..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => handleAddCategory(inputValue)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer "{inputValue}"
                </Button>
              </CommandEmpty>
              <CommandGroup heading="Catégories existantes">
                {getAvailableCategories().map(category => (
                  <CommandItem
                    key={category.id}
                    onSelect={() => {
                      onChange(category.id);
                      setOpen(false);
                    }}
                  >
                    {category.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
