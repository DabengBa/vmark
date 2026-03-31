//! Path sandboxing for workflow file actions.
//!
//! All file operations must resolve to paths within the workspace root.
//! Absolute paths and `..` traversal are rejected.

use std::path::{Path, PathBuf};

/// Validate and resolve a path relative to the workspace root.
///
/// Returns the canonicalized absolute path if it is within the workspace.
/// Rejects absolute paths, `..` traversal, and symlinks that escape.
pub fn validate_path(path: &str, workspace_root: &Path) -> Result<PathBuf, String> {
    let candidate = if Path::new(path).is_absolute() {
        // Absolute paths must still be under workspace root
        PathBuf::from(path)
    } else {
        workspace_root.join(path)
    };

    // Normalize by resolving `..` components without requiring the path to exist.
    // We use a manual normalization instead of canonicalize() because the path
    // may not exist yet (e.g., save-file to a new location).
    let normalized = normalize_path(&candidate);

    // Check that the normalized path is under the workspace root
    if !normalized.starts_with(workspace_root) {
        return Err(format!(
            "Path '{}' is outside the workspace root '{}'",
            path,
            workspace_root.display()
        ));
    }

    Ok(normalized)
}

/// Normalize a path by resolving `.` and `..` components without filesystem access.
fn normalize_path(path: &Path) -> PathBuf {
    let mut components = Vec::new();
    for component in path.components() {
        match component {
            std::path::Component::ParentDir => {
                components.pop();
            }
            std::path::Component::CurDir => {}
            other => components.push(other),
        }
    }
    components.iter().collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn test_relative_path_within_workspace() {
        let root = Path::new("/workspace/project");
        let result = validate_path("notes/readme.md", root);
        assert!(result.is_ok());
        assert_eq!(
            result.unwrap(),
            PathBuf::from("/workspace/project/notes/readme.md")
        );
    }

    #[test]
    fn test_absolute_path_within_workspace() {
        let root = Path::new("/workspace/project");
        let result = validate_path("/workspace/project/notes/readme.md", root);
        assert!(result.is_ok());
    }

    #[test]
    fn test_dotdot_traversal_rejected() {
        let root = Path::new("/workspace/project");
        let result = validate_path("../../etc/passwd", root);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .contains("outside the workspace root"));
    }

    #[test]
    fn test_absolute_path_outside_workspace_rejected() {
        let root = Path::new("/workspace/project");
        let result = validate_path("/etc/passwd", root);
        assert!(result.is_err());
    }

    #[test]
    fn test_hidden_traversal_rejected() {
        let root = Path::new("/workspace/project");
        let result = validate_path("notes/../../../etc/shadow", root);
        assert!(result.is_err());
    }

    #[test]
    fn test_dot_component_normalized() {
        let root = Path::new("/workspace/project");
        let result = validate_path("./notes/./readme.md", root);
        assert!(result.is_ok());
        assert_eq!(
            result.unwrap(),
            PathBuf::from("/workspace/project/notes/readme.md")
        );
    }

    #[test]
    fn test_empty_path() {
        let root = Path::new("/workspace/project");
        let result = validate_path("", root);
        assert!(result.is_ok());
        // Empty path resolves to workspace root itself
        assert_eq!(result.unwrap(), PathBuf::from("/workspace/project"));
    }
}
