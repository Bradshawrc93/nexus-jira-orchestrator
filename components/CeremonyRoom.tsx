"use client";

import { useOrchestratorStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { createSprint, getProjectContext } from "@/app/actions/jira";
import { moveIssueToSprint, getSprintIssues } from "@/app/actions/sprint-planning";
import { processMeetingTranscript, applySuggestion } from "@/app/actions/langgraph";
import { generateMeetingArtifacts, MeetingArtifacts } from "@/app/actions/artifacts";
import { 
  Users, 
  Layout, 
  ClipboardCheck, 
  Play, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus,
  ArrowLeft,
  Calendar,
  BarChart2,
  ListTodo,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  MoveRight
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
    allSprints,
    activeCeremonyType,
    issues, 
    backlogIssues,
    activeTicketId, 
    suggestions,
    setActiveProject,
    setActiveSprint,
    setActiveBoardId,
    setActiveCeremonyType,
    setIssues,
    setLoading,
    addSuggestion,
    setActiveTicket,
    updateSuggestionStatus
  } = useOrchestratorStore();

  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [artifacts, setArtifacts] = useState<MeetingArtifacts | null>(null);
  const [showArtifacts, setShowArtifacts] = useState(false);
  
  // Sprint Planning State
  const [planningMode, setPlanningMode] = useState<'sprint_selection' | 'backlog_grooming'>('sprint_selection');
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  const handleEndMeeting = async () => {
    setLoading(true);
    try {
      // In a real app we'd pass the full transcript history
      const generated = await generateMeetingArtifacts([], suggestions);
      setArtifacts(generated);
      setShowArtifacts(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Computed issues based on ceremony type
  const displayIssues = useMemo(() => {
    if (!activeCeremonyType) return issues;
    
    switch (activeCeremonyType) {
      case 'standup':
        // Highlight In-Progress and Blocked (simulated by having 'blocked' intent later, for now just show all but sort/filter?)
        // Requirement: "UI highlights 'In-Progress' and 'Blocked' tickets."
        // For now return all, we handle highlighting in the render.
        return issues;
      case 'planning':
        // Show Backlog? The current context only fetches active sprint issues.
        // Assuming we want to show current sprint capacity for now.
        return issues;
      case 'review':
        // Show Done tickets
        return issues.filter((i: any) => i.fields.status.statusCategory.id === 4);
      default:
        return issues;
    }
  }, [issues, activeCeremonyType]);

  const handleTranscriptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) return;

    setIsProcessing(true);
    try {
      const result = await processMeetingTranscript(transcript, {
        activeProjectKey: activeProjectKey || "",
        activeSprintId: activeSprint?.id.toString() || "",
        activeTicketId: activeTicketId,
        transcriptHistory: [], // We could maintain history in store if needed
      });

      if (result.activeTicketId) {
        setActiveTicket(result.activeTicketId);
      }

      if (result.suggestions && result.suggestions.length > 0) {
        result.suggestions.forEach(s => {
          // @ts-ignore - store expects Omit<Suggestion, 'id' | 'status'>
          addSuggestion({
            issueKey: s.issueKey,
            action: s.action,
            reason: s.reason,
            // @ts-ignore
            transitionId: s.transitionId
          });
        });
      }
    } catch (error) {
      console.error("Agent processing failed:", error);
    } finally {
      setIsProcessing(false);
      setTranscript("");
    }
  };

  const handleAcceptSuggestion = async (id: string, suggestion: any) => {
    if (!suggestion.transitionId) {
      alert("No transition ID available for this suggestion");
      return;
    }
    
    setLoading(true);
    try {
      const result = await applySuggestion(suggestion.issueKey, suggestion.transitionId);
      if (result.success) {
        updateSuggestionStatus(id, 'accepted');
        // Refresh issues to show new status
        window.location.reload(); 
      } else {
        alert("Failed to update Jira");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSuggestion = (id: string) => {
    updateSuggestionStatus(id, 'rejected');
  };

  const handleCreateSprint = async () => {
    // @ts-ignore - store access
    const { allSprints } = useOrchestratorStore.getState();
    if (!activeProjectKey || activeBoardId === null) return;
    setLoading(true);
    try {
      const count = allSprints.length + 1;
      await createSprint(`Sprint ${count} - ${activeProjectKey}`, activeBoardId); 
      
      // Refresh context instead of reload
      const context = await getProjectContext(activeProjectKey);
      // @ts-ignore
      useOrchestratorStore.getState().setAllSprints(context.allSprints);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectSprintForPlanning = async (sprint: any) => {
      setLoading(true);
      try {
          setActiveSprint(sprint);
          const issues = await getSprintIssues(sprint.id);
          setIssues(issues);
          setPlanningMode('backlog_grooming');
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleAddToSprint = (issue: any) => {
      if (!activeSprint) return;
      addSuggestion({
          issueKey: issue.key,
          action: `Add to ${activeSprint.name}`,
          reason: "Manual drag-and-drop from backlog",
      });
  };

  // Skip "No Active Sprint" check - we want to allow navigation to Planning even if no sprint active
  
  // Phase 1: Ceremony Selection
  if (!activeCeremonyType) {
    const hasActiveSprint = !!activeSprint;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center animate-in fade-in slide-in-from-bottom-4">
        <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Select Ceremony</h2>
        <p className="text-white/40 mb-12 max-w-lg">
          Choose the type of meeting to configure the Agile Cockpit context and AI behavior.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
          <button 
            disabled={!hasActiveSprint}
            onClick={() => setActiveCeremonyType('standup')}
            className={cn(
                "glass-card p-8 text-left flex flex-col gap-4 transition-all group",
                hasActiveSprint ? "hover:bg-white/5 hover:scale-105 hover:shadow-glow" : "opacity-40 cursor-not-allowed grayscale"
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Daily Stand-up</h3>
              <p className="text-sm text-text-muted">Highlights blocked tickets and progress updates. Quick sync focus.</p>
            </div>
          </button>

          <button 
            onClick={() => setActiveCeremonyType('planning')}
            className="glass-card p-8 hover:bg-white/5 transition-all group hover:scale-105 hover:shadow-glow text-left flex flex-col gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Sprint Planning</h3>
              <p className="text-sm text-text-muted">Focus on backlog grooming, capacity planning, and estimation.</p>
            </div>
          </button>

          <button 
            disabled={!hasActiveSprint}
            onClick={() => setActiveCeremonyType('review')}
            className={cn(
                "glass-card p-8 text-left flex flex-col gap-4 transition-all group",
                hasActiveSprint ? "hover:bg-white/5 hover:scale-105 hover:shadow-glow" : "opacity-40 cursor-not-allowed grayscale"
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Sprint Review</h3>
              <p className="text-sm text-text-muted">Showcase "Done" work and compare against Sprint Goals.</p>
            </div>
          </button>
        </div>

        <button 
          onClick={() => setActiveProject('')}
          className="mt-12 text-white/40 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>
      </div>
    );
  }

  // SPRINT PLANNING VIEW
  if (activeCeremonyType === 'planning') {
      if (planningMode === 'sprint_selection') {
          return (
            <div className="max-w-4xl mx-auto py-12">
               <div className="flex items-center gap-4 mb-8">
                    <button 
                      onClick={() => setActiveCeremonyType(null)} 
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-white/60" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold text-white">Sprint Planning</h2>
                        <p className="text-text-muted">Select a sprint to plan or create a new one.</p>
                    </div>
                    <button 
                        onClick={handleCreateSprint}
                        className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Create Sprint
                    </button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {allSprints.map((sprint: any) => (
                       <button
                           key={sprint.id}
                           onClick={() => handleSelectSprintForPlanning(sprint)}
                           className="glass-card p-6 text-left hover:bg-white/5 transition-all group flex items-center justify-between"
                       >
                           <div>
                               <div className="flex items-center gap-2 mb-1">
                                   <h3 className="text-lg font-bold text-white">{sprint.name}</h3>
                                   <span className={cn(
                                       "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-widest border",
                                       sprint.state === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                       sprint.state === 'closed' ? "bg-white/5 text-white/40 border-white/5" :
                                       "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                   )}>
                                       {sprint.state}
                                   </span>
                               </div>
                               <p className="text-xs text-text-muted font-mono">ID: {sprint.id}</p>
                           </div>
                           <ChevronDown className="-rotate-90 text-white/20 group-hover:text-white transition-colors" />
                       </button>
                   ))}
                   {allSprints.length === 0 && (
                       <div className="col-span-full p-12 text-center text-white/40 italic border border-dashed border-white/10 rounded-xl">
                           No sprints found. Create one to get started.
                       </div>
                   )}
               </div>
            </div>
          );
      }
      
      // Backlog Grooming View
      return (
         <div className="h-[calc(100vh-100px)] flex flex-col">
             {/* Header */}
             <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setPlanningMode('sprint_selection')} 
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-white/60" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{activeSprint?.name}</h2>
                        <p className="text-sm text-text-muted">Drag items from backlog to plan sprint capacity.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                     <div className="text-right">
                         <div className="text-2xl font-bold text-purple-400">{issues.length}</div>
                         <div className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Planned Issues</div>
                     </div>
                </div>
             </div>
             
             {/* Split View */}
             <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                 {/* Left: Backlog */}
                 <div className="col-span-4 flex flex-col min-h-0 bg-white/2 rounded-2xl border border-white/5">
                     <div className="p-4 border-b border-white/5 flex items-center justify-between">
                         <h3 className="font-bold text-white uppercase tracking-widest text-xs flex items-center gap-2">
                             <ListTodo className="w-4 h-4" /> Backlog ({backlogIssues.length})
                         </h3>
                     </div>
                     <div className="flex-1 overflow-y-auto p-3 space-y-3">
                         {backlogIssues.map((issue: any) => (
                             <div key={issue.id} className="glass-card p-3 group relative hover:border-purple-500/50 transition-colors">
                                 <div className="flex justify-between items-start mb-2">
                                     <span className="text-[10px] font-mono text-text-muted">{issue.key}</span>
                                     <StatusIcon categoryId={issue.fields.status.statusCategory.id} />
                                 </div>
                                 <h4 className="text-sm font-bold text-white mb-2 leading-tight">{issue.fields.summary}</h4>
                                 
                                 <button 
                                    onClick={() => handleAddToSprint(issue)}
                                    className="w-full py-1.5 bg-white/5 hover:bg-purple-500/20 text-white/60 hover:text-purple-300 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mt-2"
                                 >
                                     Add to Sprint <MoveRight className="w-3 h-3" />
                                 </button>
                             </div>
                         ))}
                     </div>
                 </div>

                 {/* Center: Active Sprint */}
                 <div className="col-span-5 flex flex-col min-h-0 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                     <div className="p-4 border-b border-white/5 flex items-center justify-between">
                         <h3 className="font-bold text-purple-200 uppercase tracking-widest text-xs flex items-center gap-2">
                             <Calendar className="w-4 h-4" /> Planned for {activeSprint?.name}
                         </h3>
                     </div>
                     <div className="flex-1 overflow-y-auto p-3 space-y-3">
                         {issues.map((issue: any) => (
                             <div key={issue.id} className="glass-card p-3 border-l-4 border-l-purple-500">
                                 <div className="flex justify-between items-start mb-2">
                                     <span className="text-[10px] font-mono text-purple-300">{issue.key}</span>
                                     <button 
                                         onClick={() => setExpandedTicketId(expandedTicketId === issue.id ? null : issue.id)}
                                         className="text-white/40 hover:text-white"
                                     >
                                         {expandedTicketId === issue.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                     </button>
                                 </div>
                                 <h4 className="text-sm font-bold text-white leading-tight">{issue.fields.summary}</h4>
                                 
                                 {expandedTicketId === issue.id && (
                                     <div className="mt-4 pt-3 border-t border-white/5 space-y-2 animate-in fade-in slide-in-from-top-2">
                                         <div className="grid grid-cols-2 gap-4">
                                             <div>
                                                 <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Assignee</span>
                                                 <div className="flex items-center gap-2">
                                                     {issue.fields.assignee ? (
                                                        <>
                                                            <img src={issue.fields.assignee.avatarUrls["24x24"]} className="w-4 h-4 rounded-full" />
                                                            <span className="text-xs text-white">{issue.fields.assignee.displayName}</span>
                                                        </>
                                                     ) : <span className="text-xs text-white/40">Unassigned</span>}
                                                 </div>
                                             </div>
                                             <div>
                                                 <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Status</span>
                                                 <span className="text-xs text-white">{issue.fields.status.name}</span>
                                             </div>
                                         </div>
                                     </div>
                                 )}
                             </div>
                         ))}
                         {issues.length === 0 && (
                             <div className="h-full flex flex-col items-center justify-center text-white/20 italic">
                                 <p>Sprint is empty.</p>
                                 <p className="text-xs">Add items from backlog.</p>
                             </div>
                         )}
                     </div>
                 </div>

                 {/* Right: Staging (HITL) */}
                 <div className="col-span-3 flex flex-col min-h-0">
                     <div className="p-4 border-b border-transparent flex items-center gap-2 text-white/60">
                        <ClipboardCheck className="w-5 h-5" />
                        <h2 className="font-bold uppercase tracking-widest text-xs">Staging Buffer</h2>
                     </div>
                     <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {/* Reuse existing Staging Buffer Logic */}
                         {suggestions.filter((s: any) => s.status === 'pending').map((s: any) => (
                          <div key={s.id} className={cn(
                            "glass-card p-4 border-l-4",
                            s.issueKey === "SYSTEM" ? "border-l-yellow-500 bg-yellow-500/10" : 
                            s.action.includes("⚠️") ? "border-l-red-500 bg-red-500/10" :
                            "border-l-secondary-accent bg-secondary-accent/5"
                          )}>
                             {/* ... Suggestion Card Content (Simplified copy from main view) ... */}
                             <div className="flex items-center gap-2 mb-2">
                                  <span className={cn(
                                    "text-[10px] font-mono font-bold uppercase tracking-widest",
                                    s.issueKey === "SYSTEM" ? "text-yellow-500" : 
                                    s.action.includes("⚠️") ? "text-red-400" :
                                    "text-secondary-accent"
                                  )}>{s.issueKey}</span>
                                  <span className="text-[10px] text-text-muted uppercase tracking-widest opacity-60">Suggestion</span>
                                </div>
                                <div className="text-sm font-bold text-white mb-1">{s.action}</div>
                                <p className="text-xs text-text-muted mb-4 leading-relaxed">{s.reason}</p>
                                
                                {s.issueKey !== "SYSTEM" && !s.action.includes("⚠️") && (
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleAcceptSuggestion(s.id, s)}
                                      className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold py-2 rounded-lg transition-all border border-primary/20 hover:border-primary/40 uppercase tracking-widest"
                                    >
                                      Accept
                                    </button>
                                    <button 
                                      onClick={() => handleRejectSuggestion(s.id)}
                                      className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold py-2 rounded-lg transition-all border border-white/5 hover:border-white/10 uppercase tracking-widest"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                          </div>
                        ))}
                     </div>
                 </div>
             </div>
         </div>
      );
  }

  // Standard Ceremony View (Standup / Review)
  // Group issues by status category
  const stats = {
    todo: issues.filter((i: any) => i.fields.status.statusCategory.id === 2).length,
    inProgress: issues.filter((i: any) => i.fields.status.statusCategory.id === 3).length,
    done: issues.filter((i: any) => i.fields.status.statusCategory.id === 4).length,
  };

  return (
    <div className="space-y-8">
      {/* Ceremony Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button 
              onClick={() => setActiveCeremonyType(null)} 
              className="p-1 hover:bg-white/10 rounded-lg transition-colors mr-1"
            >
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </button>
            <h1 className="text-3xl font-bold text-white tracking-tight">{activeSprint?.name}</h1>
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded uppercase tracking-widest border border-primary/30">
              Active
            </span>
          </div>
          <p className="text-sm text-text-muted ml-9">
            Orchestrating <span className="text-white font-mono">{activeProjectKey}</span> • {activeCeremonyType?.replace(/^\w/, (c: string) => c.toUpperCase())}
          </p>
        </div>
        
          <div className="flex gap-6 items-center">
            {/* End Meeting Button */}
            <button 
              onClick={handleEndMeeting}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
            >
              End Meeting
            </button>

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
            <h2 className="font-bold uppercase tracking-widest text-xs">Nexus Board ({activeCeremonyType})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2">
            {displayIssues.map((issue: any) => (
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
            {suggestions.filter((s: any) => s.status === 'pending').map((s: any) => (
              <div key={s.id} className={cn(
                "glass-card p-4 border-l-4",
                s.issueKey === "SYSTEM" ? "border-l-yellow-500 bg-yellow-500/10" : 
                s.action.includes("⚠️") ? "border-l-red-500 bg-red-500/10" :
                "border-l-secondary-accent bg-secondary-accent/5"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-[10px] font-mono font-bold uppercase tracking-widest",
                    s.issueKey === "SYSTEM" ? "text-yellow-500" : 
                    s.action.includes("⚠️") ? "text-red-400" :
                    "text-secondary-accent"
                  )}>{s.issueKey}</span>
                  <span className="text-[10px] text-text-muted uppercase tracking-widest opacity-60">Suggestion</span>
                </div>
                <div className="text-sm font-bold text-white mb-1">{s.action}</div>
                <p className="text-xs text-text-muted mb-4 leading-relaxed">{s.reason}</p>
                
                {s.issueKey !== "SYSTEM" && !s.action.includes("⚠️") && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAcceptSuggestion(s.id, s)}
                      className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold py-2 rounded-lg transition-all border border-primary/20 hover:border-primary/40 uppercase tracking-widest"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleRejectSuggestion(s.id)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold py-2 rounded-lg transition-all border border-white/5 hover:border-white/10 uppercase tracking-widest"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {(s.issueKey === "SYSTEM" || s.action.includes("⚠️")) && (
                   <button 
                      onClick={() => handleRejectSuggestion(s.id)}
                      className="w-full bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold py-2 rounded-lg transition-all border border-white/5 hover:border-white/10 uppercase tracking-widest"
                    >
                      Dismiss
                    </button>
                )}
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

      {/* Artifacts Modal */}
      {showArtifacts && artifacts && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowArtifacts(false)} />
          <div className="glass-panel w-full max-w-2xl max-h-[80vh] overflow-y-auto relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowArtifacts(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Meeting Artifacts</h2>
                  <p className="text-sm text-text-muted">Generated Governance & Digest</p>
                </div>
              </div>

              {/* Executive Digest */}
              <div className="glass-card p-6 mb-6 border-l-4 border-l-purple-500">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Executive Digest (CPO View)</h3>
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border",
                    artifacts.executiveDigest.sentiment === "On Track" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    artifacts.executiveDigest.sentiment === "At Risk" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                    "bg-red-500/10 text-red-500 border-red-500/20"
                  )}>
                    {artifacts.executiveDigest.sentiment}
                  </div>
                  <p className="text-sm text-white/80">{artifacts.executiveDigest.reason}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Meeting Summary</h3>
                <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                  {artifacts.summary}
                </div>
              </div>

              {/* Action Items */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Action Items</h3>
                <ul className="space-y-2">
                  {artifacts.actionItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                  {artifacts.actionItems.length === 0 && (
                     <li className="text-sm text-white/40 italic">No action items recorded.</li>
                  )}
                </ul>
              </div>

               {/* Decisions */}
               <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Key Decisions</h3>
                <ul className="space-y-2">
                  {artifacts.decisions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-3">
                <button 
                  onClick={() => setShowArtifacts(false)}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    alert("Artifacts exported to Confluence/Notion (Mock)");
                    setShowArtifacts(false);
                    setActiveCeremonyType(null); // Go back to selection
                  }}
                  className="bg-primary text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-accent transition-colors"
                >
                  Export & Finish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

