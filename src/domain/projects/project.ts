export interface ProjectDraft {
  title: string;
  description: string;
}
export interface Project extends ProjectDraft {
  id: string;
  version: number;
  noteCount: number;
}
export interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
}
export interface ProjectRepository {
  state(): Promise<ProjectState>;
  create(draft: ProjectDraft): Promise<ProjectState>;
  update(id: string, draft: ProjectDraft, version: number): Promise<ProjectState>;
  delete(id: string, version: number): Promise<ProjectState>;
  select(id: string): Promise<ProjectState>;
}
