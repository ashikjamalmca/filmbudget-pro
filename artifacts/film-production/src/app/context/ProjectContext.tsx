import React, { createContext, useContext, useState } from 'react';

interface ProjectContextValue {
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  return (
    <ProjectContext.Provider value={{ currentProjectId, setCurrentProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
