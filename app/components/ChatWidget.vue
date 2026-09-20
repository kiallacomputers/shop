<template>
  <div class="fixed bottom-5 right-5 z-[60]">
    <button
      v-if="!open"
      type="button"
      class="flex h-14 items-center gap-2 rounded-full bg-blue-600 px-5 font-bold text-white shadow-xl transition hover:bg-blue-700"
      aria-label="Chat with Kialla Computers"
      @click="open = true"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h8M8 14h5M21 12a8 8 0 0 1-8 8H6l-4 2 1.3-4A8 8 0 1 1 21 12Z"/>
      </svg>
      Chat with us
      <span v-if="unreadCount" class="rounded-full bg-white px-2 py-0.5 text-xs text-blue-700">{{ unreadCount }}</span>
    </button>

    <section
      v-else
      class="flex h-[min(620px,78vh)] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
    >
      <header class="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
        <div>
          <p class="font-black">Kialla Computers</p>
          <p class="text-xs text-slate-300">Live chat</p>
        </div>
        <button type="button" class="rounded-lg p-2 hover:bg-white/10" aria-label="Close chat" @click="open = false">✕</button>
      </header>

      <div v-if="!conversationId" class="flex-1 overflow-y-auto p-4">
        <h2 class="text-lg font-black text-slate-900">How can we help?</h2>
        <p class="mt-1 text-sm text-slate-500">Send us a message and we’ll reply here.</p>

        <form class="mt-5 space-y-4" @submit.prevent="startChat">
          <label v-if="!signedIn" class="block">
            <span class="kc-field-label">Name</span>
            <input v-model="name" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" required maxlength="160" />
          </label>

          <label v-if="!signedIn" class="block">
            <span class="kc-field-label">Email</span>
            <input v-model="email" type="email" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" required maxlength="320" />
          </label>

          <label class="block">
            <span class="kc-field-label">Message</span>
            <textarea
              v-model="draft"
              rows="5"
              class="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5"
              placeholder="Type your message..."
              required
              maxlength="4000"
            />
          </label>

          <div v-if="errorMessage" class="kc-alert kc-alert-error">{{ errorMessage }}</div>

          <button type="submit" class="kc-btn-primary w-full" :disabled="sending">
            {{ sending ? "Starting chat…" : "Start chat" }}
          </button>
        </form>
      </div>

      <template v-else>
        <div ref="messagePane" class="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
          <div
            v-for="item in messages"
            :key="item.id"
            class="flex"
            :class="item.sender_type === 'customer' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm"
              :class="item.sender_type === 'customer'
                ? 'rounded-br-md bg-blue-600 text-white'
                : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'"
            >
              <p class="whitespace-pre-wrap break-words">{{ item.message }}</p>
              <p
                class="mt-1 text-[10px]"
                :class="item.sender_type === 'customer' ? 'text-blue-100' : 'text-slate-400'"
              >
                {{ formatTime(item.created_at) }}
              </p>
            </div>
          </div>

          <div v-if="conversationStatus === 'closed'" class="rounded-xl bg-slate-200 p-3 text-center text-xs font-semibold text-slate-600">
            This conversation was closed. Sending another message will reopen it.
          </div>
        </div>

        <form class="border-t border-slate-200 bg-white p-3" @submit.prevent="sendMessage">
          <div class="flex items-end gap-2">
            <textarea
              v-model="draft"
              rows="2"
              class="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Type a message…"
              maxlength="4000"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <button type="submit" class="kc-btn-primary min-h-[44px] px-4" :disabled="sending || !draft.trim()">
              Send
            </button>
          </div>
          <p v-if="errorMessage" class="mt-2 text-xs font-semibold text-red-600">{{ errorMessage }}</p>
        </form>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
const STORAGE_KEY = "kc_chat_session_v1";
const open = ref(false);
const name = ref("");
const email = ref("");
const draft = ref("");
const sending = ref(false);
const errorMessage = ref("");
const conversationId = ref("");
const token = ref("");
const conversationStatus = ref("open");
const messages = ref<any[]>([]);
const unreadCount = ref(0);
const messagePane = ref<HTMLElement | null>(null);
const user = useSupabaseUser();
const route = useRoute();
let pollTimer: ReturnType<typeof setInterval> | null = null;
let lastAdminMessageId = "";

const signedIn = computed(() => Boolean(user.value));

const scrollBottom = async () => {
  await nextTick();
  if (messagePane.value) messagePane.value.scrollTop = messagePane.value.scrollHeight;
};

const saveSession = () => {
  if (!import.meta.client || !conversationId.value || !token.value) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: conversationId.value, token: token.value }));
};

const clearSession = () => {
  if (import.meta.client) localStorage.removeItem(STORAGE_KEY);
  conversationId.value = "";
  token.value = "";
  messages.value = [];
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const loadMessages = async (quiet = false) => {
  if (!conversationId.value || !token.value) return;
  try {
    const result = await $fetch<any>(`/api/chat/${conversationId.value}`, {
      query: { token: token.value },
      credentials: "include",
    });

    const previousIds = new Set(messages.value.map((m) => m.id));
    messages.value = result.messages || [];
    conversationStatus.value = result.conversation?.status || "open";

    const newAdmin = messages.value.filter(
      (m) => m.sender_type === "admin" && !previousIds.has(m.id),
    );
    if (!open.value && newAdmin.length) unreadCount.value += newAdmin.length;

    const adminMessages = messages.value.filter((m) => m.sender_type === "admin");
    lastAdminMessageId = adminMessages.at(-1)?.id || lastAdminMessageId;

    if (open.value && Number(result.conversation?.unread_customer || 0) > 0) {
      await $fetch(`/api/chat/${conversationId.value}/read`, {
        method: "POST",
        credentials: "include",
        body: { token: token.value },
      }).catch(() => {});
      unreadCount.value = 0;
    }

    if (!quiet || newAdmin.length) await scrollBottom();
  } catch (error: any) {
    if ([403, 404].includes(Number(error?.statusCode || error?.status || 0))) clearSession();
  }
};

const startChat = async () => {
  if (!draft.value.trim() || sending.value) return;
  sending.value = true;
  errorMessage.value = "";
  try {
    const result = await $fetch<any>("/api/chat/start", {
      method: "POST",
      credentials: "include",
      body: {
        name: name.value.trim(),
        email: email.value.trim(),
        message: draft.value.trim(),
        pageUrl: window.location.href,
        pageTitle: document.title,
      },
    });
    conversationId.value = result.conversation.id;
    token.value = result.token;
    conversationStatus.value = result.conversation.status;
    messages.value = result.messages || [];
    draft.value = "";
    saveSession();
    await scrollBottom();
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Unable to start chat.";
  } finally {
    sending.value = false;
  }
};

const sendMessage = async () => {
  const message = draft.value.trim();
  if (!message || sending.value || !conversationId.value) return;
  sending.value = true;
  errorMessage.value = "";
  try {
    const result = await $fetch<any>(`/api/chat/${conversationId.value}/message`, {
      method: "POST",
      credentials: "include",
      body: { token: token.value, message },
    });
    messages.value.push(result.message);
    conversationStatus.value = "open";
    draft.value = "";
    await scrollBottom();
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Unable to send message.";
  } finally {
    sending.value = false;
  }
};

watch(open, async (value) => {
  if (value && conversationId.value) {
    unreadCount.value = 0;
    await loadMessages();
  }
});

onMounted(async () => {
  if (user.value) {
    name.value = String(user.value.user_metadata?.display_name || "");
    email.value = String(user.value.email || "");
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      conversationId.value = String(saved?.id || "");
      token.value = String(saved?.token || "");
    } catch {}
  }
  if (conversationId.value && token.value) await loadMessages();
  pollTimer = setInterval(() => loadMessages(true), 4000);
});

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>
