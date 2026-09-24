import { noteController } from '@/server/composition';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  return noteController(request).list();
}
export function POST(request: Request) {
  return noteController(request).create(request);
}
