
import { AgentState, Memory, Thought } from '../types';

const STORAGE_KEYS = {
  STATE: 'aether_agent_state',
  MEMORIES: 'aether_agent_memories',
  THOUGHTS: 'aether_agent_thoughts',
};

export class PersistenceService {
  static generateId(content: string): string {
    // Simple hash for content-based unique ID
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36) + Date.now().toString(36);
  }

  static saveState(state: Partial<AgentState>) {
    try {
      localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save state", e);
    }
  }

  static loadState(): Partial<AgentState> | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Failed to load state", e);
      return null;
    }
  }

  static saveMemories(memories: Memory[]) {
    // Deduplicate by content
    const uniqueMemories = Array.from(new Map(memories.map(m => [m.content, m])).values());
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(uniqueMemories));
  }

  static loadMemories(): Memory[] {
    const data = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    return data ? JSON.parse(data) : [];
  }

  static saveThoughts(thoughts: Thought[]) {
    // Deduplicate by content
    const uniqueThoughts = Array.from(new Map(thoughts.map(t => [t.content, t])).values());
    // Only save recent thoughts to avoid localStorage limits
    localStorage.setItem(STORAGE_KEYS.THOUGHTS, JSON.stringify(uniqueThoughts.slice(0, 100)));
  }

  static loadThoughts(): Thought[] {
    const data = localStorage.getItem(STORAGE_KEYS.THOUGHTS);
    return data ? JSON.parse(data) : [];
  }

  static clearAll() {
    localStorage.removeItem(STORAGE_KEYS.STATE);
    localStorage.removeItem(STORAGE_KEYS.MEMORIES);
    localStorage.removeItem(STORAGE_KEYS.THOUGHTS);
    window.location.reload();
  }
}
