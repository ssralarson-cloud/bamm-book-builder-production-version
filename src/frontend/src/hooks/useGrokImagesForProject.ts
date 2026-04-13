/**
 * Hook for generating images using local Grok agent
 * Identifies unillustrated pages and sends them to Grok for image generation
 */

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ProjectDTO } from "../lib/exportUtils";
import {
  type GrokImageRequest,
  requestGrokImagesForPages,
} from "../lib/grokImageClient";
import { useUpdateProject } from "./useQueries";

export function useGrokImagesForProject() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { mutateAsync: updateProject } = useUpdateProject();

  const generateGrokImagesForProject = async (project: ProjectDTO) => {
    console.log(
      "[useGrokImagesForProject] Starting image generation for project:",
      project.id,
    );
    setIsGenerating(true);
    setError(null);

    try {
      // Identify pages without images
      const unillustratedPages = project.pages.filter((page) => !page.imageUrl);

      if (unillustratedPages.length === 0) {
        console.log("[useGrokImagesForProject] No unillustrated pages found");
        setIsGenerating(false);
        return {
          success: true,
          message: "All pages already have images",
          generatedCount: 0,
        };
      }

      console.log(
        "[useGrokImagesForProject] Found",
        unillustratedPages.length,
        "unillustrated pages",
      );

      // Prepare request for Grok agent
      const grokRequests: GrokImageRequest[] = unillustratedPages.map(
        (page) => ({
          pageId: `${project.id}-page-${page.pageNumber}`,
          pageNumber: page.pageNumber,
          text: page.text,
        }),
      );

      // Send to Grok agent
      console.log("[useGrokImagesForProject] Sending requests to Grok agent");
      const grokResponses = await requestGrokImagesForPages(grokRequests);

      if (grokResponses.length === 0) {
        throw new Error("Grok agent did not return any images");
      }

      console.log(
        "[useGrokImagesForProject] Received",
        grokResponses.length,
        "images from Grok",
      );

      // Update project with generated image URLs
      const updatedPages = project.pages.map((page) => {
        const grokResponse = grokResponses.find(
          (response) => response.pageNumber === page.pageNumber,
        );

        if (grokResponse) {
          console.log(
            "[useGrokImagesForProject] Updating page",
            page.pageNumber,
            "with image:",
            grokResponse.imageUrl,
          );
          return {
            ...page,
            imageUrl: grokResponse.imageUrl,
          };
        }

        return page;
      });

      // Save updated project
      const updatedProject: ProjectDTO = {
        ...project,
        pages: updatedPages,
        updatedAt: Date.now(),
      };

      console.log(
        "[useGrokImagesForProject] Saving updated project with",
        grokResponses.length,
        "new images",
      );
      await updateProject(updatedProject);

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      console.log(
        "[useGrokImagesForProject] Image generation completed successfully",
      );
      setIsGenerating(false);

      return {
        success: true,
        message: `Successfully generated ${grokResponses.length} images`,
        generatedCount: grokResponses.length,
      };
    } catch (err: any) {
      console.error("[useGrokImagesForProject] Image generation failed:", err);
      const errorMessage = err.message || "Failed to generate images with Grok";
      setError(errorMessage);
      setIsGenerating(false);

      return {
        success: false,
        message: errorMessage,
        generatedCount: 0,
      };
    }
  };

  return {
    generateGrokImagesForProject,
    isGenerating,
    error,
  };
}
