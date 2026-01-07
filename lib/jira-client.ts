export interface JiraProject {
  id: string;
  key: string;
  name: string;
  avatarUrls: { [key: string]: string };
}

export interface JiraBoard {
  id: number;
  name: string;
  type: string;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: "active" | "closed" | "future";
  startDate?: string;
  endDate?: string;
  goal?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        id: number;
        key: string;
        name: string;
      };
    };
    assignee?: {
      displayName: string;
      avatarUrls: { [key: string]: string };
    };
  };
}

class JiraClient {
  private baseUrl: string;
  private auth: string;

  constructor() {
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_API_TOKEN;
    const domain = process.env.JIRA_DOMAIN;

    if (!email || !token || !domain) {
      console.warn("Jira credentials missing in environment variables");
    }

    this.baseUrl = `https://${domain}`;
    this.auth = Buffer.from(`${email}:${token}`).toString("base64");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Basic ${this.auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jira API Error: ${response.status} ${error}`);
    }

    return response.json() as Promise<T>;
  }

  // Project Discovery
  async getProjects(): Promise<JiraProject[]> {
    return this.request<JiraProject[]>("/rest/api/3/project");
  }

  // Board Mapping
  async getBoards(projectKeyOrId?: string): Promise<JiraBoard[]> {
    const endpoint = projectKeyOrId 
      ? `/rest/agile/1.0/board?projectKeyOrId=${projectKeyOrId}`
      : "/rest/agile/1.0/board";
    const res = await this.request<{ values: JiraBoard[] }>(endpoint);
    return res.values;
  }

  // Sprint Discovery
  async getSprints(boardId: number): Promise<JiraSprint[]> {
    const res = await this.request<{ values: JiraSprint[] }>(`/rest/agile/1.0/board/${boardId}/sprint`);
    return res.values;
  }

  // Get Issues in Sprint
  async getSprintIssues(sprintId: number): Promise<JiraIssue[]> {
    const res = await this.request<{ issues: JiraIssue[] }>(`/rest/agile/1.0/sprint/${sprintId}/issue`);
    return res.issues;
  }

  // Sprint Creation
  async createSprint(name: string, originBoardId: number, goal?: string): Promise<JiraSprint> {
    return this.request<JiraSprint>("/rest/agile/1.0/sprint", {
      method: "POST",
      body: JSON.stringify({ name, originBoardId, goal }),
    });
  }

  // Transition Issue (HITL)
  async transitionIssue(issueIdOrKey: string, transitionId: string): Promise<void> {
    await this.request(`/rest/api/3/issue/${issueIdOrKey}/transitions`, {
      method: "POST",
      body: JSON.stringify({ transition: { id: transitionId } }),
    });
  }
}

export const jiraClient = new JiraClient();

