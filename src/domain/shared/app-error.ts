export type AppErrorCode = 'not_found' | 'conflict' | 'forbidden';
export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
  }
}
