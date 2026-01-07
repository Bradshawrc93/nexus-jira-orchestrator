# Nexus Jira Orchestrator

The **Jira Ceremony Orchestrator** is a state-aware "Agile Cockpit" that uses **LangGraph** to bridge live verbal communication with Jira’s system of record. It operates as a modular "Spoke" within the Nexus ecosystem, ensuring visual consistency via the shared Nexus design system.

## 🚀 Features

- **Project Discovery:** Bento-grid interface for selecting Jira projects.
- **Nexus Board:** Real-time visualization of sprint tickets with agentic highlighting.
- **Speaker Queue:** Managed team lineup for orchestration ceremonies.
- **Staging Buffer (HITL):** Human-In-The-Loop AI suggestions for Jira updates.
- **Agentic Logic:** LangGraph-powered workflow for identifying intent and mapping verbal updates to Jira transitions.

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Design System:** Tailwind CSS v4 with `nexus-tailwind-preset`
- **Orchestration:** LangGraph.js
- **State Management:** Zustand (Client) + LangGraph (Meeting Context)
- **API:** Jira Agile & Platform REST APIs

## 📦 Setup & Installation

### 1. Prerequisites
- Node.js 18+
- A Jira Cloud account and API Token

### 2. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Your Jira account email
JIRA_EMAIL=your-email@example.com

# Your Jira API Token
# Generate at: https://id.atlassian.com/manage-profile/security/api-tokens
JIRA_API_TOKEN=your-jira-api-token

# Your Jira site domain (e.g., your-company.atlassian.net)
JIRA_DOMAIN=your-domain.atlassian.net
```

### 3. Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## 💡 How to Use

1. **Select a Project**: Choose a Jira project from the control plane.
2. **Start a Ceremony**: If an active sprint exists, you'll enter the Ceremony Room.
3. **Agentic Interaction**: Use the transcript simulator (bottom of Speaker Queue) to test the AI logic.
    - *Example:* "I've finished PROJ-123"
    - The app will highlight the card and suggest a "Move to Done" transition in the Staging Buffer.

---

Built as part of the **Nexus Ecosystem**.

