import { ZodError } from 'zod';
import { errorStatus, isExpectedError } from '../http/error-status';
import { reportFailure } from '../logging/diagnostics';

export async function toolResult(action: () => Promise<unknown>) {
  try {
    const result = await action();
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
  } catch (error) {
    const expected = isExpectedError(error);
    if (!expected) reportFailure('api_failure');
    const status = errorStatus(error);
    const message =
      isExpectedError(error) && !(error instanceof ZodError)
        ? error.message
        : status === 400
          ? 'Dados inválidos. Confira o contrato da ferramenta.'
          : 'Serviço indisponível. Tente novamente com o mesmo requestId.';
    return {
      isError: true,
      content: [{ type: 'text' as const, text: JSON.stringify({ error: message, status }) }],
    };
  }
}
