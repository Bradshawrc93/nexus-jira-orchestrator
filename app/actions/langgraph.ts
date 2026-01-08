"use server";

import { meetingGraph, MeetingState, Suggestion } from "@/lib/langgraph";
import { jiraClient } from "@/lib/jira-client";

export async function processMeetingTranscript(
  transcript: string,
  currentState: {
    activeProjectKey: string;
    activeSprintId: string;
    activeTicketId: string | null;
    transcriptHistory: string[];
  }
) {
  // @ts-ignore
  const result = await meetingGraph.invoke({
    ...currentState,
    currentTranscript: transcript,
    suggestions: [], // Start with empty suggestions for this run
  });

  // Extract only the new suggestions from this run
  // The graph accumulates suggestions in the state if we used a reducer that concatenates.
  // But here we invoked it with the current state.
  // The result will contain the final state.
  // We want to return the suggestions generated in this turn.
  
  // Note: result.suggestions will contain the concatenated list if we passed history,
  // but we passed empty list for suggestions in input?
  // The state channel 'suggestions' concatenates: (x, y) => x.concat(y).
  // If we passed [], result.suggestions will be [new_suggestion].
  
  return {
    activeTicketId: result.activeTicketId,
    suggestions: result.suggestions as Suggestion[],
  };
}

export async function applySuggestion(issueKey: string, transitionId: string) {
  try {
    await jiraClient.transitionIssue(issueKey, transitionId);
    return { success: true };
  } catch (error) {
    console.error("Failed to apply suggestion:", error);
    return { success: false, error: String(error) };
  }
}

