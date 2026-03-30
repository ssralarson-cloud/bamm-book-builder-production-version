import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import List "mo:base/List";
import Registry "blob-storage/registry";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import AccessControl "authorization/access-control";
import BlobStorage "blob-storage/Mixin";
import OutCall "http-outcalls/outcall";
import Nat "mo:base/Nat";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();

  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

  var projects : OrderedMap.Map<Text, Project> = textMap.empty();
  var images : OrderedMap.Map<Text, Image> = textMap.empty();
  var userProfiles = principalMap.empty<UserProfile>();
  var fileOwnership = textMap.empty<Principal>();
  var projectOwners = textMap.empty<Principal>();
  var nextProjectId = 0;

  let registry = Registry.new();
  include BlobStorage(registry);

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

  // Helper: Auto-register user if not already registered
  private func ensureUser(caller : Principal) {
    let currentRole = AccessControl.getUserRole(accessControlState, caller);
    switch (currentRole) {
      case (#guest) {
        // Auto-register as user
        AccessControl.initialize(accessControlState, caller);
        Debug.print("Auto-registered user: " # Principal.toText(caller));
      };
      case (_) {
        // Already registered as user or admin
      };
    };
  };

  // Helper: Check if user is registered internally
  private func isUserInternal(caller : Principal) : Bool {
    let currentRole = AccessControl.getUserRole(accessControlState, caller);
    switch (currentRole) {
      case (#guest) { false };
      case (_) { true };
    };
  };

  // Helper: Register project ownership in stable storage
  private func registerProjectOwner(projectId : Text, owner : Principal) {
    projectOwners := textMap.put(projectOwners, projectId, owner);
    Debug.print("Registered project owner: " # projectId # " -> " # Principal.toText(owner));
  };

  // Helper: Check if caller is owner or admin for a project
  private func isOwnerOrAdmin(caller : Principal, projectId : Text) : Bool {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (isAdmin) {
      return true;
    };

    switch (textMap.get(projectOwners, projectId)) {
      case (?owner) { Principal.equal(caller, owner) };
      case (null) {
        // Fallback: check project record
        switch (textMap.get(projects, projectId)) {
          case (?project) { Principal.equal(caller, project.owner) };
          case (null) { false };
        };
      };
    };
  };

  // Helper function to check image ownership
  private func isImageOwner(caller : Principal, imageId : Text) : Bool {
    switch (textMap.get(images, imageId)) {
      case (null) { false };
      case (?image) {
        Principal.equal(caller, image.owner) or AccessControl.isAdmin(accessControlState, caller);
      };
    };
  };

  // Helper function to check file reference ownership
  private func isFileOwner(caller : Principal, path : Text) : Bool {
    switch (textMap.get(fileOwnership, path)) {
      case (null) { false };
      case (?owner) {
        Principal.equal(caller, owner) or AccessControl.isAdmin(accessControlState, caller);
      };
    };
  };

  // Helper function to validate image references in project
  private func validateProjectImageReferences(caller : Principal, project : Project) : Bool {
    // Check cover images
    switch (project.cover.front.imageUrl) {
      case (?imageId) {
        if (not isImageOwner(caller, imageId)) {
          return false;
        };
      };
      case (null) {};
    };

    switch (project.cover.back.imageUrl) {
      case (?imageId) {
        if (not isImageOwner(caller, imageId)) {
          return false;
        };
      };
      case (null) {};
    };

    // Check page images
    for (page in project.pages.vals()) {
      switch (page.imageUrl) {
        case (?imageId) {
          if (not isImageOwner(caller, imageId)) {
            return false;
          };
        };
        case (null) {};
      };
    };

    true;
  };

  // Access Control Functions
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Only admins can assign roles");
    };
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (Principal.isAnonymous(caller)) {
      return null;
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Unauthorized: Anonymous users cannot access profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Unauthorized: Anonymous users cannot save profiles");
    };
    // Ensure user is registered
    ensureUser(caller);
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  // Check if caller can create projects (auto-registers if authenticated)
  private func canCreateProject(caller : Principal) : Bool {
    if (Principal.isAnonymous(caller)) {
      return false;
    };
    // Auto-register authenticated users
    ensureUser(caller);
    // Authenticated users can always create projects
    true;
  };

  // Project Management Functions
  public shared ({ caller }) func createProject(title : Text) : async Nat {
    Debug.print("createProject called by: " # Principal.toText(caller));

    // Check if caller is anonymous
    if (Principal.isAnonymous(caller)) {
      Debug.print("createProject: Anonymous caller rejected");
      Debug.trap("Unauthorized: Please log in with Internet Identity to create projects");
    };

    // Call canCreateProject to ensure user registration
    if (not canCreateProject(caller)) {
      Debug.print("createProject: canCreateProject returned false");
      Debug.trap("Unauthorized: Cannot create project");
    };

    Debug.print("createProject: User registered and authorized, creating project");

    // Create the project
    let id = nextProjectId;
    nextProjectId += 1;

    let project : Project = {
      id = Nat.toText(id);
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
    projects := textMap.put(projects, Nat.toText(id), project);

    // Register project ownership immediately in stable storage
    registerProjectOwner(Nat.toText(id), caller);
    Debug.print("createProject: Project created and ownership registered for: " # Nat.toText(id));

    id;
  };

  public shared ({ caller }) func updateProject(project : Project) : async () {
    Debug.print("updateProject called for project: " # project.id # " by: " # Principal.toText(caller));

    // Block anonymous users
    if (Principal.isAnonymous(caller)) {
      Debug.print("updateProject: Anonymous caller rejected");
      Debug.trap("Unauthorized: Please log in with Internet Identity to update projects");
    };

    // Verify project exists and get existing project
    let existingProject = switch (textMap.get(projects, project.id)) {
      case (null) {
        Debug.print("updateProject: Project not found");
        Debug.trap("Project not found");
      };
      case (?p) { p };
    };

    // Verify ownership using isOwnerOrAdmin
    if (not isOwnerOrAdmin(caller, project.id)) {
      Debug.print("updateProject: Ownership verification failed");
      Debug.trap("Unauthorized: Only project owner or admin can update project");
    };

    Debug.print("updateProject: Ownership verified");

    // Prevent changing project owner
    if (not Principal.equal(project.owner, existingProject.owner)) {
      Debug.trap("Unauthorized: Cannot change project owner");
    };

    // Validate that all referenced images belong to the caller or are accessible by admin
    if (not validateProjectImageReferences(caller, project)) {
      Debug.trap("Unauthorized: Project references images not owned by caller");
    };

    projects := textMap.put(projects, project.id, project);
    Debug.print("updateProject: Project updated successfully");
  };

  public query ({ caller }) func getProject(id : Text) : async ?Project {
    // Block anonymous users
    if (Principal.isAnonymous(caller)) {
      return null;
    };

    // Verify ownership using isOwnerOrAdmin
    if (not isOwnerOrAdmin(caller, id)) {
      return null;
    };

    textMap.get(projects, id);
  };

  public query ({ caller }) func listProjects() : async [Project] {
    // Return empty list for anonymous users
    if (Principal.isAnonymous(caller)) {
      return [];
    };

    var list = List.nil<Project>();

    for ((projectId, project) in textMap.entries(projects)) {
      // Filter to only projects owned by caller or accessible by admin
      if (isOwnerOrAdmin(caller, projectId)) {
        list := List.push(project, list);
      };
    };
    List.toArray(list);
  };

  public shared ({ caller }) func deleteProject(id : Text) : async () {
    // Block anonymous users
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Unauthorized: Please log in with Internet Identity to delete projects");
    };

    if (not isOwnerOrAdmin(caller, id)) {
      Debug.trap("Unauthorized: Only project owner or admin can delete project");
    };

    // Delete associated images
    var imagesToDelete = List.nil<Text>();
    for ((imageId, image) in textMap.entries(images)) {
      if (image.projectId == id) {
        imagesToDelete := List.push(imageId, imagesToDelete);
      };
    };

    for (imageId in List.toArray(imagesToDelete).vals()) {
      // Clean up file ownership for each image
      switch (textMap.get(images, imageId)) {
        case (?image) {
          fileOwnership := textMap.delete(fileOwnership, image.path);
        };
        case (null) {};
      };
      images := textMap.delete(images, imageId);
    };

    projects := textMap.delete(projects, id);
    projectOwners := textMap.delete(projectOwners, id);
  };

  // Image Management Functions
  public shared ({ caller }) func addImage(projectId : Text, path : Text, dpi : Float) : async Text {
    // Block anonymous users
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Unauthorized: Please log in with Internet Identity to add images");
    };

    if (not isOwnerOrAdmin(caller, projectId)) {
      Debug.trap("Unauthorized: Only project owner or admin can add images");
    };

    // Check file ownership before creating image record
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    switch (textMap.get(fileOwnership, path)) {
      case (?existingOwner) {
        if (not Principal.equal(caller, existingOwner)) {
          if (not isAdmin) {
            Debug.trap("Unauthorized: File path already owned by another user");
          };
          // Admin can use files owned by others, but doesn't change ownership
        };
      };
      case (null) {
        // Register new file ownership
        fileOwnership := textMap.put(fileOwnership, path, caller);
      };
    };

    let id = Text.concat(projectId, Int.toText(Time.now()));
    let image : Image = {
      id;
      path;
      projectId;
      owner = caller;
      pageId = null;
      uploaded = Time.now();
      dpi;
    };
    images := textMap.put(images, id, image);

    id;
  };

  public query ({ caller }) func getImage(id : Text) : async ?Image {
    // Return null for anonymous users
    if (Principal.isAnonymous(caller)) {
      return null;
    };

    if (not isImageOwner(caller, id)) {
      return null;
    };
    textMap.get(images, id);
  };

  public query ({ caller }) func listImages(projectId : Text) : async [Image] {
    // Return empty list for anonymous users
    if (Principal.isAnonymous(caller)) {
      return [];
    };

    if (not isOwnerOrAdmin(caller, projectId)) {
      return [];
    };

    var list = List.nil<Image>();
    for ((_, image) in textMap.entries(images)) {
      if (image.projectId == projectId) {
        list := List.push(image, list);
      };
    };
    List.toArray(list);
  };

  public shared ({ caller }) func deleteImage(id : Text) : async () {
    // Block anonymous users
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Unauthorized: Please log in with Internet Identity to delete images");
    };

    if (not isImageOwner(caller, id)) {
      Debug.trap("Unauthorized: Only image owner or admin can delete image");
    };

    // Clean up file ownership when deleting image
    switch (textMap.get(images, id)) {
      case (?image) {
        fileOwnership := textMap.delete(fileOwnership, image.path);
      };
      case (null) {};
    };

    images := textMap.delete(images, id);
  };

  // File Reference Functions
  public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Unauthorized: Please log in with Internet Identity to register file references");
    };

    // Check if file already exists and verify ownership
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    switch (textMap.get(fileOwnership, path)) {
      case (?existingOwner) {
        if (not Principal.equal(caller, existingOwner)) {
          if (not isAdmin) {
            Debug.trap("Unauthorized: File reference already exists and is owned by another user");
          };
          // Admin can override ownership
          fileOwnership := textMap.put(fileOwnership, path, caller);
        };
      };
      case (null) {
        // New file, register ownership
        fileOwnership := textMap.put(fileOwnership, path, caller);
      };
    };

    Registry.add(registry, path, hash);
  };

  public query ({ caller }) func getFileReference(path : Text) : async Registry.FileReference {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Unauthorized: Please log in with Internet Identity to access file references");
    };

    if (not isFileOwner(caller, path)) {
      Debug.trap("Unauthorized: Only file owner or admin can access file reference");
    };

    Registry.get(registry, path);
  };

  public query ({ caller }) func listFileReferences() : async [Registry.FileReference] {
    // Return empty list for anonymous users
    if (Principal.isAnonymous(caller)) {
      return [];
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let allRefs = Registry.list(registry);

    // Filter to only show files owned by caller (unless admin)
    if (isAdmin) {
      return allRefs;
    };

    var list = List.nil<Registry.FileReference>();
    for (ref in allRefs.vals()) {
      if (isFileOwner(caller, ref.path)) {
        list := List.push(ref, list);
      };
    };
    List.toArray(list);
  };

  public shared ({ caller }) func dropFileReference(path : Text) : async () {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Unauthorized: Please log in with Internet Identity to drop file references");
    };

    if (not isFileOwner(caller, path)) {
      Debug.trap("Unauthorized: Only file owner or admin can drop file reference");
    };

    Registry.remove(registry, path);
    fileOwnership := textMap.delete(fileOwnership, path);
  };

  // KDP Validation Functions
  public query ({ caller }) func validateKDP(projectId : Text) : async ?KDPValidation {
    // Return null for anonymous users
    if (Principal.isAnonymous(caller)) {
      return null;
    };

    if (not isOwnerOrAdmin(caller, projectId)) {
      return null;
    };

    switch (textMap.get(projects, projectId)) {
      case (null) { null };
      case (?project) {
        var errors = List.nil<Text>();
        var warnings = List.nil<Text>();

        // Validate cover dimensions
        if (project.cover.dimensions.width != 8.5 or project.cover.dimensions.height != 8.5) {
          errors := List.push("Cover dimensions must be 8.5x8.5 inches", errors);
        };

        // Validate bleed
        if (project.cover.bleed.top != 0.125 or project.cover.bleed.bottom != 0.125 or project.cover.bleed.left != 0.125 or project.cover.bleed.right != 0.125) {
          errors := List.push("Bleed must be 0.125 inches on all sides", errors);
        };

        // Validate image DPI
        for ((_, image) in textMap.entries(images)) {
          if (image.projectId == projectId and image.dpi < 300) {
            warnings := List.push("Image " # image.id # " has DPI less than 300", warnings);
          };
        };

        // Validate margins
        if (project.settings.margin < 0.5) {
          warnings := List.push("Margins should be at least 0.5 inches", warnings);
        };

        // Calculate spine width
        let pageCount = project.pages.size();
        let spineWidth = Float.fromInt(pageCount) * 0.002252;

        // Validate spine width
        if (project.cover.spine.width != spineWidth) {
          warnings := List.push("Spine width should be " # Float.toText(spineWidth) # " inches", warnings);
        };

        let isValid = List.isNil(errors);

        let validation : KDPValidation = {
          isValid;
          errors = List.toArray(errors);
          warnings = List.toArray(warnings);
          trimSize = { width = 8.5; height = 8.5 };
          bleed = { top = 0.125; bottom = 0.125; left = 0.125; right = 0.125 };
          margin = { top = 0.5; bottom = 0.5; left = 0.5; right = 0.5 };
          spineWidth;
        };

        ?validation;
      };
    };
  };

  public query ({ caller }) func getKDPComplianceStatus(projectId : Text) : async ?Bool {
    // Return null for anonymous users
    if (Principal.isAnonymous(caller)) {
      return null;
    };

    if (not isOwnerOrAdmin(caller, projectId)) {
      return null;
    };

    switch (textMap.get(projects, projectId)) {
      case (null) { null };
      case (?project) { ?project.kdpValidation.isValid };
    };
  };

  public query ({ caller }) func getKDPValidationReport(projectId : Text) : async ?KDPValidation {
    // Return null for anonymous users
    if (Principal.isAnonymous(caller)) {
      return null;
    };

    if (not isOwnerOrAdmin(caller, projectId)) {
      return null;
    };

    switch (textMap.get(projects, projectId)) {
      case (null) { null };
      case (?project) { ?project.kdpValidation };
    };
  };

  // AI Prompt Suggestion Functions
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func generateImagePrompt(projectId : Text, pageText : Text, projectContext : Text) : async Text {
    Debug.print("generateImagePrompt called by: " # Principal.toText(caller) # " for project: " # projectId);

    // Block anonymous users
    if (Principal.isAnonymous(caller)) {
      Debug.print("generateImagePrompt: Anonymous caller rejected");
      Debug.trap("Unauthorized: Please log in with Internet Identity to generate AI prompts");
    };

    // Verify project ownership
    if (not isOwnerOrAdmin(caller, projectId)) {
      Debug.print("generateImagePrompt: Ownership verification failed");
      Debug.trap("Unauthorized: Only project owner or admin can generate AI prompts for this project");
    };

    // Verify project exists
    switch (textMap.get(projects, projectId)) {
      case (null) {
        Debug.print("generateImagePrompt: Project not found");
        Debug.trap("Project not found");
      };
      case (?_) {
        Debug.print("generateImagePrompt: Project verified, calling IC Panda API");
      };
    };

    let apiUrl = "https://icpanda.com/api/generate-image-prompt";
    let requestBody = "{ \"pageText\": \"" # pageText # "\", \"projectContext\": \"" # projectContext # "\" }";
    await OutCall.httpPostRequest(apiUrl, [], requestBody, transform);
  };

  // Deployment Information Function
  public query ({ caller }) func getDeploymentUrl() : async Text {
    // Block anonymous users - deployment info should only be accessible to authenticated users
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Unauthorized: Please log in with Internet Identity to view deployment information");
    };

    "https://bamm-book-builder.icp0.io/";
  };
};
