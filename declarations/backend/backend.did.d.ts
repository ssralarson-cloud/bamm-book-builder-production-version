import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface CoverElement {
  'text' : string,
  'layout' : Layout,
  'imageId' : [] | [string],
}
export interface CoverSpec {
  'front' : CoverElement,
  'back' : CoverElement,
  'spine' : SpineSpec,
  'dimensions' : Dimensions,
}
export interface Dimensions { 'height' : number, 'width' : number }
export interface FileReference { 'hash' : string, 'path' : string }
export interface Image {
  'id' : string,
  'path' : string,
  'projectId' : string,
  'uploaded' : Time,
  'pageId' : [] | [string],
}
export interface ImagePosition {
  'x' : number,
  'y' : number,
  'height' : number,
  'width' : number,
}
export interface Layout { 'size' : Size, 'position' : Position }
export interface Page {
  'text' : string,
  'layout' : PageLayout,
  'number' : bigint,
  'imageId' : [] | [string],
}
export interface PageLayout {
  'imagePosition' : ImagePosition,
  'textPosition' : TextPosition,
}
export interface Position { 'x' : number, 'y' : number }
export interface Project {
  'id' : string,
  'title' : string,
  'created' : Time,
  'modified' : Time,
  'cover' : CoverSpec,
  'story' : string,
  'settings' : ProjectSettings,
  'pages' : Array<Page>,
}
export interface ProjectSettings {
  'font' : string,
  'margin' : number,
  'fontSize' : number,
  'lineSpacing' : number,
}
export interface Size { 'height' : number, 'width' : number }
export interface SpineSpec { 'text' : string, 'width' : number }
export interface TextPosition {
  'x' : number,
  'y' : number,
  'height' : number,
  'width' : number,
}
export type Time = bigint;
export interface _SERVICE {
  'addImage' : ActorMethod<[string, string], string>,
  'createProject' : ActorMethod<[string], string>,
  'deleteImage' : ActorMethod<[string], undefined>,
  'deleteProject' : ActorMethod<[string], undefined>,
  'dropFileReference' : ActorMethod<[string], undefined>,
  'getFileReference' : ActorMethod<[string], FileReference>,
  'getImage' : ActorMethod<[string], [] | [Image]>,
  'getProject' : ActorMethod<[string], [] | [Project]>,
  'listFileReferences' : ActorMethod<[], Array<FileReference>>,
  'listImages' : ActorMethod<[string], Array<Image>>,
  'listProjects' : ActorMethod<[], Array<Project>>,
  'registerFileReference' : ActorMethod<[string, string], undefined>,
  'updateProject' : ActorMethod<[Project], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
