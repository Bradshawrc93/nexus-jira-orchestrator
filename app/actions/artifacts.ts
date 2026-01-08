"use server";

import { Suggestion } from "@/lib/langgraph";

export interface MeetingArtifacts {
  summary: string;
  actionItems: string[];
  decisions: string[];
  executiveDigest: {
    sentiment: "On Track" | "At Risk" | "Off Track";
    reason: string;
  };
}

export async function generateMeetingArtifacts(
  transcriptHistory: string[],
  suggestions: any[] // Using any to avoid type issues with Suggestion interface mismatch
): Promise<MeetingArtifacts> {
  // In a real app, this would be a call to Claude/GPT-4 with the full transcript
  // For now, we'll mock the generation based on what we have.

  const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted');
  const rejectedSuggestions = suggestions.filter(s => s.status === 'rejected');

  const summary = `
## Meeting Summary
The team discussed ${transcriptHistory.length} items. 
- ${acceptedSuggestions.length} updates were approved.
- ${rejectedSuggestions.length} suggestions were dismissed.
  `.trim();

  const actionItems = acceptedSuggestions.map(s => `Update ${s.issueKey}: ${s.action}`);
  
  // Simple sentiment logic
  const sentiment = acceptedSuggestions.length > rejectedSuggestions.length ? "On Track" : "At Risk";
  const reason = sentiment === "On Track" 
    ? "Team is actively updating tickets and progressing." 
    : "Multiple suggestions were rejected or discussion stalled.";

  return {
    summary,
    actionItems,
    decisions: [
      "Sprint goals reviewed.",
      `Commited to ${acceptedSuggestions.length} Jira updates.`
    ],
    executiveDigest: {
      sentiment,
      reason
    }
  };
}

