export interface UISchema {
  component: string;
  props: Record<string, unknown>;
  status: 'loading' | 'success' | 'error';
}

export interface AgentState {
  messages: Array<{ role: string; content: string }>;
  uiSchema?: UISchema;
  currentStep: string;
}
