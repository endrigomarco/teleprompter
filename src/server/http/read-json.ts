import { HttpError } from './http-error';
const MAX_BODY_BYTES = 600000;
export async function readJson(request: Request): Promise<unknown> {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') ?? new URL(request.url).host;
  if (origin) {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      throw new HttpError(403, 'Origem não permitida.');
    }
    if (originHost !== host) throw new HttpError(403, 'Origem não permitida.');
  }
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
  )
    throw new HttpError(415, 'Envie JSON.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Informe os dados.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new HttpError(413, 'Conteúdo muito longo.');
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'JSON inválido.');
  }
}
