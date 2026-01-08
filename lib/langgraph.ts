import { StateGraph, END } from "@langchain/langgraph";
import { jiraClient } from "./jira-client";

export interface Suggestion {
  id?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  issueKey: string;
  action: string;
  reason: string;
  transitionId?: string;
}

export interface MeetingState {
  activeProjectKey: string;
  activeSprintId: string;
  activeTicketId: string | null;
  transcriptHistory: string[];
  suggestions: Suggestion[];
  currentTranscript?: string; // transient
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
  currentTranscript: {
    value: (x: string | undefined, y: string | undefined) => y,
    default: () => undefined,
  }
};

// 1. Extractor: Identifies Ticket Keys or keywords
async function extractorNode(state: MeetingState) {
  const current = state.currentTranscript || "";
  const ticketMatch = current.match(/([A-Z]+-\d+)/);
  
  if (ticketMatch) {
    return { activeTicketId: ticketMatch[1] };
  }
  // If no explicit ticket mentioned, maybe keep the previous one or clear it?
  // For now, let's keep the previous one if it exists, or just return empty to not change it.
  return {}; 
}

// 2. Contextualizer: Verifies if ticket is in Board Context
async function contextualizerNode(state: MeetingState) {
  if (!state.activeTicketId) return {};

  const current = state.currentTranscript || "";
  
  // Verify the ticket belongs to the active project (simple check)
  if (!state.activeTicketId.startsWith(state.activeProjectKey)) {
    // Hallucination Check: If ticket doesn't match project key
    const suggestion: Suggestion = {
      issueKey: state.activeTicketId,
      action: "⚠️ Unrecognized Ticket",
      reason: `Ticket ${state.activeTicketId} does not belong to project ${state.activeProjectKey}`,
    };
    // Return early with the warning suggestion, effectively stopping downstream intent analysis for this ticket
    return { 
      activeTicketId: null, 
      suggestions: [suggestion] 
    };
  }
  return { activeTicketId: state.activeTicketId };
}

// 3. Intent Analyzer: Maps verbs to Jira Transitions
async function intentAnalyzerNode(state: MeetingState) {
  const current = (state.currentTranscript || "").toLowerCase();
  const suggestions: Suggestion[] = [];
  
  // Vibe Check: Monitor meeting length (simulated check if transcript mentions wrapping up or time)
  // In a real scenario, we'd check timestamps. Here we check keywords for "time" or "long".
  if (current.includes("running late") || current.includes("time check") || current.includes("wrap up")) {
    suggestions.push({
      issueKey: "SYSTEM",
      action: "⚠️ Vibe Check",
      reason: "Meeting might be running long or requires wrap-up."
    });
  }

  // Hallucination Check for non-work related talk (Privacy Guard)
  // Simple keyword filter
  const nonWorkKeywords = ["lunch", "dinner", "weekend", "movie", "game"];
  if (nonWorkKeywords.some(kw => current.includes(kw))) {
    // We could either ignore it or flag it.
    // "Privacy Guard: A logic filter that redacts or ignores..."
    // Let's explicitly ignore by returning empty if no ticket is active
    if (!state.activeTicketId) return { suggestions }; 
  }

  if (!state.activeTicketId) return { suggestions };

  let targetStatusCategory = 0; // 2=ToDo, 3=InProgress, 4=Done
  let actionLabel = "";
  let reason = "";

  if (current.includes("finished") || current.includes("done") || current.includes("completed")) {
    targetStatusCategory = 4;
    actionLabel = "Move to Done";
    reason = "User indicated completion";
  } else if (current.includes("starting") || current.includes("working on") || current.includes("picked up")) {
    targetStatusCategory = 3;
    actionLabel = "Move to In Progress";
    reason = "User started work";
  } else if (current.includes("blocked") || current.includes("stuck")) {
    // Blocked isn't always a status change, but could be a flag. 
    // For simplicity, let's assume it moves to a "Blocked" status if it existed, or we just flag it.
    // The prompt says: 'Maps verbs ("blocked", "finished", "starting") to Jira Transitions.'
    // Let's assume there is a transition.
    actionLabel = "Flag as Blocked";
    reason = "User mentioned being blocked";
    // We'll need to find a transition that looks like "Block" or just leave it for the validator.
  }

  if (actionLabel) {
    return { 
      suggestions,
      _intent: { targetStatusCategory, actionLabel, reason }
    };
  }
  return { suggestions };
}

// 4. Validator: Cross-references intent with Jira's allowed transitions
async function validatorNode(state: any) { // Using any to access _intent
  const intent = state._intent;
  if (!intent || !state.activeTicketId) return {};

  try {
    const transitions = await jiraClient.getTransitions(state.activeTicketId);
    
    // Find a matching transition
    // 1. Try to match by status category if we have one
    let match = transitions.find(t => {
      if (intent.targetStatusCategory) {
        return t.to.statusCategory.id === intent.targetStatusCategory;
      }
      return false;
    });

    // 2. If no category match, try fuzzy name match
    if (!match) {
      match = transitions.find(t => 
        t.name.toLowerCase().includes(intent.actionLabel.toLowerCase()) ||
        t.to.name.toLowerCase().includes(intent.actionLabel.toLowerCase())
      );
    }

    if (match) {
      const suggestion: Suggestion = {
        issueKey: state.activeTicketId,
        action: `${intent.actionLabel} (-> ${match.to.name})`,
        reason: intent.reason,
        transitionId: match.id
      };
      return { suggestions: [suggestion] };
    }
  } catch (error) {
    console.error("Failed to validate transition:", error);
  }

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
