import { StateGraph, END } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";

interface Suggestion {
  issueKey: string;
  action: string;
  reason: string;
}

interface MeetingState {
  activeProjectKey: string;
  activeSprintId: string;
  activeTicketId: string | null;
  transcriptHistory: string[];
  suggestions: Suggestion[];
}

const stateChannels = {
  activeProjectKey: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
  activeSprintId: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
  activeTicketId: {
    value: (x: string | null, y: string | null) => y ?? x,
    default: () => null,
  },
  transcriptHistory: {
    value: (x: string[], y: string[]) => x.concat(y),
    default: () => [],
  },
  suggestions: {
    value: (x: Suggestion[], y: Suggestion[]) => x.concat(y),
    default: () => [],
  },
};

// 1. Extractor: Identifies Ticket Keys or keywords
async function extractorNode(state: MeetingState) {
  const lastTranscript = state.transcriptHistory[state.transcriptHistory.length - 1];
  const ticketMatch = lastTranscript.match(/[A-Z]+-\d+/);
  
  if (ticketMatch) {
    return { activeTicketId: ticketMatch[0] };
  }
  return {};
}

// 2. Contextualizer: Verifies if ticket is in Board Context
async function contextualizerNode(state: MeetingState) {
  // In a real app, this would query Jira or the local store
  // For now, we assume if it's found, it's valid if it starts with the project key
  if (state.activeTicketId && state.activeTicketId.startsWith(state.activeProjectKey)) {
    return { activeTicketId: state.activeTicketId };
  }
  return { activeTicketId: null };
}

// 3. Intent Analyzer: Maps verbs to Jira Transitions
async function intentAnalyzerNode(state: MeetingState) {
  const lastTranscript = state.transcriptHistory[state.transcriptHistory.length - 1].toLowerCase();
  
  if (!state.activeTicketId) return {};

  let suggestion: Suggestion | null = null;

  if (lastTranscript.includes("finished") || lastTranscript.includes("done") || lastTranscript.includes("completed")) {
    suggestion = {
      issueKey: state.activeTicketId,
      action: "Move to Done",
      reason: "User indicated completion",
    };
  } else if (lastTranscript.includes("blocked") || lastTranscript.includes("stuck")) {
    suggestion = {
      issueKey: state.activeTicketId,
      action: "Flag as Blocked",
      reason: "User mentioned being blocked",
    };
  } else if (lastTranscript.includes("starting") || lastTranscript.includes("working on")) {
    suggestion = {
      issueKey: state.activeTicketId,
      action: "Move to In Progress",
      reason: "User started work",
    };
  }

  if (suggestion) {
    return { suggestions: [suggestion] };
  }
  return {};
}

// 4. Validator: Cross-references intent with Jira's allowed transitions
async function validatorNode(state: MeetingState) {
  // Real logic would call Jira's /transitions API
  // Here we just pass through
  return {};
}

const workflow = new StateGraph<MeetingState>({
  // @ts-ignore
  channels: stateChannels,
})
  .addNode("extractor", extractorNode)
  .addNode("contextualizer", contextualizerNode)
  .addNode("intent_analyzer", intentAnalyzerNode)
  .addNode("validator", validatorNode)
  .addEdge("extractor", "contextualizer")
  .addEdge("contextualizer", "intent_analyzer")
  .addEdge("intent_analyzer", "validator")
  .addEdge("validator", END)
  .setEntryPoint("extractor");

export const meetingGraph = workflow.compile();

