/**
 * Grok Image Generation Client
 * Connects to local Grok agent for automated image generation based on page text
 */

export interface GrokImageRequest {
  pageId: string;
  pageNumber: number;
  text: string;
}

export interface GrokImageResponse {
  pageId: string;
  pageNumber: number;
  imageUrl: string;
}

/**
 * Request image generation from local Grok agent
 * Posts to http://localhost:4001/generate-images with page data
 * Returns array of generated image URLs mapped to page IDs
 */
export async function requestGrokImagesForPages(
  pages: GrokImageRequest[]
): Promise<GrokImageResponse[]> {
  console.log('[grokImageClient] Requesting images for', pages.length, 'pages');
  
  if (pages.length === 0) {
    console.warn('[grokImageClient] No pages provided for image generation');
    return [];
  }
  
  try {
    const response = await fetch('http://localhost:4001/generate-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pages }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[grokImageClient] Grok agent error:', response.status, errorText);
      throw new Error(`Grok agent returned error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('[grokImageClient] Successfully received', result.length, 'generated images');
    
    return result as GrokImageResponse[];
  } catch (error) {
    console.error('[grokImageClient] Failed to connect to Grok agent:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to Grok agent at http://localhost:4001. Please ensure the Grok service is running.');
    }
    
    throw error;
  }
}
