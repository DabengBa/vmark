import { useWorkflowApprovalStore } from "../workflowApprovalStore";
import type { ApprovalRequest } from "../workflowApprovalStore";

const mockRequest: ApprovalRequest = {
  executionId: "exec-1",
  stepId: "step-1",
  description: "Save changes to notes.md",
  files: [
    { path: "/workspace/notes.md", changeType: "modified", summary: "Added summary section" },
  ],
};

beforeEach(() => {
  useWorkflowApprovalStore.getState().reset();
});

describe("workflowApprovalStore", () => {
  it("initializes with no request and closed", () => {
    const state = useWorkflowApprovalStore.getState();
    expect(state.request).toBeNull();
    expect(state.isOpen).toBe(false);
  });

  it("shows approval request", () => {
    useWorkflowApprovalStore.getState().showApproval(mockRequest);
    const state = useWorkflowApprovalStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.request).toBe(mockRequest);
    expect(state.request!.stepId).toBe("step-1");
  });

  it("approve closes the dialog", () => {
    const store = useWorkflowApprovalStore.getState();
    store.showApproval(mockRequest);
    store.approve();
    expect(useWorkflowApprovalStore.getState().isOpen).toBe(false);
  });

  it("reject closes the dialog", () => {
    const store = useWorkflowApprovalStore.getState();
    store.showApproval(mockRequest);
    store.reject();
    expect(useWorkflowApprovalStore.getState().isOpen).toBe(false);
  });

  it("reset clears everything", () => {
    const store = useWorkflowApprovalStore.getState();
    store.showApproval(mockRequest);
    store.reset();
    const state = useWorkflowApprovalStore.getState();
    expect(state.request).toBeNull();
    expect(state.isOpen).toBe(false);
  });
});
