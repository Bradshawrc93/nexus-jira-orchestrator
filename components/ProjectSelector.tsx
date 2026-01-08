"use client";

import { useEffect, useState } from "react";
import { JiraProject } from "@/lib/jira-client";
import { getProjects, getProjectContext } from "@/app/actions/jira";
import { useOrchestratorStore } from "@/lib/store";
import { LayoutGrid, Loader2, ArrowRight } from "lucide-react";

export default function ProjectSelector() {
  const { 
    projects, 
    setProjects, 
    setActiveProject, 
    setActiveBoardId,
    setActiveSprint, 
    setIssues,
    setAllSprints,
    setBacklogIssues,
    setLoading,
    isLoading 
  } = useOrchestratorStore();

  const [error, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        setLocalError("Failed to load projects. Check your Jira credentials.");
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [setProjects, setLoading]);

  const handleSelect = async (projectKey: string) => {
    setLoading(true);
    try {
      setActiveProject(projectKey);
      const context = await getProjectContext(projectKey);
      setActiveBoardId(context.boardId ?? null);
      setActiveSprint(context.sprint);
      setAllSprints(context.allSprints ?? []); // Store all sprints
      setIssues(context.issues);
      setBacklogIssues(context.backlogIssues ?? []); // Store backlog
    } catch (err) {
      setLocalError("Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4 shadow-glow" />
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Initializing Core...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center border-red-500/50 max-w-md mx-auto">
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project: any) => (
        <button
          key={project.id}
          onClick={() => handleSelect(project.key)}
          className="glass-card p-6 text-left group hover:bg-white/5 transition-all duration-500 hover:scale-[1.02] hover:shadow-glow-hover"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 p-2">
              <img 
                src={project.avatarUrls["48x48"]} 
                alt={project.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-primary transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{project.name}</h3>
          <p className="text-xs text-text-muted font-mono uppercase tracking-wider">{project.key}</p>
        </button>
      ))}
      
      {projects.length === 0 && !isLoading && (
        <div className="col-span-full glass-card p-12 text-center text-white/60">
          No projects found.
        </div>
      )}
    </div>
  );
}

