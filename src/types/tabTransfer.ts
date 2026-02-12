export interface TabTransferPayload {
  tabId: string;
  title: string;
  filePath: string | null;
  content: string;
  savedContent: string;
  isDirty: boolean;
  workspaceRoot: string | null;
}

export interface TabDropPreviewEvent {
  sourceWindowLabel: string;
  targetWindowLabel: string | null;
}
