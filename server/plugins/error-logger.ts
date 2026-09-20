export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("error", (error, context) => {
    const event = context?.event;
    const requestId = String(event?.context?.requestId || "unknown");
    const method = event?.method || "UNKNOWN";
    const path = event ? getRequestURL(event).pathname : "unknown";
    const status = Number((error as any)?.statusCode || (error as any)?.status || 500);

    // Keep server diagnostics useful without dumping request bodies, auth tokens,
    // cookies, Stripe metadata or other customer information into logs.
    console.error(`[${requestId}] ${method} ${path} -> ${status}`, {
      name: (error as any)?.name || "Error",
      message: (error as any)?.message || "Unexpected server error",
    });

    // Never return raw database, Stripe, Microsoft Graph or infrastructure
    // messages to the browser. Admins can use the request ID to match the
    // customer's error to the private server log.
    if (status >= 500) {
      (error as any).statusMessage = "Something went wrong on our side. Please try again.";
      (error as any).data = requestId !== "unknown" ? { requestId } : undefined;
    }
  });
});
