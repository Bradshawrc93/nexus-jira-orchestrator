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

    return {
      boardId: boards[0].id,
      sprint: activeSprint,
      issues,
    };
  } catch (error) {
    console.error(`Failed to fetch context for project ${projectKey}:`, error);
    return { boardId: null, sprint: null, issues: [] };
  }
}

export async function createSprint(name: string, boardId: number) {
  try {
    return await jiraClient.createSprint(name, boardId, "Created via Nexus Orchestrator");
  } catch (error) {
    console.error("Failed to create sprint:", error);
    throw error;
  }
}

