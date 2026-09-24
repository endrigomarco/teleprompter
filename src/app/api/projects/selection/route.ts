import { projectController } from '@/server/composition';
export const runtime = 'nodejs';
export function PUT(request: Request) {
  return projectController().select(request);
}
