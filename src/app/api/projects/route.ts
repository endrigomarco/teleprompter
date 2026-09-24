import { projectController } from '@/server/composition';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET() {
  return projectController().list();
}
export function POST(request: Request) {
  return projectController().create(request);
}
