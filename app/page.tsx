"use client";

import { useOrchestratorStore } from "@/lib/store";
import ProjectSelector from "@/components/ProjectSelector";
import CeremonyRoom from "@/components/CeremonyRoom";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { activeProjectKey, isLoading } = useOrchestratorStore();

  return (
    <div className="max-w-7xl mx-auto">
      {!activeProjectKey ? (
        <section className="pt-8">
          <ProjectSelector />
        </section>
      ) : (
        <CeremonyRoom />
      )}

      {isLoading && (
        <div className="fixed bottom-8 right-8 bg-primary text-white px-4 py-2 rounded-full shadow-glow flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 z-50">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Syncing</span>
        </div>
      )}
    </div>
  );
}

