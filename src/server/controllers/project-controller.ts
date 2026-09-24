import type { ProjectService } from '../services/project-service';
import { handleRequest, json, readJson } from '../http/response';
export class ProjectController {
  constructor(private readonly service: ProjectService) {}
  list() {
    return handleRequest(async () => json(await this.service.list()));
  }
  create(request: Request) {
    return handleRequest(async () => json(await this.service.create(await readJson(request)), 201));
  }
  update(request: Request, id: string) {
    return handleRequest(async () => json(await this.service.update(id, await readJson(request))));
  }
  delete(request: Request, id: string) {
    return handleRequest(async () => json(await this.service.delete(id, await readJson(request))));
  }
  select(request: Request) {
    return handleRequest(async () => json(await this.service.select(await readJson(request))));
  }
}
