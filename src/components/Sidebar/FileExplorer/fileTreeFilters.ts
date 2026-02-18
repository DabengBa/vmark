import type { DirectoryEntry } from "./types";

export interface FileTreeFilterOptions {
  showHidden: boolean;
  showAllFiles: boolean;
  excludeFolders: string[];
  filter: (name: string, isFolder: boolean) => boolean;
}

export function shouldIncludeEntry(
  entry: DirectoryEntry,
  options: FileTreeFilterOptions
): boolean {
  if (!options.showHidden && entry.isHidden) return false;
  if (entry.isDirectory && options.excludeFolders.includes(entry.name)) return false;
  if (options.showAllFiles) return true;
  return options.filter(entry.name, entry.isDirectory);
}
