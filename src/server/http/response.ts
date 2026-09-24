import { ZodError } from 'zod';
import { reportFailure } from '../logging/diagnostics';
export { readJson } from './read-json';
import { errorStatus, isExpectedError } from './error-status';
export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
export async function handleRequest(action: () => Promise<Response>): Promise<Response> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ZodError)
      return json({ error: 'Dados inválidos. Confira os campos informados.' }, 400);
    if (isExpectedError(error)) return json({ error: error.message }, errorStatus(error));
    reportFailure('api_failure');
    return json(
      {
        error: 'Não foi possível acessar as anotações. Confira o banco de dados e tente novamente.',
      },
      503,
    );
  }
}
