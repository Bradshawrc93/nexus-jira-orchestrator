"use server";

import { jiraClient } from "@/lib/jira-client";

export async function moveIssueToSprint(issueKey: string, sprintId: number) {
  try {
    await jiraClient.moveIssueToSprint(issueKey, sprintId);
    return { success: true };
  } catch (error) {
    console.error("Failed to move issue to sprint:", error);
    return { success: false, error: String(error) };
  }
}

export async function getSprintIssues(sprintId: number) {
    try {
        const issues = await jiraClient.getSprintIssues(sprintId);
        return issues;
    } catch (error) {
        console.error("Failed to fetch sprint issues:", error);
        return [];
    }
}

