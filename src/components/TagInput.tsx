import { useState, useEffect } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Tag } from '@/types';
import tagService from '@/services/tagService';
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

interface TagInputProps {
  selectedTags: number[];
  onChange: (tagIds: number[]) => void;
  className?: string;
}

export default function TagInput({ selectedTags, onChange, className }: TagInputProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const tags = await tagService.getTags();
      setAllTags(tags || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tags:', error);
      setAllTags([]);
    }
  };

  const handleAddTag = async (tagName: string) => {
    if (!tagName.trim()) return;

    try {
      const tag = await tagService.getOrCreateTag(tagName.trim());
      
      // Ajouter le tag s'il n'est pas déjà sélectionné
      if (!selectedTags.includes(tag.id)) {
        onChange([...selectedTags, tag.id]);
      }

      // Mettre à jour la liste des tags si nouveau
      if (Array.isArray(allTags) && !allTags.find(t => t.id === tag.id)) {
        setAllTags([...allTags, tag]);
      }

      setInputValue('');
      setOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du tag:', error);
    }
  };

  const handleRemoveTag = (tagId: number) => {
    onChange(selectedTags.filter(id => id !== tagId));
  };

  const getSelectedTagsData = (): Tag[] => {
    if (!Array.isArray(allTags)) return [];
    return allTags.filter(tag => selectedTags.includes(tag.id));
  };

  const getAvailableTags = (): Tag[] => {
    if (!Array.isArray(allTags)) return [];
    return allTags.filter(tag => !selectedTags.includes(tag.id));
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <TagIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Tags</span>
      </div>

      {/* Tags sélectionnés */}
      <div className="flex flex-wrap gap-2 mb-2">
        {getSelectedTagsData().map(tag => (
          <Badge key={tag.id} variant="secondary" className="gap-1">
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-1 hover:bg-destructive/20 rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Ajouter un tag */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start text-muted-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Rechercher ou créer un tag..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => handleAddTag(inputValue)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer "{inputValue}"
                </Button>
              </CommandEmpty>
              <CommandGroup heading="Tags existants">
                {getAvailableTags().map(tag => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => {
                      onChange([...selectedTags, tag.id]);
                      setOpen(false);
                    }}
                  >
                    {tag.name}
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
