/**
 * KDP Cover PDF Export
 *
 * Generates a single-page, print-ready cover PDF for Amazon KDP.
 *
 * Layout (left → right):
 *   [ back cover ] [ spine ] [ front cover ]
 *   + 0.125" bleed on all four edges
 *
 * Total page size:
 *   width  = (trimWidth * 2) + spineWidth + (bleed * 2)
 *   height = trimHeight + (bleed * 2)
 */

import jsPDF from 'jspdf';
import type { KDPValidation } from '../backend';

// KDP standard bleed
const BLEED = 0.125;

interface CoverExportOptions {
  /** Front-cover image URL (fetchable) or undefined */
  frontImageUrl?: string;
  /** Back-cover image URL (fetchable) or undefined */
  backImageUrl?: string;
  /** Book title (printed on spine) */
  title: string;
  /** KDP validation data (provides trimSize, spineWidth) */
  validation: KDPValidation;
  /** Optional progress callback (0-100) */
  onProgress?: (percent: number) => void;
}

/**
 * Fetch an image URL and return it as a base64 data URL.
 */
async function fetchDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status} ${res.statusText}`);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate a KDP-ready full-wrap cover PDF.
 * @returns PDF blob ready for download.
 */
export async function generateCoverPDF(options: CoverExportOptions): Promise<Blob> {
  const { frontImageUrl, backImageUrl, title, validation, onProgress } = options;

  const trimW = validation.trimSize.width;   // 8.5"
  const trimH = validation.trimSize.height;  // 8.5"
  const spineW = validation.spineWidth;       // calculated from page count

  // Total PDF canvas dimensions (including bleed on all sides)
  const totalW = trimW * 2 + spineW + BLEED * 2;
  const totalH = trimH + BLEED * 2;

  // X offsets (from left edge of PDF, bleed already included)
  const backLeft = 0;                          // back cover starts at 0
  const spineLeft = BLEED + trimW;             // spine starts after back cover + left bleed
  const frontLeft = spineLeft + spineW;        // front cover starts after spine

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: [totalH, totalW], // jsPDF: [height, width] for landscape
  });

  // ── Background fill (white) ─────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, totalW, totalH, 'F');

  onProgress?.(10);

  // ── Back cover image ────────────────────────────────────
  if (backImageUrl) {
    try {
      const dataUrl = await fetchDataUrl(backImageUrl);
      // Back cover: from x=0, y=0, covers trimW + left bleed wide, full height
      doc.addImage(dataUrl, 0, 0, BLEED + trimW, totalH);
    } catch (err) {
      console.error('[coverPdfExport] Back cover image failed:', err);
    }
  }

  onProgress?.(40);

  // ── Front cover image ───────────────────────────────────
  if (frontImageUrl) {
    try {
      const dataUrl = await fetchDataUrl(frontImageUrl);
      // Front cover: from spineLeft, y=0, covers trimW + right bleed wide, full height
      doc.addImage(dataUrl, frontLeft, 0, trimW + BLEED, totalH);
    } catch (err) {
      console.error('[coverPdfExport] Front cover image failed:', err);
    }
  }

  onProgress?.(70);

  // ── Spine ───────────────────────────────────────────────
  if (spineW > 0) {
    // Spine background (light grey placeholder if no image)
    doc.setFillColor(220, 215, 200);
    doc.rect(spineLeft, 0, spineW, totalH, 'F');

    // Spine title text (rotated 90° CW, centred)
    if (title && spineW >= 0.05) {
      const spineCenterX = spineLeft + spineW / 2;
      const spineCenterY = totalH / 2;

      doc.setFont('helvetica', 'bold');
      // Font size capped so it fits in spine width (1pt ≈ 0.0138")
      const maxFontPt = Math.floor((spineW * 72) * 0.7);
      const fontPt = Math.max(6, Math.min(maxFontPt, 12));
      doc.setFontSize(fontPt);
      doc.setTextColor(40, 30, 20);

      doc.text(title, spineCenterX, spineCenterY, {
        angle: 90,
        align: 'center',
      });
    }
  }

  onProgress?.(90);

  // ── Trim / bleed guide lines (optional, as hairlines) ──
  // These help KDP verify the bleed — they are outside the trim box
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.005);

  // Trim box: back cover right edge
  doc.line(BLEED + trimW, 0, BLEED + trimW, totalH);
  // Trim box: front cover left edge
  doc.line(frontLeft, 0, frontLeft, totalH);
  // Trim box: top and bottom bleed lines
  doc.line(0, BLEED, totalW, BLEED);
  doc.line(0, totalH - BLEED, totalW, totalH - BLEED);

  onProgress?.(100);

  return doc.output('blob');
}
