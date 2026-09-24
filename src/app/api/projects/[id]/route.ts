import { projectController } from '@/server/composition';
export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  return projectController().update(request, (await context.params).id);
}
export async function DELETE(request: Request, context: Context) {
  return projectController().delete(request, (await context.params).id);
}
