import { reportFailure } from '../logging/diagnostics';
export class HealthController {
  constructor(private readonly probe: { check(): Promise<void> }) {}
  async read(): Promise<Response> {
    try {
      await this.probe.check();
      return Response.json({ status: 'ok' });
    } catch {
      reportFailure('health_failure');
      return Response.json({ status: 'unavailable' }, { status: 503 });
    }
  }
}
