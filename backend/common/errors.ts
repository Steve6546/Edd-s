import { APIError } from "encore.dev/api";

export enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  RATE_LIMIT = "RATE_LIMIT",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  userMessage: string;
  statusCode: number;
  details?: Record<string, any>;
}

const errorDefinitions: Record<ErrorCode, Omit<ErrorDetails, "details">> = {
  [ErrorCode.BAD_REQUEST]: {
    code: ErrorCode.BAD_REQUEST,
    message: "Bad request",
    userMessage: "The request was invalid. Please check your input and try again.",
    statusCode: 400,
  },
  [ErrorCode.UNAUTHORIZED]: {
    code: ErrorCode.UNAUTHORIZED,
    message: "Unauthorized",
    userMessage: "You must be logged in to perform this action.",
    statusCode: 401,
  },
  [ErrorCode.FORBIDDEN]: {
    code: ErrorCode.FORBIDDEN,
    message: "Forbidden",
    userMessage: "You don't have permission to perform this action.",
    statusCode: 403,
  },
  [ErrorCode.NOT_FOUND]: {
    code: ErrorCode.NOT_FOUND,
    message: "Resource not found",
    userMessage: "The requested resource could not be found.",
    statusCode: 404,
  },
  [ErrorCode.CONFLICT]: {
    code: ErrorCode.CONFLICT,
    message: "Conflict",
    userMessage: "This action conflicts with existing data.",
    statusCode: 409,
  },
  [ErrorCode.VALIDATION_ERROR]: {
    code: ErrorCode.VALIDATION_ERROR,
    message: "Validation failed",
    userMessage: "Please check your input and try again.",
    statusCode: 422,
  },
  [ErrorCode.INTERNAL_ERROR]: {
    code: ErrorCode.INTERNAL_ERROR,
    message: "Internal server error",
    userMessage: "Something went wrong. Please try again later.",
    statusCode: 500,
  },
  [ErrorCode.DATABASE_ERROR]: {
    code: ErrorCode.DATABASE_ERROR,
    message: "Database error",
    userMessage: "We're experiencing technical difficulties. Please try again later.",
    statusCode: 500,
  },
  [ErrorCode.NETWORK_ERROR]: {
    code: ErrorCode.NETWORK_ERROR,
    message: "Network error",
    userMessage: "Network error occurred. Please check your connection and try again.",
    statusCode: 503,
  },
  [ErrorCode.RATE_LIMIT]: {
    code: ErrorCode.RATE_LIMIT,
    message: "Rate limit exceeded",
    userMessage: "Too many requests. Please slow down and try again later.",
    statusCode: 429,
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    code: ErrorCode.SERVICE_UNAVAILABLE,
    message: "Service unavailable",
    userMessage: "The service is temporarily unavailable. Please try again later.",
    statusCode: 503,
  },
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly userMessage: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    code: ErrorCode,
    message?: string,
    userMessage?: string,
    details?: Record<string, any>
  ) {
    const errorDef = errorDefinitions[code];
    super(message || errorDef.message);
    this.code = code;
    this.userMessage = userMessage || errorDef.userMessage;
    this.statusCode = errorDef.statusCode;
    this.details = details;
    this.timestamp = new Date();
    this.name = "AppError";
  }

  toJSON() {
    return {
      code: this.code,
      message: this.userMessage,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
    };
  }

  toAPIError(): APIError {
    const error = this.details ? new Error(this.userMessage) : undefined;
    return APIError.aborted(this.userMessage, error);
  }
}

export function createError(
  code: ErrorCode,
  message?: string,
  userMessage?: string,
  details?: Record<string, any>
): AppError {
  return new AppError(code, message, userMessage, details);
}

export function badRequest(
  message?: string,
  details?: Record<string, any>
): AppError {
  return createError(ErrorCode.BAD_REQUEST, message, undefined, details);
}

export function unauthorized(
  message?: string,
  details?: Record<string, any>
): AppError {
  return createError(ErrorCode.UNAUTHORIZED, message, undefined, details);
}

export function forbidden(
  message?: string,
  details?: Record<string, any>
): AppError {
  return createError(ErrorCode.FORBIDDEN, message, undefined, details);
}

export function notFound(
  resource: string,
  details?: Record<string, any>
): AppError {
  return createError(
    ErrorCode.NOT_FOUND,
    `${resource} not found`,
    `The requested ${resource.toLowerCase()} could not be found.`,
    details
  );
}

export function conflict(
  message?: string,
  details?: Record<string, any>
): AppError {
  return createError(ErrorCode.CONFLICT, message, undefined, details);
}

export function validationError(
  message?: string,
  details?: Record<string, any>
): AppError {
  return createError(ErrorCode.VALIDATION_ERROR, message, undefined, details);
}

export function internalError(
  message?: string,
  details?: Record<string, any>
): AppError {
  return createError(ErrorCode.INTERNAL_ERROR, message, undefined, details);
}

export function databaseError(
  message?: string,
  details?: Record<string, any>
): AppError {
  return createError(ErrorCode.DATABASE_ERROR, message, undefined, details);
}

export function handleError(error: unknown, context?: string): never {
  if (error instanceof AppError) {
    logError(error, context);
    throw error.toAPIError();
  }

  if (error instanceof Error) {
    const appError = internalError(error.message, {
      stack: error.stack,
      originalError: error.name,
    });
    logError(appError, context);
    throw appError.toAPIError();
  }

  const unknownError = internalError("An unknown error occurred", {
    error: String(error),
  });
  logError(unknownError, context);
  throw unknownError.toAPIError();
}

export function logError(error: AppError, context?: string): void {
  const logData = {
    timestamp: error.timestamp.toISOString(),
    code: error.code,
    message: error.message,
    userMessage: error.userMessage,
    statusCode: error.statusCode,
    context,
    details: error.details,
  };

  if (error.statusCode >= 500) {
    console.error("[ERROR]", JSON.stringify(logData, null, 2));
  } else if (error.statusCode >= 400) {
    console.warn("[WARN]", JSON.stringify(logData, null, 2));
  } else {
    console.info("[INFO]", JSON.stringify(logData, null, 2));
  }
}

export function wrapAsync<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T> {
  return fn().catch((error) => {
    handleError(error, context);
  });
}
