import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { KDPValidation, Page, Project, UserProfile } from "../backend";
import {
  type ProjectDTO,
  fromBackendProject,
  logBigIntLeaks,
} from "../lib/exportUtils";
import { requireActor } from "../utils/requireActor";
import { safeCall } from "../utils/safeCall";
import { useActor } from "./useActorExtended";

// ============================================================================
// UTILITY FUNCTIONS FOR DATA NORMALIZATION AND CONVERSION
// ============================================================================

/**
 * Convert milliseconds to nanoseconds (BigInt)
 * Backend expects timestamps in nanoseconds (Nat)
 */
export function toNs(ms: number): bigint {
  return BigInt(ms * 1_000_000);
}

/**
 * Convert nanoseconds (BigInt) to milliseconds
 * For displaying backend timestamps in frontend
 */
export function toMs(ns: bigint): number {
  return Number(ns / BigInt(1_000_000));
}

/**
 * Convert legacy snake_case keys to camelCase
 * Ensures backward compatibility with any legacy data
 */
export function toCamelCasePayload<T extends Record<string, any>>(obj: T): T {
  const result: any = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );
      const value = obj[key];

      // Recursively convert nested objects
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof value !== "bigint"
      ) {
        result[camelKey] = toCamelCasePayload(value);
      } else if (Array.isArray(value)) {
        result[camelKey] = value.map((item) =>
          item && typeof item === "object" && typeof item !== "bigint"
            ? toCamelCasePayload(item)
            : item,
        );
      } else {
        result[camelKey] = value;
      }
    }
  }

  return result as T;
}

/**
 * Normalize optional fields: convert empty strings to null
 * Backend expects null for optional fields, not empty strings
 */
export function normalizeOptionals<T extends Record<string, any>>(obj: T): T {
  const result: any = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      // Convert empty strings to undefined (which becomes null in Candid)
      if (value === "") {
        result[key] = undefined;
      }
      // Recursively normalize nested objects
      else if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof value !== "bigint"
      ) {
        result[key] = normalizeOptionals(value);
      }
      // Normalize arrays
      else if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          item && typeof item === "object" && typeof item !== "bigint"
            ? normalizeOptionals(item)
            : item === ""
              ? undefined
              : item,
        );
      } else {
        result[key] = value;
      }
    }
  }

  return result as T;
}

/**
 * Clean pages array: remove empty objects and invalid entries
 * Ensures backend receives clean array structure
 */
export function cleanPages(pages: Page[]): Page[] {
  return pages.filter((page) => {
    // Remove empty objects or objects with no meaningful data
    if (!page || typeof page !== "object") return false;

    // Must have at least pageNumber
    if (page.pageNumber === undefined || page.pageNumber === null) return false;

    // Check if it's just an empty object
    const keys = Object.keys(page);
    if (keys.length === 0) return false;

    return true;
  });
}

/**
 * Prepare project for backend submission
 * Applies all normalization and conversion utilities
 */
export function prepareProjectForBackend(project: Project): Project {
  // Convert to camelCase (in case of legacy data)
  let prepared = toCamelCasePayload(project);

  // Normalize optional fields
  prepared = normalizeOptionals(prepared);

  // Clean pages array
  if (prepared.pages && Array.isArray(prepared.pages)) {
    prepared.pages = cleanPages(prepared.pages);
  }

  // Ensure timestamps are in nanoseconds
  if (typeof prepared.updatedAt === "number") {
    prepared.updatedAt = toNs(prepared.updatedAt);
  }

  // Diagnostic: Check for BigInt leaks before sending to backend
  logBigIntLeaks(prepared, "prepareProjectForBackend");

  return prepared;
}

// ============================================================================
// REACT QUERY HOOKS - All return normalized ProjectDTO objects
// ============================================================================

export function useProjects() {
  const actorState = useActor();

  return useQuery<ProjectDTO[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      return safeCall("listProjects", async () => {
        requireActor(actorState, "listProjects");

        console.log(
          "[useProjects/listProjects] Fetching projects from backend",
        );
        const projects = await actorState.actor!.listProjects();
        console.log(
          "[useProjects/listProjects] Successfully fetched",
          projects.length,
          "projects",
        );

        // Convert all projects to DTOs (strips BigInt)
        const projectDTOs = projects.map(fromBackendProject);

        // Diagnostic: Check for BigInt leaks
        logBigIntLeaks(projectDTOs, "useProjects/listProjects");

        return projectDTOs;
      });
    },
    enabled: actorState.isInitialized && actorState.isAuthenticated,
  });
}

export function useProject(projectId: string) {
  const actorState = useActor();

  return useQuery<ProjectDTO | null>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      return safeCall("getProject", async () => {
        requireActor(actorState, "getProject");

        console.log("[useProject/getProject] Fetching project:", projectId);
        const project = await actorState.actor!.getProject(projectId);
        if (!project) {
          console.log("[useProject/getProject] Project not found");
          return null;
        }

        console.log(
          "[useProject/getProject] Successfully fetched project:",
          project.title,
        );

        // Convert to DTO (strips BigInt)
        const projectDTO = fromBackendProject(project);

        // Diagnostic: Check for BigInt leaks
        logBigIntLeaks(projectDTO, "useProject/getProject");

        return projectDTO;
      });
    },
    enabled:
      actorState.isInitialized && actorState.isAuthenticated && !!projectId,
  });
}

export function useCreateProject() {
  const actorState = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      return safeCall(
        "createProject",
        async () => {
          requireActor(actorState, "createProject");

          console.log(
            "[useCreateProject/createProject] Creating project with title:",
            title,
          );
          console.log(
            "[useCreateProject/createProject] Backend method: createProject",
          );
          console.log(
            "[useCreateProject/createProject] Timestamp:",
            new Date().toISOString(),
          );

          const projectIdNat = await actorState.actor!.createProject(title);
          const projectId = projectIdNat.toString();

          console.log(
            "[useCreateProject/createProject] ✓ Project created successfully",
          );
          console.log(
            "[useCreateProject/createProject]   Project ID (Nat):",
            projectIdNat.toString(),
          );
          console.log(
            "[useCreateProject/createProject]   Project ID (string):",
            projectId,
          );
          console.log(
            "[useCreateProject/createProject]   Timestamp:",
            new Date().toISOString(),
          );
          return projectId;
        },
        { title },
      );
    },
    onSuccess: () => {
      console.log(
        "[useCreateProject] Invalidating queries after successful creation",
      );
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const actorState = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project: Project | ProjectDTO) => {
      return safeCall(
        "updateProject",
        async () => {
          requireActor(actorState, "updateProject");

          console.log(
            "[useUpdateProject/updateProject] Preparing project for backend:",
            project.id,
          );
          console.log(
            "[useUpdateProject/updateProject] Backend method: updateProject",
          );
          console.log(
            "[useUpdateProject/updateProject] Pages count:",
            project.pages.length,
          );
          console.log(
            "[useUpdateProject/updateProject] Timestamp:",
            new Date().toISOString(),
          );

          // Convert ProjectDTO back to Project if needed
          let backendProject: Project;
          if ("createdAt" in project && typeof project.createdAt === "number") {
            // This is a ProjectDTO, convert back to Project
            backendProject = {
              ...project,
              owner: project.owner as any,
              createdAt: toNs(project.createdAt),
              updatedAt: toNs(Date.now()),
              pages: project.pages.map((page) => ({
                ...page,
                pageNumber: BigInt(page.pageNumber),
              })),
            } as Project;
          } else {
            // Already a Project
            backendProject = project as Project;
          }

          // Prepare project with all normalizations
          const preparedProject = prepareProjectForBackend(backendProject);

          console.log("[useUpdateProject/updateProject] Project prepared:");
          console.log(
            "[useUpdateProject/updateProject]   - Cleaned pages:",
            preparedProject.pages.length,
          );
          console.log(
            "[useUpdateProject/updateProject]   - Normalized optionals: ✓",
          );
          console.log(
            "[useUpdateProject/updateProject]   - CamelCase fields: ✓",
          );
          console.log(
            "[useUpdateProject/updateProject]   - Timestamp (ns):",
            preparedProject.updatedAt.toString(),
          );

          await actorState.actor!.updateProject(preparedProject);
          console.log(
            "[useUpdateProject/updateProject] ✓ Project updated successfully",
          );
          console.log(
            "[useUpdateProject/updateProject]   Timestamp:",
            new Date().toISOString(),
          );
        },
        { projectId: project.id, pagesCount: project.pages.length },
      );
    },
    onSuccess: (_, project) => {
      console.log(
        "[useUpdateProject] Invalidating queries after successful update",
      );
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      queryClient.invalidateQueries({
        queryKey: ["kdp-validation", project.id],
      });
    },
  });
}

export function useDeleteProject() {
  const actorState = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      return safeCall(
        "deleteProject",
        async () => {
          requireActor(actorState, "deleteProject");

          console.log(
            "[useDeleteProject/deleteProject] Deleting project:",
            projectId,
          );
          console.log(
            "[useDeleteProject/deleteProject] Backend method: deleteProject",
          );
          console.log(
            "[useDeleteProject/deleteProject] Timestamp:",
            new Date().toISOString(),
          );

          await actorState.actor!.deleteProject(projectId);
          console.log(
            "[useDeleteProject/deleteProject] ✓ Project deleted successfully",
          );
          console.log(
            "[useDeleteProject/deleteProject]   Timestamp:",
            new Date().toISOString(),
          );
        },
        { projectId },
      );
    },
    onSuccess: () => {
      console.log(
        "[useDeleteProject] Invalidating queries after successful deletion",
      );
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useProjectImages(projectId: string) {
  const actorState = useActor();

  return useQuery({
    queryKey: ["images", projectId],
    queryFn: async () => {
      return safeCall(
        "listImages",
        async () => {
          requireActor(actorState, "listImages");

          console.log(
            "[useProjectImages/listImages] Fetching images for project:",
            projectId,
          );
          const images = await actorState.actor!.listImages(projectId);
          console.log(
            "[useProjectImages/listImages] ✓ Fetched",
            images.length,
            "images",
          );
          return images;
        },
        { projectId },
      );
    },
    enabled:
      actorState.isInitialized && actorState.isAuthenticated && !!projectId,
  });
}

export function useKDPValidation(projectId: string) {
  const actorState = useActor();

  return useQuery<KDPValidation | null>({
    queryKey: ["kdp-validation", projectId],
    queryFn: async () => {
      return safeCall(
        "validateKDP",
        async () => {
          requireActor(actorState, "validateKDP");

          console.log(
            "[useKDPValidation/validateKDP] Validating KDP compliance for project:",
            projectId,
          );
          console.log(
            "[useKDPValidation/validateKDP] Backend method: validateKDP",
          );

          const validation = await actorState.actor!.validateKDP(projectId);
          console.log(
            "[useKDPValidation/validateKDP] ✓ Validation result:",
            validation?.isValid ? "VALID" : "INVALID",
          );
          if (validation && !validation.isValid) {
            console.log(
              "[useKDPValidation/validateKDP] Errors:",
              validation.errors,
            );
          }
          if (validation && validation.warnings.length > 0) {
            console.log(
              "[useKDPValidation/validateKDP] Warnings:",
              validation.warnings,
            );
          }
          return validation;
        },
        { projectId },
      );
    },
    enabled:
      actorState.isInitialized && actorState.isAuthenticated && !!projectId,
  });
}

export function useAddImage() {
  const actorState = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      path,
      dpi,
    }: { projectId: string; path: string; dpi: number }) => {
      return safeCall(
        "addImage",
        async () => {
          requireActor(actorState, "addImage");

          console.log("[useAddImage/addImage] Adding image:", {
            projectId,
            path,
            dpi,
          });
          console.log("[useAddImage/addImage] Backend method: addImage");
          console.log(
            "[useAddImage/addImage] Timestamp:",
            new Date().toISOString(),
          );

          const imageId = await actorState.actor!.addImage(
            projectId,
            path,
            dpi,
          );
          console.log("[useAddImage/addImage] ✓ Image added successfully");
          console.log("[useAddImage/addImage]   Image ID:", imageId);
          console.log(
            "[useAddImage/addImage]   DPI:",
            dpi,
            dpi >= 300 ? "(COMPLIANT)" : "(BELOW MINIMUM)",
          );
          console.log(
            "[useAddImage/addImage]   Timestamp:",
            new Date().toISOString(),
          );
          return imageId;
        },
        { projectId, path, dpi },
      );
    },
    onSuccess: (_, variables) => {
      console.log(
        "[useAddImage] Invalidating queries after successful image addition",
      );
      queryClient.invalidateQueries({
        queryKey: ["images", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["kdp-validation", variables.projectId],
      });
    },
  });
}

export function useGenerateImagePrompt() {
  const actorState = useActor();

  return useMutation({
    mutationFn: async ({
      projectId,
      pageText,
      projectContext,
    }: { projectId: string; pageText: string; projectContext: string }) => {
      return safeCall(
        "generateImagePrompt",
        async () => {
          requireActor(actorState, "generateImagePrompt");

          console.log(
            "[useGenerateImagePrompt/generateImagePrompt] Generating AI prompt for project:",
            projectId,
          );
          console.log(
            "[useGenerateImagePrompt/generateImagePrompt] Backend method: generateImagePrompt",
          );
          console.log(
            "[useGenerateImagePrompt/generateImagePrompt] Page text length:",
            pageText.length,
          );
          console.log(
            "[useGenerateImagePrompt/generateImagePrompt] Timestamp:",
            new Date().toISOString(),
          );

          const prompt = await actorState.actor!.generateImagePrompt(
            projectId,
            pageText,
            projectContext,
          );
          console.log(
            "[useGenerateImagePrompt/generateImagePrompt] ✓ AI prompt generated successfully",
          );
          console.log(
            "[useGenerateImagePrompt/generateImagePrompt]   Prompt length:",
            prompt.length,
          );
          console.log(
            "[useGenerateImagePrompt/generateImagePrompt]   Timestamp:",
            new Date().toISOString(),
          );
          return prompt;
        },
        { projectId, pageTextLength: pageText.length },
      );
    },
  });
}

export function useGetCallerUserProfile() {
  const actorState = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      return safeCall("getCallerUserProfile", async () => {
        requireActor(actorState, "getCallerUserProfile");

        console.log(
          "[useGetCallerUserProfile/getCallerUserProfile] Fetching user profile",
        );
        console.log(
          "[useGetCallerUserProfile/getCallerUserProfile] Backend method: getCallerUserProfile",
        );
        console.log(
          "[useGetCallerUserProfile/getCallerUserProfile] Timestamp:",
          new Date().toISOString(),
        );

        const profile = await actorState.actor!.getCallerUserProfile();
        console.log(
          "[useGetCallerUserProfile/getCallerUserProfile] ✓ Profile result:",
          profile ? `exists (${profile.name})` : "null (new user)",
        );
        console.log(
          "[useGetCallerUserProfile/getCallerUserProfile]   Timestamp:",
          new Date().toISOString(),
        );
        return profile;
      });
    },
    enabled: actorState.isInitialized && actorState.isAuthenticated,
    retry: false,
  });

  return {
    ...query,
    isLoading: !actorState.isInitialized || query.isLoading,
    isFetched: actorState.isInitialized && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const actorState = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      return safeCall(
        "saveCallerUserProfile",
        async () => {
          requireActor(actorState, "saveCallerUserProfile");

          console.log(
            "[useSaveCallerUserProfile/saveCallerUserProfile] Saving user profile:",
            profile.name,
          );
          console.log(
            "[useSaveCallerUserProfile/saveCallerUserProfile] Backend method: saveCallerUserProfile",
          );
          console.log(
            "[useSaveCallerUserProfile/saveCallerUserProfile] Timestamp:",
            new Date().toISOString(),
          );

          await actorState.actor!.saveCallerUserProfile(profile);
          console.log(
            "[useSaveCallerUserProfile/saveCallerUserProfile] ✓ Profile saved successfully",
          );
          console.log(
            "[useSaveCallerUserProfile/saveCallerUserProfile]   Timestamp:",
            new Date().toISOString(),
          );
        },
        { profile },
      );
    },
    onSuccess: () => {
      console.log(
        "[useSaveCallerUserProfile] Invalidating queries after successful profile save",
      );
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useDeploymentUrl() {
  const actorState = useActor();

  return useQuery<string>({
    queryKey: ["deploymentUrl"],
    queryFn: async () => {
      return safeCall("getDeploymentUrl", async () => {
        requireActor(actorState, "getDeploymentUrl");

        console.log(
          "[useDeploymentUrl/getDeploymentUrl] Fetching deployment URL",
        );
        console.log(
          "[useDeploymentUrl/getDeploymentUrl] Backend method: getDeploymentUrl",
        );
        console.log(
          "[useDeploymentUrl/getDeploymentUrl] Timestamp:",
          new Date().toISOString(),
        );

        const url = await actorState.actor!.getDeploymentUrl();
        console.log(
          "[useDeploymentUrl/getDeploymentUrl] ✓ Deployment URL retrieved:",
          url,
        );
        console.log(
          "[useDeploymentUrl/getDeploymentUrl]   Timestamp:",
          new Date().toISOString(),
        );
        return url;
      });
    },
    enabled: actorState.isInitialized && actorState.isAuthenticated,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour since deployment URL rarely changes
  });
}
