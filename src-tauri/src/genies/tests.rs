//! Tests for the genies module.

use super::parsing::parse_genie;
use super::scanning::{scan_genies_dir, scan_genies_with_titles};
use super::types::GenieEntry;
use std::collections::HashMap;
use std::fs;

#[test]
fn test_parse_genie_with_frontmatter() {
    let content = r#"---
name: improve-writing
description: Improve clarity and flow
scope: selection
category: writing
---

You are an expert editor. Improve the following text:

{{content}}"#;

    let result = parse_genie(content, "improve-writing.md").unwrap();
    // Name always comes from filename, not frontmatter
    assert_eq!(result.metadata.name, "improve-writing");
    assert_eq!(result.metadata.description, "Improve clarity and flow");
    assert_eq!(result.metadata.scope, "selection");
    assert_eq!(result.metadata.category.as_deref(), Some("writing"));
    assert_eq!(result.metadata.action, None); // no action field -> defaults to None
    assert!(result.template.contains("{{content}}"));
}

#[test]
fn test_parse_genie_with_context() {
    let content = "---\nname: fit\nscope: selection\ncontext: 1\n---\n\n{{context}}\n\n{{content}}";
    let result = parse_genie(content, "fit.md").unwrap();
    assert_eq!(result.metadata.context, Some(1));
}

#[test]
fn test_parse_genie_context_clamped_to_2() {
    let content = "---\nname: fit\nscope: selection\ncontext: 5\n---\n\nTemplate";
    let result = parse_genie(content, "fit.md").unwrap();
    assert_eq!(result.metadata.context, None); // >2 is filtered out
}

#[test]
fn test_parse_genie_no_context_field() {
    let content = "---\nname: basic\nscope: selection\n---\n\n{{content}}";
    let result = parse_genie(content, "basic.md").unwrap();
    assert_eq!(result.metadata.context, None);
}

#[test]
fn test_parse_genie_with_action_insert() {
    let content = "---\nname: continue\nscope: block\naction: insert\n---\n\nContinue writing.\n\n{{content}}";
    let result = parse_genie(content, "continue.md").unwrap();
    assert_eq!(result.metadata.name, "continue"); // from filename
    assert_eq!(result.metadata.scope, "block");
    assert_eq!(result.metadata.action.as_deref(), Some("insert"));
}

#[test]
fn test_parse_genie_with_invalid_action() {
    let content = "---\nname: typo\nscope: selection\naction: insret\n---\n\nTemplate";
    let result = parse_genie(content, "typo.md").unwrap();
    assert_eq!(result.metadata.action, None); // invalid value ignored
}

#[test]
fn test_parse_genie_without_frontmatter() {
    let content = "Just a plain genie template\n\n{{content}}";
    let result = parse_genie(content, "test-genie.md").unwrap();
    assert_eq!(result.metadata.name, "test-genie");
    assert_eq!(result.metadata.scope, "selection");
    assert!(result.template.contains("{{content}}"));
}

#[test]
fn test_parse_genie_with_bom() {
    let content = "\u{FEFF}---\nname: bom-test\ndescription: Has BOM\nscope: document\n---\n\nTemplate here";
    let result = parse_genie(content, "bom-test.md").unwrap();
    assert_eq!(result.metadata.name, "bom-test");
    assert_eq!(result.metadata.scope, "document");
}

#[test]
fn test_parse_genie_missing_closing() {
    let content = "---\nname: broken\nno closing fence";
    let result = parse_genie(content, "broken.md");
    assert!(result.is_err());
}

#[test]
fn test_no_collision_same_name_different_category() {
    use std::io::Write as _;
    let tmp = tempfile::tempdir().unwrap();
    let base = tmp.path();

    // Create two files with the same stem in different subdirs
    let writing = base.join("writing");
    let coding = base.join("coding");
    fs::create_dir_all(&writing).unwrap();
    fs::create_dir_all(&coding).unwrap();

    let mut f1 = fs::File::create(writing.join("improve.md")).unwrap();
    writeln!(f1, "---\nname: improve-writing\nscope: selection\n---\ntemplate1").unwrap();

    let mut f2 = fs::File::create(coding.join("improve.md")).unwrap();
    writeln!(f2, "---\nname: improve-code\nscope: selection\n---\ntemplate2").unwrap();

    let mut entries: HashMap<String, GenieEntry> = HashMap::new();
    scan_genies_dir(base, base, "global", &mut entries);

    // Both should be present (keyed by relative path, not bare stem)
    assert_eq!(entries.len(), 2);
    assert!(entries.values().any(|e| e.name == "improve" && e.category.as_deref() == Some("writing")));
    assert!(entries.values().any(|e| e.name == "improve" && e.category.as_deref() == Some("coding")));
}

#[test]
fn test_parse_genie_name_from_path_with_directory() {
    // Name is derived from filename even when path includes directories.
    let content = "---\nscope: document\n---\nSafe content";
    let result = parse_genie(content, "/some/dir/canonical-test.md").unwrap();
    assert_eq!(result.metadata.name, "canonical-test");
}

#[test]
fn test_parse_genie_description_strips_quotes() {
    let content = "---\nname: \"quoted name\"\ndescription: 'single quoted'\nscope: selection\n---\n\nTemplate";
    let result = parse_genie(content, "test.md").unwrap();
    // Name comes from filename "test.md" → "test", NOT from frontmatter "quoted name"
    assert_eq!(result.metadata.name, "test");
    assert_eq!(result.metadata.description, "single quoted");
}

#[test]
fn test_scan_genies_with_titles_uses_filename_not_frontmatter() {
    use std::io::Write as _;
    let tmp = tempfile::tempdir().unwrap();
    let base = tmp.path();

    // Create a genie with frontmatter name different from filename
    let editing = base.join("editing");
    fs::create_dir_all(&editing).unwrap();
    let mut f1 = fs::File::create(editing.join("enhance.md")).unwrap();
    writeln!(f1, "---\nname: old-name\ndescription: test\nscope: selection\n---\ntemplate").unwrap();

    // Root-level genie without frontmatter
    let mut f2 = fs::File::create(base.join("quick-fix.md")).unwrap();
    writeln!(f2, "Just a plain template").unwrap();

    let entries = scan_genies_with_titles(base);

    // Should have 2 entries
    assert_eq!(entries.len(), 2);

    // Titles come from filenames, not frontmatter
    let titles: Vec<&str> = entries.iter().map(|e| e.title.as_str()).collect();
    assert!(titles.contains(&"enhance"), "expected 'enhance' from filename, got {:?}", titles);
    assert!(titles.contains(&"quick-fix"), "expected 'quick-fix' from filename, got {:?}", titles);

    // Category from subdirectory
    let enhance = entries.iter().find(|e| e.title == "enhance").unwrap();
    assert_eq!(enhance.category.as_deref(), Some("editing"));

    // Root-level has no category
    let quick_fix = entries.iter().find(|e| e.title == "quick-fix").unwrap();
    assert_eq!(quick_fix.category, None);

    // Entries sorted by title
    assert!(entries[0].title <= entries[1].title, "entries not sorted");
}

#[test]
fn test_parse_genie_name_from_filename_not_frontmatter() {
    // Frontmatter says "old-name" but file is named "new-name.md"
    let content = "---\nname: old-name\ndescription: Renamed genie\nscope: selection\n---\n\nTemplate";
    let result = parse_genie(content, "/path/to/new-name.md").unwrap();
    assert_eq!(result.metadata.name, "new-name");
}
