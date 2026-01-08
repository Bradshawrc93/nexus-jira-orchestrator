import { create } from 'zustand';
import { JiraProject, JiraSprint, JiraIssue } from './jira-client';
import { Suggestion } from './langgraph';

interface OrchestratorState {
  projects: JiraProject[];
  activeProjectKey: string | null;
  activeBoardId: number | null;
  activeSprint: JiraSprint | null;
  allSprints: JiraSprint[];
  activeCeremonyType: 'standup' | 'planning' | 'review' | null;
  issues: JiraIssue[]; // Active sprint issues
  backlogIssues: JiraIssue[]; // Backlog for planning
  activeTicketId: string | null;
  suggestions: Suggestion[];
  isLoading: boolean;
  error: string | null;

  setProjects: (projects: JiraProject[]) => void;
  setActiveProject: (projectKey: string) => void;
  setActiveBoardId: (boardId: number | null) => void;
  setActiveSprint: (sprint: JiraSprint | null) => void;
  setAllSprints: (sprints: JiraSprint[]) => void;
  setActiveCeremonyType: (type: 'standup' | 'planning' | 'review' | null) => void;
  setIssues: (issues: JiraIssue[]) => void;
  setBacklogIssues: (issues: JiraIssue[]) => void;
  setActiveTicket: (ticketId: string | null) => void;
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'status'>) => void;
  updateSuggestionStatus: (id: string, status: 'accepted' | 'rejected') => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOrchestratorStore = create<OrchestratorState>((set) => ({
  projects: [],
  activeProjectKey: null,
  activeBoardId: null,
  activeSprint: null,
  allSprints: [],
  activeCeremonyType: null,
  issues: [],
  backlogIssues: [],
  activeTicketId: null,
  suggestions: [],
  isLoading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  setActiveProject: (projectKey) => set({ activeProjectKey: projectKey }),
  setActiveBoardId: (boardId) => set({ activeBoardId: boardId }),
  setActiveSprint: (sprint) => set({ activeSprint: sprint }),
  setAllSprints: (sprints) => set({ allSprints: sprints }),
  setActiveCeremonyType: (type) => set({ activeCeremonyType: type }),
  setIssues: (issues) => set({ issues }),
  setBacklogIssues: (issues) => set({ backlogIssues: issues }),
  setActiveTicket: (ticketId) => set({ activeTicketId: ticketId }),
  
  addSuggestion: (suggestion) => set((state) => ({
    suggestions: [
      ...state.suggestions,
      { ...suggestion, id: Math.random().toString(36).substr(2, 9), status: 'pending' }
    ]
  })),

  updateSuggestionStatus: (id, status) => set((state) => ({
    suggestions: state.suggestions.map((s) => s.id === id ? { ...s, status } : s)
  })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));