import { randomBytes } from 'node:crypto';
import { readFile, writeFile, chmod } from 'node:fs/promises';
import { reportFailure } from '../src/server/logging/diagnostics';

async function main(): Promise<void> {
  let content = await readFile('.env', 'utf8');
  const defaults = {
    MCP_SERVER_URL: 'http://localhost:8765/api/mcp',
    MCP_ACCESS_TOKEN: randomBytes(32).toString('hex'),
    MCP_READ_ONLY_TOKEN: randomBytes(32).toString('hex'),
    MCP_PROJECT_IDS: '*',
  };
  for (const [key, value] of Object.entries(defaults)) {
    const pattern = new RegExp('^' + key + '=(.*)$', 'm');
    const existing = pattern.exec(content);
    if (!existing) content += '\n' + key + '=' + value + '\n';
    else if (!existing[1].trim() || ['""', "''"].includes(existing[1].trim()))
      content = content.replace(pattern, key + '=' + value);
  }
  await writeFile('.env', content, { mode: 0o600 });
  await chmod('.env', 0o600);
  console.log(
    'MCP configurado no .env. Credenciais existentes preservadas. Reinicie a aplicação para aplicar.',
  );
}
main().catch(() => {
  reportFailure('mcp_configuration_failure');
  process.exitCode = 1;
});
