import { getPool } from './database/pool';
import { PostgresNoteRepository } from './repositories/postgres-note-repository';
import { NoteService } from './services/note-service';
import { NoteController } from './controllers/note-controller';
import { PostgresProjectRepository } from './repositories/postgres-project-repository';
import { ProjectService } from './services/project-service';
import { ProjectController } from './controllers/project-controller';
import { HealthController } from './controllers/health-controller';
import { PostgresHealthRepository } from './repositories/postgres-health-repository';
import { AutomationService } from './services/automation-service';
import { AutomationOperationService } from './services/automation-operation-service';
import { PostgresAutomationUnitOfWork } from './repositories/postgres-automation-unit-of-work';
import { PostgresNoteHistoryReader } from './repositories/postgres-note-history-reader';
import { handleMcpRequest } from './mcp/handler';
export function noteController(request: Request): NoteController {
  return new NoteController(
    new NoteService(
      new PostgresNoteRepository(
        getPool(),
        new URL(request.url).searchParams.get('projectId') ?? '',
      ),
    ),
  );
}

export function projectController() {
  return new ProjectController(new ProjectService(new PostgresProjectRepository(getPool())));
}
export function healthController(): HealthController {
  return new HealthController(new PostgresHealthRepository(getPool()));
}

export function mcpHandler(request: Request): Promise<Response> {
  return handleMcpRequest(
    request,
    (actor) =>
      new AutomationService(
        new AutomationOperationService(
          new PostgresAutomationUnitOfWork(getPool()),
          new PostgresNoteHistoryReader(getPool()),
        ),
        (projectId) => new PostgresNoteRepository(getPool(), projectId),
        new PostgresProjectRepository(getPool()),
        actor,
      ),
  );
}
