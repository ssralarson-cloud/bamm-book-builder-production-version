import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { OwlLogo } from './OwlLogo';
import './NewProjectDialog.css';

export interface NewProjectDialogProps {
  onCreateProject: (storyTitle: string, authorName: string) => void;
  isCreating: boolean;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export function NewProjectDialog({ onCreateProject, isCreating, disabled = false, trigger }: NewProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [storyTitle, setStoryTitle] = useState('');

  const handleCreate = () => {
    const trimmedAuthor = authorName.trim();
    const trimmedTitle = storyTitle.trim();
    
    if (!trimmedAuthor || !trimmedTitle) {
      return;
    }
    
    // Validate input lengths
    if (trimmedAuthor.length < 2) {
      alert('Author name must be at least 2 characters long.');
      return;
    }
    
    if (trimmedTitle.length < 2) {
      alert('Story title must be at least 2 characters long.');
      return;
    }
    
    onCreateProject(trimmedTitle, trimmedAuthor);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (disabled && open) {
      return; // Prevent opening when disabled
    }
    setIsOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setAuthorName('');
      setStoryTitle('');
    }
  };

  const isFormValid = authorName.trim().length >= 2 && storyTitle.trim().length >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="gap-2 rounded-full bg-terracotta-500 px-6 text-white shadow-boho hover:bg-terracotta-600" disabled={disabled}>
            <Plus className="h-5 w-5" />
            Create New Book
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-2 border-cream-200 bg-white">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2">
            <OwlLogo size={48} />
          </div>
          <DialogTitle className="font-display text-2xl text-cream-900">Create New Book</DialogTitle>
          <DialogDescription className="text-cream-600">
            Give your story a title and tell us who's writing it. Your book will be formatted for Amazon KDP (8.5 x 8.5").
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="authorName" className="text-base">
              Your Name
            </Label>
            <Input
              id="authorName"
              placeholder="e.g., Wilhelm Grimm"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isFormValid) {
                  handleCreate();
                }
              }}
              className="rounded-lg border-2"
              disabled={isCreating}
              minLength={2}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storyTitle" className="text-base">
              Story Title
            </Label>
            <Input
              id="storyTitle"
              placeholder="e.g., The Enchanted Forest"
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isFormValid) {
                  handleCreate();
                }
              }}
              className="rounded-lg border-2"
              disabled={isCreating}
              minLength={2}
              required
            />
          </div>
        </div>
        <DialogFooter className="dialog-buttons">
          <Button variant="outline" className="rounded-full border-cream-300" onClick={() => handleOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button className="rounded-full bg-terracotta-500 text-white hover:bg-terracotta-600" onClick={handleCreate} disabled={!isFormValid || isCreating}>
            {isCreating ? 'Creating...' : 'Start Creating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
