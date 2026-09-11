import type { H3Event } from "h3";

export const throwInternalError = (
  event: H3Event,
  label: string,
  error: unknown,
  publicMessage = "Something went wrong. Please try again.",
): never => {
  const requestId = String(event.context.requestId || "unknown");
  console.error(`[${requestId}] ${label}:`, error);

  throw createError({
    statusCode: 500,
    statusMessage: publicMessage,
    data: requestId !== "unknown" ? { requestId } : undefined,
  });
};
