<template>
  <Teleport to="body">
    <Transition name="admin-timeout-dialog">
      <div
        v-if="warningOpen"
        class="admin-timeout-backdrop"
        role="presentation"
      >
        <section
          class="admin-timeout-panel"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="admin-timeout-title"
          aria-describedby="admin-timeout-message"
        >
          <div class="admin-timeout-icon">!</div>

          <div class="admin-timeout-copy">
            <h2 id="admin-timeout-title">Admin session expiring</h2>
            <p id="admin-timeout-message">
              For security, you will be signed out after 30 minutes of inactivity.
              Your session will end in <strong>{{ countdownText }}</strong>.
            </p>
          </div>

          <div class="admin-timeout-actions">
            <button
              type="button"
              class="admin-timeout-button secondary"
              :disabled="signingOut"
              @click="signOutNow"
            >
              Sign Out
            </button>
            <button
              ref="stayButton"
              type="button"
              class="admin-timeout-button primary"
              :disabled="signingOut"
              @click="staySignedIn"
            >
              Stay Signed In
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 5 * 60 * 1000;
const ACTIVITY_WRITE_THROTTLE_MS = 5 * 1000;
const STORAGE_KEY = "kc-admin-last-activity";

const supabase = useSupabaseClient();
const { clearAdminState } = useAdminFetch();

const warningOpen = ref(false);
const signingOut = ref(false);
const remainingMs = ref(WARNING_BEFORE_MS);
const stayButton = ref<HTMLButtonElement | null>(null);

let lastActivity = Date.now();
let lastActivityWrite = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;
let hasExpired = false;

const countdownText = computed(() => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs.value / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
});

const writeActivity = (timestamp: number) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(timestamp));
  } catch {
    // localStorage can be unavailable in privacy-restricted browsers.
  }
};

const recordActivity = () => {
  if (warningOpen.value || signingOut.value || hasExpired) return;

  const now = Date.now();
  lastActivity = now;

  if (now - lastActivityWrite >= ACTIVITY_WRITE_THROTTLE_MS) {
    lastActivityWrite = now;
    writeActivity(now);
  }
};

const staySignedIn = () => {
  const now = Date.now();
  lastActivity = now;
  lastActivityWrite = now;
  hasExpired = false;
  warningOpen.value = false;
  remainingMs.value = WARNING_BEFORE_MS;
  writeActivity(now);
};

const signOutNow = async () => {
  if (signingOut.value) return;
  signingOut.value = true;

  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("ADMIN SESSION TIMEOUT SIGNOUT ERROR:", error);
  } finally {
    clearAdminState();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
    await navigateTo("/auth/signin?reason=admin-timeout");
  }
};

const checkTimeout = async () => {
  if (signingOut.value || hasExpired) return;

  const idleFor = Date.now() - lastActivity;
  const left = IDLE_TIMEOUT_MS - idleFor;

  if (left <= 0) {
    hasExpired = true;
    warningOpen.value = false;
    remainingMs.value = 0;
    await signOutNow();
    return;
  }

  if (left <= WARNING_BEFORE_MS) {
    remainingMs.value = left;
    if (!warningOpen.value) {
      warningOpen.value = true;
      await nextTick();
      stayButton.value?.focus();
    }
  } else {
    warningOpen.value = false;
    remainingMs.value = WARNING_BEFORE_MS;
  }
};

const onStorage = (event: StorageEvent) => {
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  const timestamp = Number(event.newValue);
  if (!Number.isFinite(timestamp) || timestamp <= lastActivity) return;

  lastActivity = timestamp;
  if (!signingOut.value) {
    warningOpen.value = false;
    remainingMs.value = WARNING_BEFORE_MS;
  }
};

const activityEvents: Array<keyof WindowEventMap> = [
  "pointerdown",
  "keydown",
  "touchstart",
  "scroll",
];

onMounted(() => {
  const now = Date.now();
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    // Only reuse a timestamp that is recent enough to represent this admin session.
    lastActivity = Number.isFinite(stored) && stored > now - IDLE_TIMEOUT_MS
      ? stored
      : now;
  } catch {
    lastActivity = now;
  }

  lastActivityWrite = lastActivity;
  writeActivity(lastActivity);

  for (const eventName of activityEvents) {
    window.addEventListener(eventName, recordActivity, { passive: true });
  }
  window.addEventListener("storage", onStorage);

  intervalId = setInterval(() => {
    void checkTimeout();
  }, 1000);

  void checkTimeout();
});

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
  for (const eventName of activityEvents) {
    window.removeEventListener(eventName, recordActivity);
  }
  window.removeEventListener("storage", onStorage);
});
</script>

<style scoped>
.admin-timeout-backdrop{position:fixed;inset:0;z-index:10020;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(15,23,42,.56);backdrop-filter:blur(3px)}
.admin-timeout-panel{width:min(520px,100%);border:1px solid #e2e8f0;border-radius:22px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.28);padding:28px;outline:none;display:grid;grid-template-columns:48px 1fr;gap:16px}
.admin-timeout-icon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:#fff7ed;color:#c2410c;font-size:24px;font-weight:900}
.admin-timeout-copy h2{margin:1px 0 8px;font-size:1.25rem;line-height:1.25;color:#172033}.admin-timeout-copy p{margin:0;color:#536174;line-height:1.55}.admin-timeout-copy strong{color:#172033;font-variant-numeric:tabular-nums}
.admin-timeout-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:10px;margin-top:8px}.admin-timeout-button{border:0;border-radius:10px;padding:10px 18px;font-weight:700;cursor:pointer}.admin-timeout-button:disabled{cursor:not-allowed;opacity:.6}.admin-timeout-button.secondary{background:#eef2f6;color:#334155}.admin-timeout-button.primary{background:#175ea8;color:#fff}.admin-timeout-button:hover:not(:disabled){filter:brightness(.97)}.admin-timeout-button:focus-visible{outline:3px solid rgba(23,94,168,.24);outline-offset:2px}
.admin-timeout-dialog-enter-active,.admin-timeout-dialog-leave-active{transition:opacity .16s ease}.admin-timeout-dialog-enter-active .admin-timeout-panel,.admin-timeout-dialog-leave-active .admin-timeout-panel{transition:transform .16s ease,opacity .16s ease}.admin-timeout-dialog-enter-from,.admin-timeout-dialog-leave-to{opacity:0}.admin-timeout-dialog-enter-from .admin-timeout-panel,.admin-timeout-dialog-leave-to .admin-timeout-panel{transform:translateY(8px) scale(.98);opacity:0}
@media(max-width:560px){.admin-timeout-backdrop{padding:14px}.admin-timeout-panel{padding:22px;grid-template-columns:42px 1fr;border-radius:18px}.admin-timeout-icon{width:42px;height:42px;border-radius:13px}.admin-timeout-actions{flex-direction:column-reverse}.admin-timeout-button{width:100%}}
</style>
