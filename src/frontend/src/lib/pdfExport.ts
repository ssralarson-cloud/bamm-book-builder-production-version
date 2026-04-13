import jsPDF from "jspdf";

const TRIM = 8.5;
const BLEED = 0.125;
const SAFE = 0.5;
const PAGE = TRIM + BLEED * 2; // 8.75
const TEXT_X = BLEED + SAFE; // 0.625
const TEXT_W = TRIM - SAFE * 2; // 7.5

function detectImageFormat(dataUrl: string): string {
  const mime = dataUrl.split(";")[0].split(":")[1] ?? "";
  if (mime === "image/png") return "PNG";
  if (mime === "image/webp") return "WEBP";
  return "JPEG";
}

async function toDataUrl(url: string): Promise<string> {
  const timeoutPromise = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error("Image fetch timed out after 10s")), 10000),
  );
  const fetchPromise = fetch(url).then((r) => r.blob());
  const b = await Promise.race([fetchPromise, timeoutPromise]);
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = rej;
    fr.readAsDataURL(b);
  });
}

export async function generateInteriorPDF(
  pages: Array<{ pageNumber: number; text: string; imageUrl?: string }>,
  resolveImageUrl: (p: string) => Promise<string>,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  const sorted = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: [PAGE, PAGE],
  });

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) doc.addPage([PAGE, PAGE], "portrait");
    const pg = sorted[i];

    if (pg.imageUrl) {
      try {
        const url = await resolveImageUrl(pg.imageUrl);
        const dataUrl = await toDataUrl(url);
        doc.addImage(dataUrl, detectImageFormat(dataUrl), 0, 0, PAGE, PAGE);
      } catch (e) {
        console.error(`Image failed page ${pg.pageNumber}`, e);
      }
    }

    if (pg.text?.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(pg.text, TEXT_W);
      doc.text(lines, TEXT_X, TEXT_X + 0.3, { maxWidth: TEXT_W });
    }

    onProgress?.(Math.round(((i + 1) / sorted.length) * 100));
  }

  return doc.output("blob");
}

export async function generateCoverPDF(
  cover: {
    front: { imageUrl?: string | null; text: string };
    back: { imageUrl?: string | null; text: string };
    spine: { text: string };
  },
  spineWidth: number,
  resolveImageUrl: (p: string) => Promise<string>,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  const W = BLEED + TRIM + spineWidth + TRIM + BLEED;
  const H = PAGE;
  const backW = BLEED + TRIM; // 8.625
  const frontX = backW + spineWidth;
  const frontW = TRIM + BLEED; // 8.625

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "in",
    format: [W, H],
  });

  if (cover.back.imageUrl) {
    try {
      const url = await resolveImageUrl(cover.back.imageUrl);
      const dataUrl = await toDataUrl(url);
      doc.addImage(dataUrl, detectImageFormat(dataUrl), 0, 0, backW, H);
    } catch (e) {
      console.error("Back cover image failed", e);
    }
  }
  onProgress?.(25);

  if (cover.front.imageUrl) {
    try {
      const url = await resolveImageUrl(cover.front.imageUrl);
      const dataUrl = await toDataUrl(url);
      doc.addImage(dataUrl, detectImageFormat(dataUrl), frontX, 0, frontW, H);
    } catch (e) {
      console.error("Front cover image failed", e);
    }
  }
  onProgress?.(50);

  if (cover.spine.text?.trim() && spineWidth > 0.1) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(cover.spine.text, backW + spineWidth / 2, H / 2, {
      angle: 90,
      align: "center",
    });
  }
  onProgress?.(75);

  if (cover.front.text?.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    const fx = frontX + BLEED + SAFE;
    const fw = TRIM - SAFE * 2;
    const lines = doc.splitTextToSize(cover.front.text, fw);
    doc.text(lines, fx + fw / 2, BLEED + SAFE + 1, {
      align: "center",
      maxWidth: fw,
    });
  }

  if (cover.back.text?.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const bx = BLEED + SAFE;
    const bw = TRIM - SAFE * 2;
    const lines = doc.splitTextToSize(cover.back.text, bw);
    doc.text(lines, bx + bw / 2, BLEED + SAFE + 1, {
      align: "center",
      maxWidth: bw,
    });
  }
  onProgress?.(100);

  return doc.output("blob");
}
