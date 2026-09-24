import type { NoteService } from '../services/note-service';
import { handleRequest, json, readJson } from '../http/response';
export class NoteController {
  constructor(private readonly service: NoteService) {}
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
    return handleRequest(async () => {
      await this.service.delete(id, await readJson(request));
      return json({ ok: true });
    });
  }
  reorder(request: Request) {
    return handleRequest(async () => json(await this.service.reorder(await readJson(request))));
  }
}
