export type FailureEvent =
  | 'api_failure'
  | 'database_connection_failure'
  | 'migration_failure'
  | 'import_failure'
  | 'export_failure'
  | 'health_failure'
  | 'mcp_configuration_failure';
export function reportFailure(event: FailureEvent): void {
  console.error(JSON.stringify({ level: 'error', event, timestamp: new Date().toISOString() }));
}
