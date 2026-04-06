/**
 * KDP Interior PDF Export
 *
 * Generates a print-ready interior PDF for Amazon KDP.
 * Trim: 8.5×8.5", Bleed: 0.125", Safe margin: 0.5" from trim.
 */

import jsPDF from 'jspdf';
import type { PageDTO } from './exportUtils';

// KDP dimensions in inches
const TRIM_W = 8.5;
const TRIM_H = 8.5;
const BLEED = 0.125;
const SAFE_MARGIN = 0.5; // from trim edge

// Total page size including bleed
const PAGE_W = TRIM_W + BLEED * 2; // 8.75
const PAGE_H = TRIM_H + BLEED * 2; // 8.75

// Safe text area (from page edge, accounting for bleed + margin)
const TEXT_LEFT = BLEED + SAFE_MARGIN; // 0.625
const TEXT_TOP = BLEED + SAFE_MARGIN; // 0.625
const TEXT_W = TRIM_W - SAFE_MARGIN * 2; // 7.5

/**
 * Fetch an image and return it as a base64 data URL.
 */
async function fetchImageAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate a KDP-ready interior PDF from project pages.
 *
 * @param pages - Array of PageDTO objects (sorted by pageNumber)
 * @param resolveImageUrl - Function that resolves a storage path to a fetchable URL
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns PDF as a Blob
 */
export async function generateInteriorPDF(
  pages: PageDTO[],
  resolveImageUrl: (path: string) => Promise<string>,
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  if (pages.length === 0) {
    throw new Error('No pages to export');
  }

  // Sort pages by pageNumber
  const sorted = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [PAGE_W, PAGE_H],
  });

  for (let i = 0; i < sorted.length; i++) {
    const page = sorted[i];

    // Add new page for all pages after the first
    if (i > 0) {
      doc.addPage([PAGE_W, PAGE_H], 'portrait');
    }

    // --- Full-bleed image ---
    if (page.imageUrl) {
      try {
        const imageUrl = await resolveImageUrl(page.imageUrl);
        const dataUrl = await fetchImageAsDataUrl(imageUrl);

        // Draw image full-bleed (covers entire page including bleed area)
        doc.addImage(dataUrl, 0, 0, PAGE_W, PAGE_H);
      } catch (err) {
        console.error(`[pdfExport] Failed to load image for page ${page.pageNumber}:`, err);
        // Continue without image — page will just have text
      }
    }

    // --- Text overlay ---
    if (page.text && page.text.trim()) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);

      // Split text into lines that fit within safe area
      const lines = doc.splitTextToSize(page.text, TEXT_W);

      // Draw text within safe margins, offset slightly below top margin
      doc.text(lines, TEXT_LEFT, TEXT_TOP + 0.3, {
        maxWidth: TEXT_W,
        lineHeightFactor: 1.5,
      });
    }

    // Progress
    if (onProgress) {
      onProgress(Math.round(((i + 1) / sorted.length) * 100));
    }
  }

  return doc.output('blob');
}
