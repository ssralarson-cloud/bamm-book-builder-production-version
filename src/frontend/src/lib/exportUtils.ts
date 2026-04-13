/**
 * Export utilities for handling BigInt serialization and data export
 * This is the ONLY place where JSON.stringify should be used for export operations
 */

import type { Principal } from "@icp-sdk/core/principal";
import type { KDPValidation, Page, Project } from "../backend";

/**
 * Safe JSON stringify that handles BigInt values
 * Converts BigInt to number for serialization
 */
export function safeStringify(value: any, space?: number): string {
  return JSON.stringify(
    value,
    (key, val) => {
      // Convert BigInt to number
      if (typeof val === "bigint") {
        // Check if the BigInt is within safe integer range
        const num = Number(val);
        if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
          console.warn(
            `[safeStringify] BigInt value ${val} exceeds safe integer range, precision may be lost`,
            { key, value: val.toString() },
          );
        }
        return num;
      }
      return val;
    },
    space,
  );
}

/**
 * Convert BigInt timestamps to ISO date strings
 */
export function bigIntToISOString(timestamp: bigint): string {
  // Convert nanoseconds to milliseconds
  const ms = Number(timestamp / BigInt(1_000_000));
  return new Date(ms).toISOString();
}

/**
 * Convert BigInt timestamps to milliseconds (number)
 */
export function bigIntToMs(timestamp: bigint): number {
  return Number(timestamp / BigInt(1_000_000));
}

/**
 * Convert BigInt page numbers to regular numbers
 */
export function bigIntToNumber(value: bigint): number {
  const num = Number(value);
  if (num > Number.MAX_SAFE_INTEGER) {
    console.warn(
      `[bigIntToNumber] Value ${value} exceeds MAX_SAFE_INTEGER, precision may be lost`,
    );
  }
  return num;
}

/**
 * Project DTO with normalized number fields (no BigInt)
 */
export interface ProjectDTO {
  id: string;
  title: string;
  owner: string;
  createdAt: number; // milliseconds
  updatedAt: number; // milliseconds
  story: string;
  pages: PageDTO[];
  cover: Project["cover"];
  settings: Project["settings"];
  kdpValidation: Project["kdpValidation"];
}

/**
 * Page DTO with normalized number fields (no BigInt)
 */
export interface PageDTO {
  pageNumber: number;
  text: string;
  imageUrl?: string;
  layout: Page["layout"];
}

/**
 * Convert backend Project to normalized ProjectDTO
 * This strips all BigInt values and converts them to numbers
 */
export function fromBackendProject(project: Project): ProjectDTO {
  console.log("[fromBackendProject] Converting project:", project.id);

  return {
    id: project.id,
    title: project.title,
    owner: project.owner.toString(),
    createdAt: bigIntToMs(project.createdAt),
    updatedAt: bigIntToMs(project.updatedAt),
    story: project.story,
    pages: project.pages.map(fromBackendPage),
    cover: project.cover,
    settings: project.settings,
    kdpValidation: project.kdpValidation,
  };
}

/**
 * Convert backend Page to normalized PageDTO
 */
export function fromBackendPage(page: Page): PageDTO {
  return {
    pageNumber: bigIntToNumber(page.pageNumber),
    text: page.text,
    imageUrl: page.imageUrl,
    layout: page.layout,
  };
}

/**
 * Convert ProjectDTO back to Project for backend submission
 */
export function toBackendProject(
  projectDTO: ProjectDTO,
  ownerPrincipal: Principal,
): Project {
  return {
    id: projectDTO.id,
    title: projectDTO.title,
    owner: ownerPrincipal,
    createdAt: BigInt(projectDTO.createdAt * 1_000_000),
    updatedAt: BigInt(projectDTO.updatedAt * 1_000_000),
    story: projectDTO.story,
    pages: projectDTO.pages.map(toBackendPage),
    cover: projectDTO.cover,
    settings: projectDTO.settings,
    kdpValidation: projectDTO.kdpValidation,
  };
}

/**
 * Convert PageDTO back to Page for backend submission
 */
export function toBackendPage(pageDTO: PageDTO): Page {
  return {
    pageNumber: BigInt(pageDTO.pageNumber),
    text: pageDTO.text,
    imageUrl: pageDTO.imageUrl,
    layout: pageDTO.layout,
  };
}

/**
 * Build export payload with all BigInt values converted
 * This is the main function for preparing data for export
 * CRITICAL: All numeric fields must be numbers, all timestamps must be ISO strings
 */
export function buildExportPayload(
  project: ProjectDTO,
  validation: KDPValidation | null,
): ExportPayload {
  console.log("[buildExportPayload] Building export payload for:", project.id);
  console.log(
    "[buildExportPayload] Input project.createdAt type:",
    typeof project.createdAt,
  );
  console.log(
    "[buildExportPayload] Input project.updatedAt type:",
    typeof project.updatedAt,
  );

  // Ensure timestamps are numbers before converting to ISO strings
  const createdAtMs =
    typeof project.createdAt === "number"
      ? project.createdAt
      : Number(project.createdAt);
  const updatedAtMs =
    typeof project.updatedAt === "number"
      ? project.updatedAt
      : Number(project.updatedAt);

  // Convert all timestamps to ISO strings
  const createdAt = new Date(createdAtMs).toISOString();
  const updatedAt = new Date(updatedAtMs).toISOString();

  // Ensure all page numbers are regular numbers
  const normalizedPages = project.pages.map((page) => ({
    ...page,
    pageNumber:
      typeof page.pageNumber === "number"
        ? page.pageNumber
        : Number(page.pageNumber),
  }));

  const payload: ExportPayload = {
    project: {
      id: project.id,
      title: project.title,
      owner: project.owner,
      createdAt,
      updatedAt,
      story: project.story,
      pages: normalizedPages,
      cover: project.cover,
      settings: project.settings,
    },
    validation: validation
      ? {
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings,
          trimSize: validation.trimSize,
          bleed: validation.bleed,
          margin: validation.margin,
          spineWidth: validation.spineWidth,
        }
      : null,
    metadata: {
      exportDate: new Date().toISOString(),
      format: "Amazon KDP",
      version: "1.0",
    },
  };

  console.log("[buildExportPayload] Payload built successfully");
  console.log(
    "[buildExportPayload] Output payload.project.createdAt type:",
    typeof payload.project.createdAt,
  );
  console.log(
    "[buildExportPayload] Output payload.project.updatedAt type:",
    typeof payload.project.updatedAt,
  );
  console.log("[buildExportPayload] Pages:", normalizedPages.length);
  if (normalizedPages.length > 0) {
    console.log(
      "[buildExportPayload] Output payload.project.pages[0].pageNumber type:",
      typeof normalizedPages[0].pageNumber,
    );
  }
  console.log(
    "[buildExportPayload] Validation:",
    validation?.isValid ? "VALID" : "INVALID",
  );

  return payload;
}

/**
 * Export payload structure (all BigInt converted to number/string)
 */
export interface ExportPayload {
  project: {
    id: string;
    title: string;
    owner: string;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    story: string;
    pages: PageDTO[];
    cover: Project["cover"];
    settings: Project["settings"];
  };
  validation: KDPValidation | null;
  metadata: {
    exportDate: string; // ISO string
    format: string;
    version: string;
  };
}

/**
 * Export project as JSON string
 * This is the ONLY function that should be used for JSON export
 */
export function exportProjectAsJSON(
  project: ProjectDTO,
  validation: KDPValidation | null,
): string {
  console.log("[exportProjectAsJSON] Exporting project:", project.id);

  const payload = buildExportPayload(project, validation);

  try {
    const json = safeStringify(payload, 2);
    console.log(
      "[exportProjectAsJSON] Export successful, size:",
      json.length,
      "bytes",
    );
    return json;
  } catch (error) {
    console.error("[exportProjectAsJSON] Export failed:", error);
    throw new Error(
      `Failed to export project: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Diagnostic function to detect BigInt leaks in objects
 * Use this during development to find where BigInt values are not being converted
 */
export function detectBigIntLeaks(obj: any, path = "root"): string[] {
  const leaks: string[] = [];

  if (obj === null || obj === undefined) {
    return leaks;
  }

  if (typeof obj === "bigint") {
    leaks.push(`${path}: BigInt(${obj.toString()})`);
    return leaks;
  }

  if (Array.isArray(obj)) {
    for (let index = 0; index < obj.length; index++) {
      leaks.push(...detectBigIntLeaks(obj[index], `${path}[${index}]`));
    }
    return leaks;
  }

  if (typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      leaks.push(...detectBigIntLeaks(obj[key], `${path}.${key}`));
    }
  }

  return leaks;
}

/**
 * Log BigInt leaks for debugging
 */
export function logBigIntLeaks(obj: any, context: string): void {
  const leaks = detectBigIntLeaks(obj);
  if (leaks.length > 0) {
    console.warn(`[${context}] BigInt leaks detected:`, leaks);
  } else {
    console.log(`[${context}] No BigInt leaks detected ✓`);
  }
}
