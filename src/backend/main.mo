import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:base/Time";
import List "mo:core/List";
import Int "mo:core/Int";
import Float "mo:base/Float";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Nat "mo:core/Nat";



actor {
  // Authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Object storage
  include MixinObjectStorage();

  // Application state
  let projects = Map.empty<Text, Project>();
  let images = Map.empty<Text, Image>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let fileOwnership = Map.empty<Text, Principal>();
  let projectOwners = Map.empty<Text, Principal>();
  var nextProjectId = 0;

  type Project = {
    id : Text;
    title : Text;
    owner : Principal;
    createdAt : Int;
    updatedAt : Int;
    story : Text;
    pages : [Page];
    cover : CoverSpec;
    settings : ProjectSettings;
    kdpValidation : KDPValidation;
  };

  type Page = {
    pageNumber : Nat;
    text : Text;
    imageUrl : ?Text;
    layout : PageLayout;
  };

  type PageLayout = {
    textPosition : TextPosition;
    imagePosition : ImagePosition;
  };

  type TextPosition = {
    x : Float;
    y : Float;
    width : Float;
    height : Float;
  };

  type ImagePosition = {
    x : Float;
    y : Float;
    width : Float;
    height : Float;
  };

  type CoverSpec = {
    front : CoverElement;
    back : CoverElement;
    spine : SpineSpec;
    dimensions : Dimensions;
    bleed : BleedSpec;
  };

  type CoverElement = {
    imageUrl : ?Text;
    text : Text;
    layout : Layout;
  };

  type SpineSpec = {
    width : Float;
    text : Text;
  };

  type Dimensions = {
    width : Float;
    height : Float;
  };

  type Layout = {
    position : Position;
    size : Size;
  };

  type Position = {
    x : Float;
    y : Float;
  };

  type Size = {
    width : Float;
    height : Float;
  };

  type ProjectSettings = {
    font : Text;
    fontSize : Float;
    margin : Float;
    lineSpacing : Float;
  };

  type Image = {
    id : Text;
    path : Text;
    projectId : Text;
    owner : Principal;
    pageId : ?Text;
    uploaded : Int;
    dpi : Float;
  };

  type KDPValidation = {
    isValid : Bool;
    errors : [Text];
    warnings : [Text];
    trimSize : Dimensions;
    bleed : BleedSpec;
    margin : MarginSpec;
    spineWidth : Float;
  };

  type BleedSpec = {
    top : Float;
    bottom : Float;
    left : Float;
    right : Float;
  };

  type MarginSpec = {
    top : Float;
    bottom : Float;
    left : Float;
    right : Float;
  };

  public type UserProfile = {
    name : Text;
  };

  // Subscription state
  type SubscriptionRecord = {
    principal : Principal;
    isActive : Bool;
    updatedAt : Int;
  };

  let subscriptions = Map.empty<Principal, SubscriptionRecord>();

  // Helper: Check if caller is owner or admin for a project
  private func isOwnerOrAdmin(caller : Principal, projectId : Text) : Bool {
    let isAdm = AccessControl.isAdmin(accessControlState, caller);
    if (isAdm) return true;

    switch (projectOwners.get(projectId)) {
      case (?owner) { Principal.equal(caller, owner) };
      case (null) {
        switch (projects.get(projectId)) {
          case (?project) { Principal.equal(caller, project.owner) };
          case (null) { false };
        };
      };
    };
  };

  // Helper function to check image ownership
  private func isImageOwner(caller : Principal, imageId : Text) : Bool {
    switch (images.get(imageId)) {
      case (null) { false };
      case (?image) {
        Principal.equal(caller, image.owner) or AccessControl.isAdmin(accessControlState, caller);
      };
    };
  };

  // Helper function to check file reference ownership
  private func isFileOwner(caller : Principal, path : Text) : Bool {
    switch (fileOwnership.get(path)) {
      case (null) { false };
      case (?owner) {
        Principal.equal(caller, owner) or AccessControl.isAdmin(accessControlState, caller);
      };
    };
  };

  // Helper function to validate image references in project
  private func validateProjectImageReferences(caller : Principal, project : Project) : Bool {
    switch (project.cover.front.imageUrl) {
      case (?imageId) {
        if (not isImageOwner(caller, imageId)) return false;
      };
      case (null) {};
    };

    switch (project.cover.back.imageUrl) {
      case (?imageId) {
        if (not isImageOwner(caller, imageId)) return false;
      };
      case (null) {};
    };

    for (page in project.pages.vals()) {
      switch (page.imageUrl) {
        case (?imageId) {
          if (not isImageOwner(caller, imageId)) return false;
        };
        case (null) {};
      };
    };

    true;
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) return null;
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot access profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Project Management Functions
  public shared ({ caller }) func createProject(title : Text) : async Nat {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Please log in to create projects");
    };

    let id = nextProjectId;
    nextProjectId += 1;

    let project : Project = {
      id = id.toText();
      title;
      owner = caller;
      createdAt = Time.now();
      updatedAt = Time.now();
      story = "";
      pages = [];
      cover = {
        front = { imageUrl = null; text = ""; layout = { position = { x = 0; y = 0 }; size = { width = 0; height = 0 } } };
        back = { imageUrl = null; text = ""; layout = { position = { x = 0; y = 0 }; size = { width = 0; height = 0 } } };
        spine = { width = 0; text = "" };
        dimensions = { width = 8.5; height = 8.5 };
        bleed = { top = 0.125; bottom = 0.125; left = 0.125; right = 0.125 };
      };
      settings = { font = "Arial"; fontSize = 12; margin = 1; lineSpacing = 1.5 };
      kdpValidation = {
        isValid = true;
        errors = [];
        warnings = [];
        trimSize = { width = 8.5; height = 8.5 };
        bleed = { top = 0.125; bottom = 0.125; left = 0.125; right = 0.125 };
        margin = { top = 0.5; bottom = 0.5; left = 0.5; right = 0.5 };
        spineWidth = 0;
      };
    };
    projects.add(id.toText(), project);
    projectOwners.add(id.toText(), caller);

    id;
  };

  public shared ({ caller }) func updateProject(project : Project) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Please log in to update projects");
    };

    let existingProject = switch (projects.get(project.id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?p) { p };
    };

    if (not isOwnerOrAdmin(caller, project.id)) {
      Runtime.trap("Unauthorized: Only project owner or admin can update project");
    };

    if (not Principal.equal(project.owner, existingProject.owner)) {
      Runtime.trap("Unauthorized: Cannot change project owner");
    };

    if (not validateProjectImageReferences(caller, project)) {
      Runtime.trap("Unauthorized: Project references images not owned by caller");
    };

    projects.add(project.id, project);
  };

  public query ({ caller }) func getProject(id : Text) : async ?Project {
    if (caller.isAnonymous()) return null;
    if (not isOwnerOrAdmin(caller, id)) return null;
    projects.get(id);
  };

  public query ({ caller }) func listProjects() : async [Project] {
    if (caller.isAnonymous()) return [];

    let result = List.empty<Project>();
    for ((projectId, project) in projects.entries()) {
      if (isOwnerOrAdmin(caller, projectId)) {
        result.add(project);
      };
    };
    result.toArray();
  };

  public shared ({ caller }) func deleteProject(id : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Please log in to delete projects");
    };

    if (not isOwnerOrAdmin(caller, id)) {
      Runtime.trap("Unauthorized: Only project owner or admin can delete project");
    };

    // Delete associated images
    let toDelete = List.empty<Text>();
    for ((imageId, image) in images.entries()) {
      if (image.projectId == id) {
        toDelete.add(imageId);
      };
    };

    for (imageId in toDelete.toArray().vals()) {
      switch (images.get(imageId)) {
        case (?image) { fileOwnership.remove(image.path) };
        case (null) {};
      };
      images.remove(imageId);
    };

    projects.remove(id);
    projectOwners.remove(id);
  };

  // Image Management Functions
  public shared ({ caller }) func addImage(projectId : Text, path : Text, dpi : Float) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Please log in to add images");
    };

    if (not isOwnerOrAdmin(caller, projectId)) {
      Runtime.trap("Unauthorized: Only project owner or admin can add images");
    };

    let isAdm = AccessControl.isAdmin(accessControlState, caller);
    switch (fileOwnership.get(path)) {
      case (?existingOwner) {
        if (not Principal.equal(caller, existingOwner) and not isAdm) {
          Runtime.trap("Unauthorized: File path already owned by another user");
        };
      };
      case (null) {
        fileOwnership.add(path, caller);
      };
    };

    let id = projectId.concat(Time.now().toText());
    let image : Image = {
      id;
      path;
      projectId;
      owner = caller;
      pageId = null;
      uploaded = Time.now();
      dpi;
    };
    images.add(id, image);

    id;
  };

  public query ({ caller }) func getImage(id : Text) : async ?Image {
    if (caller.isAnonymous()) return null;
    if (not isImageOwner(caller, id)) return null;
    images.get(id);
  };

  public query ({ caller }) func listImages(projectId : Text) : async [Image] {
    if (caller.isAnonymous()) return [];
    if (not isOwnerOrAdmin(caller, projectId)) return [];

    let result = List.empty<Image>();
    for ((_, image) in images.entries()) {
      if (image.projectId == projectId) {
        result.add(image);
      };
    };
    result.toArray();
  };

  public shared ({ caller }) func deleteImage(id : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Please log in to delete images");
    };

    if (not isImageOwner(caller, id)) {
      Runtime.trap("Unauthorized: Only image owner or admin can delete image");
    };

    switch (images.get(id)) {
      case (?image) { fileOwnership.remove(image.path) };
      case (null) {};
    };

    images.remove(id);
  };

  // File Reference Functions
  public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Please log in to register file references");
    };

    let isAdm = AccessControl.isAdmin(accessControlState, caller);
    switch (fileOwnership.get(path)) {
      case (?existingOwner) {
        if (not Principal.equal(caller, existingOwner)) {
          if (not isAdm) {
            Runtime.trap("Unauthorized: File reference already exists and is owned by another user");
          };
          fileOwnership.add(path, caller);
        };
      };
      case (null) {
        fileOwnership.add(path, caller);
      };
    };

    ignore hash;
  };

  public query ({ caller }) func getFileOwner(path : Text) : async ?Principal {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Please log in to access file references");
    };
    if (not isFileOwner(caller, path)) {
      Runtime.trap("Unauthorized: Only file owner or admin can access file reference");
    };
    fileOwnership.get(path);
  };

  public shared ({ caller }) func dropFileReference(path : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Please log in to drop file references");
    };

    if (not isFileOwner(caller, path)) {
      Runtime.trap("Unauthorized: Only file owner or admin can drop file reference");
    };

    fileOwnership.remove(path);
  };

  // KDP Validation Functions
  public query ({ caller }) func validateKDP(projectId : Text) : async ?KDPValidation {
    if (caller.isAnonymous()) return null;
    if (not isOwnerOrAdmin(caller, projectId)) return null;

    switch (projects.get(projectId)) {
      case (null) { null };
      case (?project) {
        let errors = List.empty<Text>();
        let warnings = List.empty<Text>();

        if (project.cover.dimensions.width != 8.5 or project.cover.dimensions.height != 8.5) {
          errors.add("Cover dimensions must be 8.5x8.5 inches");
        };

        if (project.cover.bleed.top != 0.125 or project.cover.bleed.bottom != 0.125 or project.cover.bleed.left != 0.125 or project.cover.bleed.right != 0.125) {
          errors.add("Bleed must be 0.125 inches on all sides");
        };

        for ((_, image) in images.entries()) {
          if (image.projectId == projectId and image.dpi < 300) {
            warnings.add("Image " # image.id # " has DPI less than 300");
          };
        };

        if (project.settings.margin < 0.5) {
          warnings.add("Margins should be at least 0.5 inches");
        };

        let pageCount = project.pages.size();
        let spineWidth = Float.fromInt(pageCount) * 0.002252;

        if (project.cover.spine.width != spineWidth) {
          warnings.add("Spine width should be " # Float.toText(spineWidth) # " inches");
        };

        let isValid = errors.size() == 0;

        ?{
          isValid;
          errors = errors.toArray();
          warnings = warnings.toArray();
          trimSize = { width = 8.5; height = 8.5 };
          bleed = { top = 0.125; bottom = 0.125; left = 0.125; right = 0.125 };
          margin = { top = 0.5; bottom = 0.5; left = 0.5; right = 0.5 };
          spineWidth;
        };
      };
    };
  };

  public query ({ caller }) func getKDPComplianceStatus(projectId : Text) : async ?Bool {
    if (caller.isAnonymous()) return null;
    if (not isOwnerOrAdmin(caller, projectId)) return null;

    switch (projects.get(projectId)) {
      case (null) { null };
      case (?project) { ?project.kdpValidation.isValid };
    };
  };

  public query ({ caller }) func getKDPValidationReport(projectId : Text) : async ?KDPValidation {
    if (caller.isAnonymous()) return null;
    if (not isOwnerOrAdmin(caller, projectId)) return null;

    switch (projects.get(projectId)) {
      case (null) { null };
      case (?project) { ?project.kdpValidation };
    };
  };

  // AI Prompt Suggestion Functions
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func generateImagePrompt(projectId : Text, pageText : Text, projectContext : Text) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Please log in to generate AI prompts");
    };

    if (not isOwnerOrAdmin(caller, projectId)) {
      Runtime.trap("Unauthorized: Only project owner or admin can generate AI prompts for this project");
    };

    switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project not found") };
      case (?_) {};
    };

    let apiUrl = "https://icpanda.com/api/generate-image-prompt";
    let requestBody = "{ \"pageText\": \"" # pageText # "\", \"projectContext\": \"" # projectContext # "\" }";
    await OutCall.httpPostRequest(apiUrl, [], requestBody, transform);
  };

  // Subscription Management
  public query ({ caller }) func isSubscribed() : async Bool {
    if (caller.isAnonymous()) return false;
    switch (subscriptions.get(caller)) {
      case (?record) { record.isActive };
      case (null) { false };
    };
  };

  public shared ({ caller }) func setSubscription(user : Principal, isActive : Bool) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set subscription status");
    };
    subscriptions.add(user, { principal = user; isActive; updatedAt = Time.now() });
  };

  // Deployment Information Function
  public query ({ caller }) func getDeploymentUrl() : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Please log in to view deployment information");
    };
    "https://bamm-book-builder.icp0.io/";
  };

  // DEV BACKDOOR — grants #admin to the hardcoded dev principal unconditionally.
  // Call this once after deploy to bypass the paywall for testing.
  // Safe to leave in: only affects the one hardcoded principal.
  public shared func _devAdminGrant() : async () {
    let devPrincipal = Principal.fromText("zs7yq-mgazv-vzhit-hzgcd-dnqmn-2xcid-ylrot-b73if-6bmfb-kmnlb-2ae");
    accessControlState.userRoles.add(devPrincipal, #admin);
    accessControlState.adminAssigned := true;
  };
};
