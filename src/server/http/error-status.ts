import { ZodError } from 'zod';
import { AppError, type AppErrorCode } from '@/domain/shared/app-error';
import { HttpError } from './http-error';
const statusByCode: Record<AppErrorCode, number> = {
  not_found: 404,
  conflict: 409,
  forbidden: 403,
};
export function errorStatus(error: unknown): number {
  if (error instanceof AppError) return statusByCode[error.code];
  if (error instanceof HttpError) return error.status;
  if (error instanceof ZodError) return 400;
  return 503;
}
export function isExpectedError(error: unknown): error is AppError | HttpError | ZodError {
  return error instanceof AppError || error instanceof HttpError || error instanceof ZodError;
}
