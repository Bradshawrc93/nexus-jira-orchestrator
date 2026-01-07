"use client";

import { useOrchestratorStore } from "@/lib/store";
import { createSprint } from "@/app/actions/jira";
import { 
  Users, 
  Layout, 
  ClipboardCheck, 
  Play, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus,
  ArrowLeft
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TEAM = [
  { name: "Alex", role: "Backend" },
  { name: "Sarah", role: "Frontend" },
  { name: "Marcus", role: "Fullstack" },
  { name: "Priya", role: "PO" },
  { name: "Liam", role: "DevOps" },
];

export default function CeremonyRoom() {
  const { 
    activeProjectKey, 
    activeBoardId,
    activeSprint, 
    issues, 
    activeTicketId, 
    suggestions,
    setActiveProject,
    setLoading,
    addSuggestion,
    setActiveTicket
  } = useOrchestratorStore();

  const [transcript, setTranscript] = useState("");

  const handleTranscriptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) return;

    // Simulate LangGraph processing
    // In a real app, this would be a server action calling meetingGraph.invoke
    const ticketMatch = transcript.match(/[A-Z]+-\d+/);
    if (ticketMatch) {
      setActiveTicket(ticketMatch[0]);
      
      const lower = transcript.toLowerCase();
      if (lower.includes("done") || lower.includes("finished")) {
        addSuggestion({
          issueKey: ticketMatch[0],
          action: "Move to Done",
          reason: "User indicated completion in transcript"
        });
      }
    }
    setTranscript("");
  };

  const handleCreateSprint = async () => {
    if (!activeProjectKey || activeBoardId === null) return;
    setLoading(true);
    try {
      await createSprint(`Sprint 1 - ${activeProjectKey}`, activeBoardId); 
      window.location.reload(); // Simple refresh to update state
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!activeSprint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-yellow-500" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">No Active Sprint</h2>
        <p className="text-white/40 mb-8 max-w-md">
          Project <span className="text-white font-mono">{activeProjectKey}</span> doesn't have an active sprint. 
          You need a sprint to start the ceremony.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveProject(null)}
            className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Change Project
          </button>
          <button 
            onClick={handleCreateSprint}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Sprint 1
          </button>
        </div>
      </div>
    );
  }

  // Group issues by status category
  const stats = {
    todo: issues.filter(i => i.fields.status.statusCategory.id === 2).length,
    inProgress: issues.filter(i => i.fields.status.statusCategory.id === 3).length,
    done: issues.filter(i => i.fields.status.statusCategory.id === 4).length,
  };

  return (
    <div className="space-y-8">
      {/* Ceremony Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">{activeSprint.name}</h1>
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded uppercase tracking-widest border border-primary/30">
              Active
            </span>
          </div>
          <p className="text-sm text-text-muted">
            Orchestrating <span className="text-white font-mono">{activeProjectKey}</span> • {issues.length} Tickets
          </p>
        </div>
        
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.todo}</div>
              <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold">To Do</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-accent">{stats.inProgress}</div>
              <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.done}</div>
              <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Done</div>
            </div>
          </div>
        </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-250px)]">
        
        {/* Column 1: Speaker Queue */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <Users className="w-5 h-5" />
            <h2 className="font-bold uppercase tracking-widest text-xs">Speaker Queue</h2>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto pr-2">
            {TEAM.map((member, i) => (
              <div key={member.name} className={cn(
                "glass-card p-4 flex items-center gap-4 transition-all border-l-4",
                i === 0 ? "border-l-primary bg-primary/5 shadow-glow" : "border-l-transparent opacity-60 hover:opacity-100"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
                  i === 0 ? "bg-primary text-white" : "bg-white/5 text-text-muted"
                )}>
                  {member.name[0]}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{member.name}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">{member.role}</div>
                </div>
                {i === 0 && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(0,186,214,1)]" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4">
            <form onSubmit={handleTranscriptSubmit} className="relative">
              <input 
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Simulate transcript..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 p-1.5 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
              >
                <Play className="w-4 h-4 text-white" />
              </button>
            </form>
            <p className="text-[10px] text-white/20 mt-2 px-2 italic">
              Try: "I've finished ALPHA-123 and moving it to done"
            </p>
          </div>
        </div>

        {/* Column 2: Nexus Board */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <Layout className="w-5 h-5" />
            <h2 className="font-bold uppercase tracking-widest text-xs">Nexus Board</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2">
            {issues.map((issue) => (
              <div 
                key={issue.id} 
                className={cn(
                  "glass-card p-4 transition-all duration-500 hover:bg-white/5",
                  activeTicketId === issue.key && "ring-1 ring-primary/50 bg-primary/5 animate-pulse shadow-glow"
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{issue.key}</span>
                  <StatusIcon categoryId={issue.fields.status.statusCategory.id} />
                </div>
                <h3 className="text-sm font-bold text-white line-clamp-2 mb-4 leading-relaxed group-hover:text-primary transition-colors">
                  {issue.fields.summary}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {issue.fields.assignee ? (
                      <div className="flex items-center gap-2">
                         <img 
                          src={issue.fields.assignee.avatarUrls["24x24"]} 
                          alt={issue.fields.assignee.displayName}
                          className="w-5 h-5 rounded-lg border border-white/10"
                        />
                        <span className="text-[10px] text-text-muted">{issue.fields.assignee.displayName}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-text-muted/40 italic">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Staging Buffer */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <ClipboardCheck className="w-5 h-5" />
            <h2 className="font-bold uppercase tracking-widest text-xs">Staging Buffer (HITL)</h2>
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto pr-2">
            {suggestions.filter(s => s.status === 'pending').map((s) => (
              <div key={s.id} className="glass-card p-4 border-l-4 border-l-secondary-accent bg-secondary-accent/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-secondary-accent font-bold uppercase tracking-widest">{s.issueKey}</span>
                  <span className="text-[10px] text-text-muted uppercase tracking-widest opacity-60">Suggestion</span>
                </div>
                <div className="text-sm font-bold text-white mb-1">{s.action}</div>
                <p className="text-xs text-text-muted mb-4 leading-relaxed">{s.reason}</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold py-2 rounded-lg transition-all border border-primary/20 hover:border-primary/40 uppercase tracking-widest">
                    Accept
                  </button>
                  <button className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold py-2 rounded-lg transition-all border border-white/5 hover:border-white/10 uppercase tracking-widest">
                    Reject
                  </button>
                </div>
              </div>
            ))}
            
            {suggestions.length === 0 && (
              <div className="flex-1 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-white/2">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/5">
                  <Play className="w-6 h-6 text-text-muted/40" />
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Awaiting Input</p>
                <p className="text-[10px] text-text-muted/40 mt-1 max-w-[150px]">Start speaking to trigger agentic suggestions</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatusIcon({ categoryId }: { categoryId: number }) {
  switch (categoryId) {
    case 4: return <CheckCircle2 className="w-4 h-4 text-primary" />;
    case 3: return <Circle className="w-4 h-4 text-secondary-accent fill-secondary-accent/20" />;
    default: return <Circle className="w-4 h-4 text-text-muted/40" />;
  }
}

