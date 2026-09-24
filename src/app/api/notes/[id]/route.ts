import { noteController } from '@/server/composition';
export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  return noteController(request).update(request, (await context.params).id);
}
export async function DELETE(request: Request, context: Context) {
  return noteController(request).delete(request, (await context.params).id);
}
