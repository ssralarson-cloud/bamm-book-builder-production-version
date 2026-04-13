/**
 * IC Panda API Client for AI-powered image prompt generation
 * This module handles communication with the IC Panda service via the backend canister
 */

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const requestTimestamps: number[] = [];

/**
 * Check if we're within rate limits
 */
function checkRateLimit(): boolean {
  const now = Date.now();
  // Remove timestamps older than the window
  while (
    requestTimestamps.length > 0 &&
    requestTimestamps[0] < now - RATE_LIMIT_WINDOW
  ) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  requestTimestamps.push(now);
  return true;
}

/**
 * Generate an image prompt suggestion based on page text
 * This function calls the backend canister which communicates with IC Panda API
 *
 * Note: This is a placeholder that will be replaced by the useGenerateImagePrompt hook
 * The actual implementation should use the backend actor directly via React Query
 */
export async function generateImagePrompt(pageText: string): Promise<string> {
  console.log(
    "[icPandaClient] generateImagePrompt called - this should use useGenerateImagePrompt hook instead",
  );

  // Check rate limiting
  if (!checkRateLimit()) {
    console.warn("[icPandaClient] Rate limit exceeded");
    throw new Error(
      "Rate limit exceeded. Please wait a moment before requesting another suggestion.",
    );
  }

  // Validate input
  if (!pageText || pageText.trim().length === 0) {
    throw new Error("Page text is required for prompt generation");
  }

  if (pageText.length > 5000) {
    console.warn(
      "[icPandaClient] Text too long, truncating to 5000 characters",
    );
    const localText = pageText.substring(0, 5000);
    // Use localText for prompt generation below if needed
    void localText;
  }

  // This function should not be called directly
  // Use the useGenerateImagePrompt hook instead which calls the backend
  throw new Error(
    "Please use the useGenerateImagePrompt hook for AI prompt generation",
  );
}

/**
 * Generate contextual prompt based on text analysis (client-side fallback)
 * This is used as a fallback if the backend API is unavailable
 */
export function generateContextualPrompt(text: string): string {
  // Extract key elements from the text
  const lowerText = text.toLowerCase();

  // Detect characters
  const characters: string[] = [];
  if (lowerText.includes("princess") || lowerText.includes("queen"))
    characters.push("a princess");
  if (lowerText.includes("prince") || lowerText.includes("king"))
    characters.push("a prince");
  if (lowerText.includes("witch")) characters.push("a witch");
  if (lowerText.includes("dragon")) characters.push("a dragon");
  if (lowerText.includes("fairy") || lowerText.includes("fairies"))
    characters.push("a fairy");
  if (lowerText.includes("knight")) characters.push("a knight");
  if (
    lowerText.includes("child") ||
    lowerText.includes("boy") ||
    lowerText.includes("girl")
  )
    characters.push("a child");
  if (lowerText.includes("cat")) characters.push("a cat");
  if (lowerText.includes("dog")) characters.push("a dog");
  if (lowerText.includes("bear")) characters.push("a bear");
  if (lowerText.includes("rabbit") || lowerText.includes("bunny"))
    characters.push("a rabbit");
  if (lowerText.includes("bird")) characters.push("a bird");

  // Detect settings
  const settings: string[] = [];
  if (lowerText.includes("forest") || lowerText.includes("woods"))
    settings.push("in an enchanted forest");
  if (lowerText.includes("castle")) settings.push("near a grand castle");
  if (lowerText.includes("village") || lowerText.includes("town"))
    settings.push("in a quaint village");
  if (lowerText.includes("garden")) settings.push("in a magical garden");
  if (lowerText.includes("mountain")) settings.push("on a misty mountain");
  if (lowerText.includes("sea") || lowerText.includes("ocean"))
    settings.push("by the sea");
  if (lowerText.includes("sky") || lowerText.includes("cloud"))
    settings.push("among the clouds");
  if (lowerText.includes("night") || lowerText.includes("moon"))
    settings.push("under moonlight");
  if (lowerText.includes("day") || lowerText.includes("sun"))
    settings.push("in golden sunlight");

  // Detect mood/atmosphere
  const moods: string[] = [];
  if (lowerText.includes("happy") || lowerText.includes("joy"))
    moods.push("joyful");
  if (lowerText.includes("sad") || lowerText.includes("cry"))
    moods.push("melancholic");
  if (lowerText.includes("scary") || lowerText.includes("afraid"))
    moods.push("mysterious");
  if (lowerText.includes("magic") || lowerText.includes("wonder"))
    moods.push("magical");
  if (lowerText.includes("adventure")) moods.push("adventurous");
  if (lowerText.includes("peaceful") || lowerText.includes("calm"))
    moods.push("serene");

  // Build the prompt
  let prompt =
    "A children's book illustration in a black-and-white boho old-world storybook style, inspired by Grimm's fairy tales. ";

  if (characters.length > 0) {
    prompt += `The scene features ${characters.slice(0, 2).join(" and ")} `;
  } else {
    prompt += "The scene depicts ";
  }

  if (settings.length > 0) {
    prompt += `${settings[0]}. `;
  }

  if (moods.length > 0) {
    prompt += `The atmosphere is ${moods[0]}. `;
  }

  // Add style details
  prompt +=
    "Line-art style with elegant details, cream and off-white tones, vintage storybook aesthetic. ";
  prompt += "Suitable for 8.5×8.5\" children's book format with safe margins.";

  return prompt;
}

/**
 * Generate an image using IC Panda AI (placeholder for future implementation)
 */
export async function generateImage(prompt: string): Promise<Blob> {
  console.log("[icPandaClient] generateImage called with prompt:", prompt);

  // Check rate limiting
  if (!checkRateLimit()) {
    throw new Error(
      "Rate limit exceeded. Please wait a moment before generating another image.",
    );
  }

  // TODO: Implement actual IC Panda image generation API call via backend
  throw new Error(
    "Image generation not yet implemented. Please upload an image manually.",
  );
}
