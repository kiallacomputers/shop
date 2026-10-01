import type { H3Event } from "h3";
import { redactSensitive } from "~~/server/utils/secretRedaction";

export const throwInternalError = (
  event: H3Event,
  label: string,
  error: unknown,
  publicMessage = "Something went wrong. Please try again.",
): never => {
  const requestId = String(event.context.requestId || "unknown");
  console.error(`[${requestId}] ${label}:`, redactSensitive(error));

  throw createError({
    statusCode: 500,
    statusMessage: publicMessage,
    data: requestId !== "unknown" ? { requestId } : undefined,
  });
};
