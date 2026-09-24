import { mcpHandler } from '@/server/composition';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = mcpHandler;
export const GET = mcpHandler;
export const DELETE = mcpHandler;
