import type { Project, ProjectDraft, ProjectState } from '@/domain/projects/project';
import { requestJson } from './json-request';
import { projectStateResponseSchema } from './response-schemas';
export interface ProjectsApi {
  list(signal?: AbortSignal): Promise<ProjectState>;
  create(draft: ProjectDraft): Promise<ProjectState>;
  update(project: Project, draft: ProjectDraft): Promise<ProjectState>;
  delete(project: Project): Promise<ProjectState>;
  select(id: string): Promise<ProjectState>;
}
function request(path = '', options: RequestInit = {}): Promise<ProjectState> {
  return requestJson(`/api/projects${path}`, projectStateResponseSchema, options);
}
export const projectsApi: ProjectsApi = {
  list: (signal) => request('', { signal }),
  create: (draft) => request('', { method: 'POST', body: JSON.stringify(draft) }),
  update: (project, draft) =>
    request(`/${encodeURIComponent(project.id)}`, {
      method: 'PUT',
      body: JSON.stringify({ ...draft, version: project.version }),
    }),
  delete: (project) =>
    request(`/${encodeURIComponent(project.id)}`, {
      method: 'DELETE',
      body: JSON.stringify({ version: project.version }),
    }),
  select: (id) => request('/selection', { method: 'PUT', body: JSON.stringify({ id }) }),
};
