/**
 * TypeScript bindings for the BAM Book Builder ICP canister.
 * Types match main.mo exactly. IDL factory enables actor creation via @dfinity/agent.
 *
 * Candid type mappings:
 *   Nat  → bigint
 *   Int  → bigint
 *   Float64 → number
 *   ?T   → [] | [T]   (Candid Opt)
 *   Bool → boolean
 *   Text → string
 */

import type { Principal } from '@icp-sdk/core/principal';
import { IDL } from '@icp-sdk/core/candid';

// ─── Shared Geometry ──────────────────────────────────────

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Layout {
  position: Position;
  size: Size;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface BleedSpec {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface MarginSpec {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// ─── Page ─────────────────────────────────────────────────

export interface TextPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageLayout {
  textPosition: TextPosition;
  imagePosition: ImagePosition;
}

export interface Page {
  pageNumber: bigint;      // Nat in Motoko → bigint
  text: string;
  imageUrl: [] | [string]; // ?Text in Motoko → Candid Opt
  layout: PageLayout;
}

// ─── Cover ────────────────────────────────────────────────

export interface CoverElement {
  imageUrl: [] | [string]; // ?Text in Motoko → Candid Opt
  text: string;
  layout: Layout;
}

export interface SpineSpec {
  width: number;
  text: string;
}

export interface CoverSpec {
  front: CoverElement;
  back: CoverElement;
  spine: SpineSpec;
  dimensions: Dimensions;
  bleed: BleedSpec;
}

// ─── Project ──────────────────────────────────────────────

export interface ProjectSettings {
  font: string;
  fontSize: number;
  margin: number;
  lineSpacing: number;
}

export interface KDPValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  trimSize: Dimensions;
  bleed: BleedSpec;
  margin: MarginSpec;
  spineWidth: number;
}

export interface Project {
  id: string;
  title: string;
  owner: Principal;
  createdAt: bigint;  // Int (nanoseconds) in Motoko
  updatedAt: bigint;  // Int (nanoseconds) in Motoko
  story: string;
  pages: Page[];
  cover: CoverSpec;
  settings: ProjectSettings;
  kdpValidation: KDPValidation;
}

// ─── Image ────────────────────────────────────────────────

export interface Image {
  id: string;
  path: string;
  projectId: string;
  owner: Principal;
  pageId: [] | [string];
  uploaded: bigint;
  dpi: number;
}

// ─── User / Auth ──────────────────────────────────────────

export interface UserProfile {
  name: string;
}

export interface Subscription {
  isActive: boolean;
  updatedAt: bigint;
}

export type UserRole =
  | { admin: null }
  | { user: null }
  | { guest: null };

// ─── Blob Storage ─────────────────────────────────────────

export interface FileReference {
  path: string;
  hash: string;
}

// ─── Actor Interface ──────────────────────────────────────

export interface backendInterface {
  // Access Control
  initializeAccessControl(): Promise<void>;
  getCallerUserRole(): Promise<UserRole>;
  assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
  isCallerAdmin(): Promise<boolean>;

  // User Profile
  getCallerUserProfile(): Promise<[] | [UserProfile]>;
  getUserProfile(user: Principal): Promise<[] | [UserProfile]>;
  saveCallerUserProfile(profile: UserProfile): Promise<void>;

  // Subscription
  isSubscribed(): Promise<boolean>;
  setSubscription(user: Principal, isActive: boolean): Promise<void>;
  getSubscription(user: Principal): Promise<[] | [Subscription]>;

  // Projects
  createProject(title: string): Promise<bigint>;
  updateProject(project: Project): Promise<void>;
  getProject(id: string): Promise<[] | [Project]>;
  listProjects(): Promise<Project[]>;
  deleteProject(id: string): Promise<void>;

  // Images
  addImage(projectId: string, path: string, dpi: number): Promise<string>;
  getImage(id: string): Promise<[] | [Image]>;
  listImages(projectId: string): Promise<Image[]>;
  deleteImage(id: string): Promise<void>;

  // Blob Storage
  registerFileReference(path: string, hash: string): Promise<void>;
  getFileReference(path: string): Promise<FileReference>;
  listFileReferences(): Promise<FileReference[]>;
  dropFileReference(path: string): Promise<void>;

  // KDP Validation
  validateKDP(projectId: string): Promise<[] | [KDPValidation]>;
  getKDPComplianceStatus(projectId: string): Promise<[] | [boolean]>;
  getKDPValidationReport(projectId: string): Promise<[] | [KDPValidation]>;

  // AI
  generateImagePrompt(
    projectId: string,
    pageText: string,
    projectContext: string,
  ): Promise<string>;

  // Deployment
  getDeploymentUrl(): Promise<string>;
}

// ─── IDL Factory ──────────────────────────────────────────

export const idlFactory = ({ IDL: idl }: { IDL: typeof IDL }) => {
  const Position = idl.Record({ x: idl.Float64, y: idl.Float64 });
  const Size = idl.Record({ width: idl.Float64, height: idl.Float64 });
  const Layout = idl.Record({ position: Position, size: Size });
  const Dimensions = idl.Record({ width: idl.Float64, height: idl.Float64 });

  const BleedSpec = idl.Record({
    top: idl.Float64,
    bottom: idl.Float64,
    left: idl.Float64,
    right: idl.Float64,
  });

  const MarginSpec = idl.Record({
    top: idl.Float64,
    bottom: idl.Float64,
    left: idl.Float64,
    right: idl.Float64,
  });

  const TextPosition = idl.Record({
    x: idl.Float64,
    y: idl.Float64,
    width: idl.Float64,
    height: idl.Float64,
  });

  const ImagePosition = idl.Record({
    x: idl.Float64,
    y: idl.Float64,
    width: idl.Float64,
    height: idl.Float64,
  });

  const PageLayout = idl.Record({
    textPosition: TextPosition,
    imagePosition: ImagePosition,
  });

  const Page = idl.Record({
    pageNumber: idl.Nat,
    text: idl.Text,
    imageUrl: idl.Opt(idl.Text),
    layout: PageLayout,
  });

  const CoverElement = idl.Record({
    imageUrl: idl.Opt(idl.Text),
    text: idl.Text,
    layout: Layout,
  });

  const SpineSpec = idl.Record({ width: idl.Float64, text: idl.Text });

  const CoverSpec = idl.Record({
    front: CoverElement,
    back: CoverElement,
    spine: SpineSpec,
    dimensions: Dimensions,
    bleed: BleedSpec,
  });

  const ProjectSettings = idl.Record({
    font: idl.Text,
    fontSize: idl.Float64,
    margin: idl.Float64,
    lineSpacing: idl.Float64,
  });

  const KDPValidation = idl.Record({
    isValid: idl.Bool,
    errors: idl.Vec(idl.Text),
    warnings: idl.Vec(idl.Text),
    trimSize: Dimensions,
    bleed: BleedSpec,
    margin: MarginSpec,
    spineWidth: idl.Float64,
  });

  const Project = idl.Record({
    id: idl.Text,
    title: idl.Text,
    owner: idl.Principal,
    createdAt: idl.Int,
    updatedAt: idl.Int,
    story: idl.Text,
    pages: idl.Vec(Page),
    cover: CoverSpec,
    settings: ProjectSettings,
    kdpValidation: KDPValidation,
  });

  const Image = idl.Record({
    id: idl.Text,
    path: idl.Text,
    projectId: idl.Text,
    owner: idl.Principal,
    pageId: idl.Opt(idl.Text),
    uploaded: idl.Int,
    dpi: idl.Float64,
  });

  const UserProfile = idl.Record({ name: idl.Text });

  const Subscription = idl.Record({
    isActive: idl.Bool,
    updatedAt: idl.Int,
  });

  const UserRole = idl.Variant({
    admin: idl.Null,
    user: idl.Null,
    guest: idl.Null,
  });

  const FileReference = idl.Record({ path: idl.Text, hash: idl.Text });

  return idl.Service({
    // Access Control
    initializeAccessControl: idl.Func([], [], []),
    getCallerUserRole: idl.Func([], [UserRole], ['query']),
    assignCallerUserRole: idl.Func([idl.Principal, UserRole], [], []),
    isCallerAdmin: idl.Func([], [idl.Bool], ['query']),

    // User Profile
    getCallerUserProfile: idl.Func([], [idl.Opt(UserProfile)], ['query']),
    getUserProfile: idl.Func([idl.Principal], [idl.Opt(UserProfile)], ['query']),
    saveCallerUserProfile: idl.Func([UserProfile], [], []),

    // Subscription
    isSubscribed: idl.Func([], [idl.Bool], ['query']),
    setSubscription: idl.Func([idl.Principal, idl.Bool], [], []),
    getSubscription: idl.Func([idl.Principal], [idl.Opt(Subscription)], ['query']),

    // Projects
    createProject: idl.Func([idl.Text], [idl.Nat], []),
    updateProject: idl.Func([Project], [], []),
    getProject: idl.Func([idl.Text], [idl.Opt(Project)], ['query']),
    listProjects: idl.Func([], [idl.Vec(Project)], ['query']),
    deleteProject: idl.Func([idl.Text], [], []),

    // Images
    addImage: idl.Func([idl.Text, idl.Text, idl.Float64], [idl.Text], []),
    getImage: idl.Func([idl.Text], [idl.Opt(Image)], ['query']),
    listImages: idl.Func([idl.Text], [idl.Vec(Image)], ['query']),
    deleteImage: idl.Func([idl.Text], [], []),

    // Blob Storage
    registerFileReference: idl.Func([idl.Text, idl.Text], [], []),
    getFileReference: idl.Func([idl.Text], [FileReference], ['query']),
    listFileReferences: idl.Func([], [idl.Vec(FileReference)], ['query']),
    dropFileReference: idl.Func([idl.Text], [], []),

    // KDP Validation
    validateKDP: idl.Func([idl.Text], [idl.Opt(KDPValidation)], ['query']),
    getKDPComplianceStatus: idl.Func([idl.Text], [idl.Opt(idl.Bool)], ['query']),
    getKDPValidationReport: idl.Func([idl.Text], [idl.Opt(KDPValidation)], ['query']),

    // AI
    generateImagePrompt: idl.Func([idl.Text, idl.Text, idl.Text], [idl.Text], []),

    // Deployment
    getDeploymentUrl: idl.Func([], [idl.Text], ['query']),
  });
};
