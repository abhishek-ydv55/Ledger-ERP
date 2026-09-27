export interface AppError {
  code?: string;
  message: string;
  errors?: string[] | null;
  status?: number;
  timestamp?: string;
}
