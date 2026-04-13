import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useState } from "react";
import "./NewProjectDialog.css";

export interface NewProjectDialogProps {
  onCreateProject: (storyTitle: string, authorName: string) => void;
  isCreating: boolean;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export function NewProjectDialog({
  onCreateProject,
  isCreating,
  disabled = false,
  trigger,
}: NewProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [storyTitle, setStoryTitle] = useState("");

  const handleCreate = () => {
    const trimmedAuthor = authorName.trim();
    const trimmedTitle = storyTitle.trim();

    if (!trimmedAuthor || !trimmedTitle) {
      return;
    }

    // Validate input lengths
    if (trimmedAuthor.length < 2) {
      alert("Author name must be at least 2 characters long.");
      return;
    }

    if (trimmedTitle.length < 2) {
      alert("Story title must be at least 2 characters long.");
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
      setAuthorName("");
      setStoryTitle("");
    }
  };

  const isFormValid =
    authorName.trim().length >= 2 && storyTitle.trim().length >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="gap-2 shadow-boho" disabled={disabled}>
            <Plus className="h-5 w-5" />
            Begin a New Tale
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="dialog-box border-2 border-border bg-background z-modal">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Create New Book Project
          </DialogTitle>
          <DialogDescription className="text-base">
            Bestow your tale with a title and author. It shall be crafted in the
            standard 8.5×8.5" square format, perfect for Amazon KDP
            print-on-demand publishing.
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
                if (e.key === "Enter" && isFormValid) {
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
                if (e.key === "Enter" && isFormValid) {
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
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!isFormValid || isCreating}>
            {isCreating ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
