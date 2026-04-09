import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { BookOpen, Trash2, Calendar, Edit, LogIn, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useProjects, useCreateProject, useDeleteProject, useKDPValidation, useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { KDPComplianceBadge } from '../components/KDPComplianceBadge';
import { NewProjectDialog } from '../components/NewProjectDialog';
import { DeploymentInfo } from '../components/DeploymentInfo';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActorExtended';
import { OwlLogo } from '../components/OwlLogo';
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
          toast.error('Please log in with Internet Identity to create projects');
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
    toast.info('Please log in with Internet Identity to create projects');
    login();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container page-container py-10 space-elegant">
      {/* Profile Setup Dialog */}
      <Dialog open={isProfileSetupOpen} onOpenChange={setIsProfileSetupOpen}>
        <DialogContent className="border-2 border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Welcome to Bamm Book Builder</DialogTitle>
            <DialogDescription className="text-base">
              Let us begin your journey. What shall we call you?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userName" className="text-base">Your Name</Label>
              <Input
                id="userName"
                placeholder="e.g., Wilhelm Grimm"
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
              {isSavingProfile ? 'Saving...' : 'Begin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hero Section — Boho style */}
      <section className="hero-section relative mb-12 overflow-hidden rounded-3xl border-2 border-cream-200 bg-gradient-to-br from-cream-50 via-white to-sage-50/30 shadow-boho">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-terracotta-100/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-sage-100/40 blur-3xl" />

        <div className="relative p-8 md:p-12">
          <div className="flex flex-col items-center gap-5 text-center">
            <OwlLogo size={56} className="drop-shadow-md" />
            <div>
              <h1 className="font-display text-3xl font-bold text-cream-900 md:text-4xl">
                Your Book Studio
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-cream-600">
                Create beautiful children's books with AI illustrations and export print-ready files for Amazon KDP.
              </p>
            </div>
            <div className="create-project-button">
              {isInitializing ? (
                <Button size="lg" className="gap-2 rounded-full bg-terracotta-500 px-8 shadow-boho hover:bg-terracotta-600" disabled>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Initializing...
                </Button>
              ) : isAuthenticated ? (
                <NewProjectDialog
                  onCreateProject={handleCreateProject}
                  isCreating={isCreating}
                  disabled={!isInitialized}
                />
              ) : (
                <Button size="lg" className="gap-2 rounded-full bg-terracotta-500 px-8 text-white shadow-boho hover:bg-terracotta-600" onClick={handleLoginPrompt}>
                  <LogIn className="h-5 w-5" />
                  Sign In to Start Creating
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Deployment Info Section - Only show when authenticated */}
      {isAuthenticated && isInitialized && (
        <section className="mb-12">
          <DeploymentInfo />
        </section>
      )}

      {/* Projects Section */}
      <section className="project-list">
        <div className="section-header mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-cream-900">Your Books</h2>
          {isAuthenticated && isInitialized && projects && projects.length > 0 && (
            <NewProjectDialog
              onCreateProject={handleCreateProject}
              isCreating={isCreating}
              disabled={!isInitialized}
            />
          )}
        </div>

        {isInitializing ? (
          <Card className="border-2 card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="mb-4 h-16 w-16 animate-spin text-muted-foreground opacity-40" />
              <h3 className="mb-2 text-xl font-bold">Initializing Session</h3>
              <p className="text-muted-foreground">
                Please wait while we prepare your workspace...
              </p>
            </CardContent>
          </Card>
        ) : !isAuthenticated ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <LogIn className="mb-4 h-16 w-16 text-muted-foreground opacity-40" />
              <h3 className="mb-2 text-xl font-bold">Please Log In</h3>
              <p className="mb-4 text-muted-foreground">
                Log in with Internet Identity to view and create your book projects.
              </p>
              <Button onClick={handleLoginPrompt}>
                <LogIn className="mr-2 h-4 w-4" />
                Log In with Internet Identity
              </Button>
            </CardContent>
          </Card>
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
          <Card className="border-2 border-dashed border-cream-300 bg-cream-50/50">
            <CardContent className="empty-state flex flex-col items-center justify-center py-16 text-center">
              <OwlLogo size={72} className="mb-4 opacity-50" />
              <h3 className="mb-2 font-display text-xl font-bold text-cream-800">Your bookshelf is empty</h3>
              <p className="mb-6 max-w-sm text-cream-600">
                Start your first children's book project — our owl friend will help you every step of the way!
              </p>
              <NewProjectDialog
                onCreateProject={handleCreateProject}
                isCreating={isCreating}
                disabled={!isInitialized}
                trigger={
                  <Button disabled={!isInitialized} className="gap-2 rounded-full bg-terracotta-500 px-6 text-white shadow-boho hover:bg-terracotta-600">
                    <Plus className="h-4 w-4" />
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
        <AlertDialogContent className="border-2 border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Project?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This action cannot be undone. This will permanently erase your book project and all associated content from the archives.
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
    <Card className="project-card overflow-hidden rounded-2xl border-2 border-cream-200 bg-white shadow-sm transition-all hover:shadow-boho hover:border-terracotta-200">
      <CardHeader className="bg-gradient-to-r from-cream-50 to-sage-50/30 pb-3">
        <CardTitle className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 font-display text-lg font-bold text-cream-900">{project.title}</span>
          <BookOpen className="h-5 w-5 flex-shrink-0 text-terracotta-400" />
        </CardTitle>
        <CardDescription className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs text-cream-500">
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
      <CardContent className="pt-3">
        <div className="space-y-1.5 text-sm">
          <p className="text-xs font-semibold text-cream-700">{project.pages.length} pages</p>
          <p className="line-clamp-2 font-serif text-xs italic leading-relaxed text-cream-600">
            {project.story ? `"${project.story.substring(0, 100)}..."` : 'No story yet'}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 border-t border-cream-100 bg-cream-50/30 pt-3">
        <Button className="flex-1 gap-2 rounded-full bg-terracotta-500 text-white hover:bg-terracotta-600" onClick={onEdit}>
          <Edit className="h-4 w-4" />
          Edit Book
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-cream-500 hover:bg-red-50 hover:text-red-500"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
