import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import type { AutomationActor } from '@/domain/automation/models';
import type { AutomationService } from '../services/automation-service';
import { handleRequest, json } from '../http/response';
import { authenticateMcp, readMcpConfiguration } from './authentication';
import { createMcpServer } from './server';

const MAX_MCP_BODY_BYTES = 2 * 1024 * 1024;
export async function handleMcpRequest(
  request: Request,
  serviceFactory: (actor: AutomationActor) => AutomationService,
): Promise<Response> {
  const response = await handleRequest(async () => {
    const actor = authenticateMcp(request, readMcpConfiguration(process.env));
    if (request.method !== 'POST')
      return json({ error: 'Este MCP usa Streamable HTTP sem sessão. Utilize POST.' }, 405);
    const server = createMcpServer(serviceFactory(actor), actor.writable);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
      maxRequestBodySize: MAX_MCP_BODY_BYTES,
    });
    try {
      await server.connect(transport);
      const result = await transport.handleRequest(request);
      const body = await result.arrayBuffer();
      return new Response(body.byteLength ? body : null, {
        status: result.status,
        headers: result.headers,
      });
    } finally {
      await server.close();
    }
  });
  response.headers.set('Cache-Control', 'no-store');
  if (response.status === 401)
    response.headers.set('WWW-Authenticate', 'Bearer realm="interview-copilot"');
  if (response.status === 405) response.headers.set('Allow', 'POST');
  return response;
}
