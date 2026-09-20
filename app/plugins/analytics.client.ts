const SESSION_KEY = "kc_analytics_session";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

type StoredSession = {
  id: string;
  lastActivity: number;
};

const excludedPath = (path: string) =>
  path.startsWith("/admin") ||
  path.startsWith("/auth") ||
  path.startsWith("/account") ||
  path.startsWith("/checkout") ||
  path.startsWith("/api");

const getSessionId = () => {
  const now = Date.now();

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as StoredSession;
      if (
        stored?.id &&
        Number.isFinite(stored.lastActivity) &&
        now - stored.lastActivity < SESSION_TIMEOUT_MS
      ) {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ id: stored.id, lastActivity: now }),
        );
        return stored.id;
      }
    }
  } catch {
    // A blocked/disabled localStorage should never interfere with shopping.
  }

  const id =
    typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
          const random = Math.floor(Math.random() * 16);
          const value = char === "x" ? random : (random & 0x3) | 0x8;
          return value.toString(16);
        });

  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ id, lastActivity: now }),
    );
  } catch {
    // Analytics is optional.
  }

  return id;
};

export default defineNuxtPlugin((nuxtApp) => {
  let lastTrackedPath = "";

  const track = async () => {
    const route = useRoute();
    const path = String(route.path || "/");

    if (excludedPath(path) || path === lastTrackedPath) return;
    lastTrackedPath = path;

    const sessionId = getSessionId();
    if (!sessionId) return;

    try {
      await $fetch("/api/analytics/page-view", {
        method: "POST",
        body: {
          sessionId,
          path,
          title: document.title || "",
          referrer: document.referrer || "",
        },
      });
    } catch {
      // Analytics must never interrupt the customer experience.
    }
  };

  nuxtApp.hook("page:finish", () => {
    void track();
  });
});
