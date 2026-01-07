This is the "North Star" document you need. It is a comprehensive **Technical Specification (PRD/TDD hybrid)** that defines every state, every API call, and every UI interaction we have discussed.

Copy this into a file named **`ORCHESTRATOR_SPEC.md`** in your new repository. When you open Cursor, point the AI to this file and say: *"Build the application defined in this specification. Start with the Jira Client and the Project Selector UI."*

---

# Specification: Jira Ceremony Orchestrator

## 1. Project Vision

A state-aware "Agile Cockpit" that uses **LangGraph** to bridge live verbal communication with Jira’s system of record. It operates as a modular "Spoke" within the Nexus ecosystem, using a shared Tailwind design preset for visual consistency.

## 2. Technical Stack

* **Framework:** Next.js 15 (App Router, Server Actions)
* **Design System:** Tailwind CSS (via `nexus-tailwind-preset.js`) repo https://github.com/Bradshawrc93/nexus-tailwind-preset
* **Orchestration:** LangGraph.js (Stateful AI workflows)
* **API:** Jira Agile REST API (v1.0) & Jira Platform API (v3)
* **State Management:** Zustand (Client-side UI) + LangGraph (Server-side meeting context)

---

## 3. The "Jira Handshake" (lib/jira-client.ts)

The app must integrate with the Jira REST API using Basic Auth (Email/API Token).

### Required API Operations:

1. **Project Discovery:** `GET /rest/api/3/project` (Retrieve all accessible projects).
2. **Board Mapping:** `GET /rest/agile/1.0/board` (Find boards associated with Project Keys).
3. **Sprint Discovery:** `GET /rest/agile/1.0/board/{boardId}/sprint` (Identify active vs. planned sprints).
4. **Health Check (Status Categories):** Instead of string matching, use **StatusCategory IDs**:
* **To Do:** `2`
* **In Progress:** `3`
* **Done:** `4`


5. **Click-ops Sprint Creation:** `POST /rest/agile/1.0/sprint`
* *Payload:* `{ name, originBoardId, goal }`



---

## 4. Operational Logic & UI Flow

### Phase A: The Control Plane (Landing)

A Bento-grid interface for Project Selection.

* **Action:** Fetch all projects.
* **State Detection:** For the selected project, check the Sprint status.
* **Conditional Rendering:**
* *If No Sprint:* Render "Create Sprint 1" button + Lock "Stand-up" ceremony.
* *If Sprint Exists:* Render stats (counts for Category 2, 3, 4) + Enable "Stand-up."



### Phase B: The Ceremony Room (Layout)

A three-column layout optimized for real-time orchestration.

1. **Column 1: Speaker Queue:**
* Hardcoded test team: Alex (Backend), Sarah (Frontend), Marcus (Fullstack), Priya (PO), Liam (DevOps).


2. **Column 2: The Nexus Board:**
* Grid of ticket cards fetched from the active sprint.
* Visual: `activeTicketId` triggers `animate-pulse` on the corresponding card.


3. **Column 3: The Staging Buffer (HITL):**
* Area for AI-generated suggestions (e.g., "Suggesting: Move PROJ-1 to Done").
* Controls: **Accept (✓)** or **Reject (✗)**. No Jira update happens until manually accepted.



---

## 5. Agentic Logic (LangGraph)

The meeting state is managed via a cyclic graph.

### State Schema:

```typescript
interface MeetingState {
  activeProjectKey: string;
  activeSprintId: string;
  activeTicketId: string | null;
  transcriptHistory: string[];
  suggestions: Suggestion[]; // Pending HITL updates
}

```

### Node Logic:

* **Extractor:** Identifies Ticket Keys (e.g., "ALPHA-12") or keywords from the transcript.
* **Contextualizer:** Verifies if the mentioned ticket is in the current Board Context.
* **Intent Analyzer:** Maps verbs ("blocked", "finished", "starting") to Jira Transitions.
* **Validator:** Cross-references intent with Jira’s allowed transitions for that ticket's specific status category.

---

## 6. Visual Consistency (The Nexus Design)

* **Preset:** Import `nexus-tailwind-preset.js` in `tailwind.config.ts`.
* **Shell:** Replicate the Hub’s global header and "Tech-Grid" background.
* **Components:** Use "Glass-morphism" (blur + transparency) for all Bento cards.

---
