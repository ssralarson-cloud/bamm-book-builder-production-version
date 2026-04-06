import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { BookOpen, Trash2, Calendar, Edit, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useProjects, useCreateProject, useDeleteProject, useKDPValidation, useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { KDPComplianceBadge } from '../components/KDPComplianceBadge';
import { NewProjectDialog } from '../components/NewProjectDialog';

import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActorExtended';
import type { ProjectDTO } from '../lib/exportUtils';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [isProfileSetupOpen, setIsProfileSetupOpen] = useState(false);
  const [userName, setUserName] = useState('');

  const { identity, login, loginStatus } = useInternetIdentity();
  const { isInitialized, isAuthenticated } = useActor();

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { mutate: createProject, isPending: isCreating } = useCreateProject();
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { mutate: saveProfile, isPending: isSavingProfile } = useSaveCallerUserProfile();

  // Show loading state while actor is initializing
  const isInitializing = loginStatus === 'initializing' || !isInitialized;
  
  // Only show profile setup if authenticated, actor is ready, profile is fetched, and profile is null
  const showProfileSetup = isAuthenticated && isInitialized && !profileLoading && isFetched && userProfile === null;

  // Auto-open profile setup dialog when needed
  useEffect(() => {
    if (showProfileSetup) {
      console.log('[HomePage] Opening profile setup dialog');
      setIsProfileSetupOpen(true);
    }
  }, [showProfileSetup]);

  const handleSaveProfile = () => {
    if (!userName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    console.log('[HomePage] Saving user profile:', userName);
    saveProfile(
      { name: userName },
      {
        onSuccess: () => {
          console.log('[HomePage] Profile saved successfully');
          toast.success('Welcome! Your profile has been created.');
          setIsProfileSetupOpen(false);
          setUserName('');
        },
        onError: (error) => {
          console.error('[HomePage] Profile save error:', error);
          toast.error(error.message || 'Failed to create profile. Please try again.');
        },
      }
    );
  };

  const handleCreateProject = (storyTitle: string, authorName: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to create a project');
      return;
    }

    if (!isInitialized) {
      toast.error('Session is still initializing. Please wait a moment and try again.');
      return;
    }

    console.log('[HomePage] Creating project with title:', storyTitle, 'by author:', authorName);
    
    // Pass storyTitle as title to backend createProject
    createProject(storyTitle, {
      onSuccess: (projectId) => {
        console.log('[HomePage] Project created successfully:', projectId);
        toast.success(`Project "${storyTitle}" created successfully!`);
        // Navigate to the project editor
        navigate({ to: '/project/$projectId', params: { projectId } });
      },
      onError: (error: any) => {
        console.error('[HomePage] Project creation error:', error);
        const errorMessage = error.message || 'Failed to create project. Please try again.';
        
        // Check if it's an authentication error
        if (errorMessage.includes('log in') || errorMessage.includes('Unauthorized')) {
          toast.error('Please sign in to create projects');
        } else {
          toast.error(errorMessage);
        }
      },
    });
  };

  const handleDeleteProject = () => {
    if (!deleteProjectId) return;

    console.log('[HomePage] Deleting project:', deleteProjectId);
    deleteProject(deleteProjectId, {
      onSuccess: () => {
        console.log('[HomePage] Project deleted successfully');
        toast.success('Project deleted successfully');
        setDeleteProjectId(null);
      },
      onError: (error: any) => {
        console.error('[HomePage] Delete error:', error);
        toast.error(error.message || 'Failed to delete project');
      },
    });
  };

  const handleLoginPrompt = () => {
    toast.info('Please sign in to get started');
    login();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Non-authenticated welcome view
  if (!isAuthenticated && !isInitializing) {
    return (
      <div className="page-container">
        <section className="welcome-section">
          <img
            src="/assets/generated/owl-icon.png"
            alt="Bamm Book Builder"
            className="welcome-icon"
          />
          <h1>Welcome to Your Dashboard</h1>
          <p>
            Sign in to start creating beautiful children's books
            ready for Amazon KDP print.
          </p>
          <button className="welcome-signin" onClick={handleLoginPrompt}>
            <LogIn size={18} />
            Sign In to Get Started
          </button>
          <span className="welcome-hint">
            Quick &amp; secure — use your fingerprint, face, or security key. No passwords.
          </span>
        </section>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Profile Setup Dialog */}
      <Dialog open={isProfileSetupOpen} onOpenChange={setIsProfileSetupOpen}>
        <DialogContent className="dialog-box border-2 border-border z-modal">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Welcome to Bamm Book Builder</DialogTitle>
            <DialogDescription className="text-base">
              Let's get you set up. What's your name?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userName" className="text-base">Your Name</Label>
              <Input
                id="userName"
                placeholder="e.g., Sara Larson"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveProfile();
                  }
                }}
                className="border-2"
              />
            </div>
          </div>
          <DialogFooter className="dialog-buttons">
            <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving...' : 'Continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>Your Books</h1>
        <div className="create-project-button">
          {isInitializing ? (
            <Button size="sm" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </Button>
          ) : (
            <NewProjectDialog
              onCreateProject={handleCreateProject}
              isCreating={isCreating}
              disabled={!isInitialized}
            />
          )}
        </div>
      </div>

      {/* Projects Section */}
      <section className="project-list">
        {isInitializing ? (
          <div className="skeleton-grid">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="project-card">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projectsLoading ? (
          <div className="skeleton-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-2">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="projects-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project}
                onEdit={() => navigate({ to: '/project/$projectId', params: { projectId: project.id } })}
                onDelete={() => setDeleteProjectId(project.id)}
                isDeleting={isDeleting}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed">
            <CardContent className="empty-state flex flex-col items-center justify-center py-12 text-center">
              <img
                src="/assets/generated/new-project-boho-icon-transparent.png"
                alt="No projects"
                className="mb-4 h-24 w-24 opacity-40"
              />
              <h3 className="font-display mb-2 text-xl">No books yet</h3>
              <p className="mb-4 text-muted-foreground">
                Create your first children's book project to get started.
              </p>
              <NewProjectDialog 
                onCreateProject={handleCreateProject}
                isCreating={isCreating}
                disabled={!isInitialized}
                trigger={
                  <Button disabled={!isInitialized}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Create Your First Book
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}
      </section>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent className="dialog-box border-2 border-border z-modal">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">Delete Project?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This action cannot be undone. Your book project and all its content will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="dialog-buttons">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectCard({ 
  project, 
  onEdit, 
  onDelete, 
  isDeleting, 
  formatDate 
}: { 
  project: ProjectDTO; 
  onEdit: () => void; 
  onDelete: () => void; 
  isDeleting: boolean;
  formatDate: (timestamp: number) => string;
}) {
  const { data: validation, isLoading: isLoadingValidation } = useKDPValidation(project.id);

  return (
    <Card className="project-card">
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 font-display text-lg">{project.title}</span>
          <BookOpen className="h-5 w-5 flex-shrink-0 text-foreground" />
        </CardTitle>
        <CardDescription className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs">
            <Calendar className="h-3 w-3" />
            {formatDate(project.createdAt)}
          </span>
          <KDPComplianceBadge 
            isValid={validation?.isValid ?? null}
            isLoading={isLoadingValidation}
            errors={validation?.errors}
            warnings={validation?.warnings}
            showDetails={false}
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Pages: {project.pages.length}</p>
          <p className="line-clamp-2 italic">
            {project.story ? `"${project.story.substring(0, 100)}..."` : 'No story yet written'}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
