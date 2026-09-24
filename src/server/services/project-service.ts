import type { ProjectRepository, ProjectState } from '@/domain/projects/project';
import {
  projectDraftSchema,
  updateProjectSchema,
  selectProjectSchema,
} from '@/domain/projects/validation';
import { versionSchema } from '@/domain/shared/validation';
export class ProjectService {
  constructor(private readonly repository: ProjectRepository) {}
  list(): Promise<ProjectState> {
    return this.repository.state();
  }
  create(input: unknown): Promise<ProjectState> {
    return this.repository.create(projectDraftSchema.parse(input));
  }
  update(id: string, input: unknown): Promise<ProjectState> {
    const { version, ...draft } = updateProjectSchema.parse(input);
    return this.repository.update(id, draft, version);
  }
  delete(id: string, input: unknown): Promise<ProjectState> {
    return this.repository.delete(id, versionSchema.parse(input).version);
  }
  select(input: unknown): Promise<ProjectState> {
    return this.repository.select(selectProjectSchema.parse(input).id);
  }
}
