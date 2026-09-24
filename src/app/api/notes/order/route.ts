import { noteController } from '@/server/composition';
export const runtime = 'nodejs';
export function PUT(request: Request) {
  return noteController(request).reorder(request);
}
