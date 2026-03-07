
export enum AgentStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  EXECUTING = 'EXECUTING',
  LEARNING = 'LEARNING',
  ERROR = 'ERROR',
  LIVE = 'LIVE',
  EDITING = 'EDITING'
}

export type AppView = 'DASHBOARD' | 'LIVE_TERMINAL' | 'IMAGE_STUDIO' | 'MEMORIES' | 'SAFETY';

export interface Memory {
  id: string;
  type: 'fact' | 'instruction' | 'observation' | 'insight';
  content: string;
  timestamp: number;
  importance: number;
  isLocked?: boolean;
}

export interface Thought {
  id: string;
  timestamp: number;
  content: string;
  type: 'plan' | 'observation' | 'conclusion' | 'error';
}

export interface Task {
  id: string;
  goal: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  subtasks: string[];
  results?: string;
}

export interface AgentState {
  status: AgentStatus;
  memories: Memory[];
  thoughts: Thought[];
  currentTask: Task | null;
  history: {role: 'user' | 'model', content: string}[];
  view: AppView;
}
