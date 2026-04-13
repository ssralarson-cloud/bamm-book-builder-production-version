import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface KDPValidation {
    errors: Array<string>;
    trimSize: Dimensions;
    warnings: Array<string>;
    bleed: BleedSpec;
    margin: MarginSpec;
    spineWidth: number;
    isValid: boolean;
}
export interface CoverElement {
    text: string;
    layout: Layout;
    imageUrl?: string;
}
export interface BleedSpec {
    top: number;
    left: number;
    bottom: number;
    right: number;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Size {
    height: number;
    width: number;
}
export interface TextPosition {
    x: number;
    y: number;
    height: number;
    width: number;
}
export interface ProjectSettings {
    font: string;
    margin: number;
    fontSize: number;
    lineSpacing: number;
}
export interface ImagePosition {
    x: number;
    y: number;
    height: number;
    width: number;
}
export interface CoverSpec {
    front: CoverElement;
    back: CoverElement;
    spine: SpineSpec;
    bleed: BleedSpec;
    dimensions: Dimensions;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface MarginSpec {
    top: number;
    left: number;
    bottom: number;
    right: number;
}
export interface Position {
    x: number;
    y: number;
}
export interface Page {
    text: string;
    pageNumber: bigint;
    layout: PageLayout;
    imageUrl?: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Image {
    id: string;
    dpi: number;
    owner: Principal;
    path: string;
    projectId: string;
    uploaded: bigint;
    pageId?: string;
}
export interface PageLayout {
    imagePosition: ImagePosition;
    textPosition: TextPosition;
}
export interface Dimensions {
    height: number;
    width: number;
}
export interface Project {
    id: string;
    kdpValidation: KDPValidation;
    title: string;
    owner: Principal;
    createdAt: bigint;
    cover: CoverSpec;
    updatedAt: bigint;
    story: string;
    settings: ProjectSettings;
    pages: Array<Page>;
}
export interface SpineSpec {
    text: string;
    width: number;
}
export interface UserProfile {
    name: string;
}
export interface Layout {
    size: Size;
    position: Position;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addImage(projectId: string, path: string, dpi: number): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createProject(title: string): Promise<bigint>;
    deleteImage(id: string): Promise<void>;
    deleteProject(id: string): Promise<void>;
    dropFileReference(path: string): Promise<void>;
    generateImagePrompt(projectId: string, pageText: string, projectContext: string): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDeploymentUrl(): Promise<string>;
    getFileOwner(path: string): Promise<Principal | null>;
    getImage(id: string): Promise<Image | null>;
    getKDPComplianceStatus(projectId: string): Promise<boolean | null>;
    getKDPValidationReport(projectId: string): Promise<KDPValidation | null>;
    getProject(id: string): Promise<Project | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isSubscribed(): Promise<boolean>;
    listImages(projectId: string): Promise<Array<Image>>;
    listProjects(): Promise<Array<Project>>;
    registerFileReference(path: string, hash: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setSubscription(user: Principal, isActive: boolean): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateProject(project: Project): Promise<void>;
    validateKDP(projectId: string): Promise<KDPValidation | null>;
}
