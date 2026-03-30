import { useState } from 'react';
import { useActor } from './useActorExtended';

export interface GenerateGrokImageRequest {
  projectId: string;
  prompt: string;
}

/**
 * Hook for generating individual images using Grok AI via local agent.
 * Uses client-side HTTP calls to localhost:4001 for image generation.
 */
export function useGenerateGrokImage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isInitialized, isAuthenticated } = useActor();

  const generateImage = async (projectId: string, prompt: string): Promise<string | null> => {
    if (!isInitialized) {
      throw new Error('Session not ready. Please wait a moment and try again.');
    }

    if (!isAuthenticated) {
      throw new Error('Please log in to generate AI illustrations');
    }

    console.log('[useGenerateGrokImage] Generating image for project:', projectId);
    console.log('[useGenerateGrokImage] Prompt:', prompt);
    
    setIsGenerating(true);
    setError(null);

    try {
      // Call local Grok agent for image generation
      const response = await fetch('http://localhost:4001/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          prompt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useGenerateGrokImage] Grok agent error:', response.status, errorText);
        throw new Error(`Grok agent returned error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const imageUrl = result.imageUrl || result.url;
      
      console.log('[useGenerateGrokImage] Image generated successfully:', imageUrl);
      setIsGenerating(false);
      
      return imageUrl;
    } catch (err: any) {
      console.error('[useGenerateGrokImage] Generation failed:', err);
      
      let errorMessage = 'Failed to generate image with Grok AI';
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = 'Cannot connect to Grok agent at http://localhost:4001. Please ensure the Grok service is running.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsGenerating(false);
      
      throw new Error(errorMessage);
    }
  };

  return {
    generateImage,
    isGenerating,
    error,
  };
}
