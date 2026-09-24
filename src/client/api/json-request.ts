import { z } from 'zod';
const errorResponseSchema = z.object({ error: z.string() });
export async function requestJson<T>(
  url: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  let result: unknown;
  try {
    result = await response.json();
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error('O servidor retornou uma resposta inválida. Tente novamente.');
  }
  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(result);
    throw new Error(parsed.success ? parsed.data.error : 'Não foi possível concluir a operação.');
  }
  const parsed = schema.safeParse(result);
  if (!parsed.success) throw new Error('O servidor retornou dados inválidos. Recarregue a página.');
  return parsed.data;
}
