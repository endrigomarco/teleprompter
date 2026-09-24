import { healthController } from '@/server/composition';
export const dynamic = 'force-dynamic';
export async function GET(): Promise<Response> {
  return healthController().read();
}
