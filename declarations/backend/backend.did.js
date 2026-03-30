export const idlFactory = ({ IDL }) => {
  const FileReference = IDL.Record({ 'hash' : IDL.Text, 'path' : IDL.Text });
  const Time = IDL.Int;
  const Image = IDL.Record({
    'id' : IDL.Text,
    'path' : IDL.Text,
    'projectId' : IDL.Text,
    'uploaded' : Time,
    'pageId' : IDL.Opt(IDL.Text),
  });
  const Size = IDL.Record({ 'height' : IDL.Float64, 'width' : IDL.Float64 });
  const Position = IDL.Record({ 'x' : IDL.Float64, 'y' : IDL.Float64 });
  const Layout = IDL.Record({ 'size' : Size, 'position' : Position });
  const CoverElement = IDL.Record({
    'text' : IDL.Text,
    'layout' : Layout,
    'imageId' : IDL.Opt(IDL.Text),
  });
  const SpineSpec = IDL.Record({ 'text' : IDL.Text, 'width' : IDL.Float64 });
  const Dimensions = IDL.Record({
    'height' : IDL.Float64,
    'width' : IDL.Float64,
  });
  const CoverSpec = IDL.Record({
    'front' : CoverElement,
    'back' : CoverElement,
    'spine' : SpineSpec,
    'dimensions' : Dimensions,
  });
  const ProjectSettings = IDL.Record({
    'font' : IDL.Text,
    'margin' : IDL.Float64,
    'fontSize' : IDL.Float64,
    'lineSpacing' : IDL.Float64,
  });
  const ImagePosition = IDL.Record({
    'x' : IDL.Float64,
    'y' : IDL.Float64,
    'height' : IDL.Float64,
    'width' : IDL.Float64,
  });
  const TextPosition = IDL.Record({
    'x' : IDL.Float64,
    'y' : IDL.Float64,
    'height' : IDL.Float64,
    'width' : IDL.Float64,
  });
  const PageLayout = IDL.Record({
    'imagePosition' : ImagePosition,
    'textPosition' : TextPosition,
  });
  const Page = IDL.Record({
    'text' : IDL.Text,
    'layout' : PageLayout,
    'number' : IDL.Nat,
    'imageId' : IDL.Opt(IDL.Text),
  });
  const Project = IDL.Record({
    'id' : IDL.Text,
    'title' : IDL.Text,
    'created' : Time,
    'modified' : Time,
    'cover' : CoverSpec,
    'story' : IDL.Text,
    'settings' : ProjectSettings,
    'pages' : IDL.Vec(Page),
  });
  return IDL.Service({
    'addImage' : IDL.Func([IDL.Text, IDL.Text], [IDL.Text], []),
    'createProject' : IDL.Func([IDL.Text], [IDL.Text], []),
    'deleteImage' : IDL.Func([IDL.Text], [], []),
    'deleteProject' : IDL.Func([IDL.Text], [], []),
    'dropFileReference' : IDL.Func([IDL.Text], [], []),
    'getFileReference' : IDL.Func([IDL.Text], [FileReference], ['query']),
    'getImage' : IDL.Func([IDL.Text], [IDL.Opt(Image)], ['query']),
    'getProject' : IDL.Func([IDL.Text], [IDL.Opt(Project)], ['query']),
    'listFileReferences' : IDL.Func([], [IDL.Vec(FileReference)], ['query']),
    'listImages' : IDL.Func([IDL.Text], [IDL.Vec(Image)], ['query']),
    'listProjects' : IDL.Func([], [IDL.Vec(Project)], ['query']),
    'registerFileReference' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'updateProject' : IDL.Func([Project], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
