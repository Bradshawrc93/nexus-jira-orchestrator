"use server";

import { jiraClient, JiraProject, JiraBoard, JiraSprint, JiraIssue } from "@/lib/jira-client";

export async function getProjects(): Promise<JiraProject[]> {
  try {
    return await jiraClient.getProjects();
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }
}

export async function getProjectContext(projectKey: string) {
  try {
    const boards = await jiraClient.getBoards(projectKey);
    if (boards.length === 0) return { sprint: null, issues: [] };

    const sprints = await jiraClient.getSprints(boards[0].id);
    const activeSprint = sprints.find((s) => s.state === "active") || null;

    let issues: JiraIssue[] = [];
    if (activeSprint) {
      issues = await jiraClient.getSprintIssues(activeSprint.id);
    }
    
    // Always fetch backlog for planning view
    let backlogIssues: JiraIssue[] = [];
    try {
        backlogIssues = await jiraClient.getBacklogIssues(boards[0].id);
    } catch (e) {
        console.warn("Failed to fetch backlog", e);
    }

    return {
      boardId: boards[0].id,
      sprint: activeSprint,
      allSprints: sprints, // Return all sprints
      issues,
      backlogIssues,
    };
  } catch (error) {
    console.error(`Failed to fetch context for project ${projectKey}:`, error);
    return { boardId: null, sprint: null, allSprints: [], issues: [], backlogIssues: [] };
  }
}

export async function createSprint(name: string, boardId: number) {
  try {
    const sprint = await jiraClient.createSprint(name, boardId, "Created via Nexus Orchestrator");
    
    // Automatically start the sprint
    // Set start date to now, end date to 2 weeks from now (standard sprint)
    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    // Jira expects ISO 8601 format like "2019-06-25T07:22:00.000+1000"
    // But simple ISO string might work or we need to format it carefully.
    // Jira Cloud usually accepts ISO string.
    
    // Note: Starting a sprint often requires issues to be in it. 
    // If the sprint is empty, Jira might complain or just start it empty.
    // But usually you start a sprint after adding issues. 
    // Requirement says "Click-ops Sprint Creation". 
    // Let's try to start it. If it fails (e.g. empty), we might need to handle that.
    // But the user issue is "it created the sprint, but it didn't make it active".
    
    try {
        await jiraClient.startSprint(sprint.id, now.toISOString(), twoWeeksLater.toISOString());
        sprint.state = "active"; // update local object
    } catch (startError) {
        console.warn("Created sprint but failed to start it (maybe it's empty?):", startError);
        // We still return the sprint, but the UI might show it as future if start failed.
    }

    return sprint;
  } catch (error) {
    console.error("Failed to create sprint:", error);
    throw error;
  }
}

