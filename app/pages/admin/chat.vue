<template>
  <div class="p-4 sm:p-6">
    <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm font-bold uppercase tracking-wider text-blue-600">Customer Support</p>
        <h1 class="text-2xl font-black text-slate-900">Live Chat</h1>
        <p class="mt-1 text-sm text-slate-500">Reply to website visitors and customers.</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" class="kc-btn-secondary" @click="refreshAll">Refresh</button>
      </div>
    </div>


    <div class="grid min-h-[70vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
      <aside class="border-b border-slate-200 lg:border-b-0 lg:border-r">
        <div class="flex gap-2 border-b border-slate-200 p-3">
          <button
            v-for="option in ['all','open','closed']"
            :key="option"
            type="button"
            class="rounded-lg px-3 py-2 text-xs font-bold capitalize"
            :class="filter === option ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'"
            @click="filter = option; loadConversations()"
          >
            {{ option }}
          </button>
        </div>

        <div class="max-h-[70vh] overflow-y-auto">
          <button
            v-for="chat in conversations"
            :key="chat.id"
            type="button"
            class="w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50"
            :class="selectedId === chat.id ? 'bg-blue-50' : ''"
            @click="selectConversation(chat.id)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate font-bold text-slate-900">{{ chat.customer_name || chat.customer_email || "Website visitor" }}</p>
                <p class="truncate text-xs text-slate-500">{{ chat.customer_email || "Signed-in customer" }}</p>
              </div>
              <span v-if="chat.unread_admin" class="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-black text-white">
                {{ chat.unread_admin }}
              </span>
            </div>
            <div class="mt-2 flex items-center justify-between text-[11px]">
              <span class="rounded-full px-2 py-0.5 font-bold" :class="chat.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'">
                {{ chat.status }}
              </span>
              <span class="text-slate-400">{{ formatDate(chat.last_message_at) }}</span>
            </div>
          </button>

          <div v-if="!loadingList && !conversations.length" class="p-8 text-center text-sm text-slate-500">
            No chats found.
          </div>
        </div>
      </aside>

      <section class="flex min-h-[520px] flex-col">
        <template v-if="selectedConversation">
          <header class="flex flex-col gap-2 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="font-black text-slate-900">{{ selectedConversation.customer_name || "Customer" }}</p>
              <p class="text-xs text-slate-500">{{ selectedConversation.customer_email || "No email" }}</p>
              <p v-if="selectedConversation.page_title" class="mt-1 text-xs text-slate-400">
                Started from: {{ selectedConversation.page_title }}
              </p>
            </div>

            <button
              type="button"
              class="kc-btn-secondary"
              @click="setStatus(selectedConversation.status === 'open' ? 'closed' : 'open')"
            >
              {{ selectedConversation.status === "open" ? "Close chat" : "Reopen chat" }}
            </button>
          </header>

          <div ref="messagePane" class="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            <div
              v-for="item in messages"
              :key="item.id"
              class="flex"
              :class="item.sender_type === 'admin' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm"
                :class="item.sender_type === 'admin'
                  ? 'rounded-br-md bg-blue-600 text-white'
                  : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'"
              >
                <p class="whitespace-pre-wrap break-words">{{ item.message }}</p>
                <p class="mt-1 text-[10px]" :class="item.sender_type === 'admin' ? 'text-blue-100' : 'text-slate-400'">
                  {{ formatDateTime(item.created_at) }}
                </p>
              </div>
            </div>
          </div>

          <form class="border-t border-slate-200 p-3" @submit.prevent="sendReply">
            <div class="flex items-end gap-2">
              <textarea
                v-model="draft"
                rows="2"
                maxlength="4000"
                class="min-h-[48px] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2.5"
                placeholder="Type your reply…"
                @keydown.enter.exact.prevent="sendReply"
              />
              <button class="kc-btn-primary min-h-[48px]" :disabled="sending || !draft.trim()">
                {{ sending ? "Sending…" : "Send" }}
              </button>
            </div>
          </form>
        </template>

        <div v-else class="flex flex-1 items-center justify-center p-8 text-center text-slate-500">
          <div>
            <div class="text-5xl">💬</div>
            <p class="mt-3 font-bold text-slate-700">Choose a conversation</p>
            <p class="mt-1 text-sm">New customer chats will appear here automatically.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useSeoMeta({ robots: "noindex, nofollow" });
useHead({
  link: [{ rel: "manifest", href: "/kc-chat.webmanifest" }],
  meta: [
    { name: "theme-color", content: "#0f172a" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    { name: "apple-mobile-web-app-title", content: "KC Chat" },
  ],
});

const route = useRoute();
const router = useRouter();
const { adminFetch } = useAdminFetch();
const conversations = ref<any[]>([]);
const selectedId = ref("");
const selectedConversation = ref<any>(null);
const messages = ref<any[]>([]);
const filter = ref("all");
const draft = ref("");
const sending = ref(false);
const loadingList = ref(false);
const messagePane = ref<HTMLElement | null>(null);
let listTimer: ReturnType<typeof setInterval> | null = null;
let detailTimer: ReturnType<typeof setInterval> | null = null;


const scrollBottom = async () => {
  await nextTick();
  if (messagePane.value) messagePane.value.scrollTop = messagePane.value.scrollHeight;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));
const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));

const loadConversations = async () => {
  loadingList.value = true;
  try {
    const result = await adminFetch<any>("/api/admin/chat", { query: { status: filter.value } });
    conversations.value = result.conversations || [];
  } finally {
    loadingList.value = false;
  }
};

const loadSelected = async (quiet = false) => {
  if (!selectedId.value) return;
  try {
    const result = await adminFetch<any>(`/api/admin/chat/${selectedId.value}`);
    const oldCount = messages.value.length;
    selectedConversation.value = result.conversation;
    messages.value = result.messages || [];
    if (!quiet || messages.value.length !== oldCount) await scrollBottom();
    const found = conversations.value.find((c) => c.id === selectedId.value);
    if (found) found.unread_admin = 0;
  } catch {}
};

const selectConversation = async (id: string) => {
  selectedId.value = id;
  router.replace({ query: { ...route.query, conversation: id } });
  await loadSelected();
};

const sendReply = async () => {
  const message = draft.value.trim();
  if (!message || !selectedId.value || sending.value) return;
  sending.value = true;
  try {
    const result = await adminFetch<any>(`/api/admin/chat/${selectedId.value}/message`, {
      method: "POST",
      body: { message },
    });
    messages.value.push(result.message);
    draft.value = "";
    if (selectedConversation.value) selectedConversation.value.status = "open";
    await scrollBottom();
    await loadConversations();
  } finally {
    sending.value = false;
  }
};

const setStatus = async (status: "open" | "closed") => {
  if (!selectedId.value) return;
  await adminFetch(`/api/admin/chat/${selectedId.value}/status`, {
    method: "PUT",
    body: { status },
  });
  if (selectedConversation.value) selectedConversation.value.status = status;
  await loadConversations();
};


const refreshAll = async () => {
  await loadConversations();
  await loadSelected();
};

onMounted(async () => {
  await loadConversations();

  const requested = typeof route.query.conversation === "string" ? route.query.conversation : "";
  if (requested) await selectConversation(requested);

  listTimer = setInterval(loadConversations, 5000);
  detailTimer = setInterval(() => loadSelected(true), 2500);
});

onBeforeUnmount(() => {
  if (listTimer) clearInterval(listTimer);
  if (detailTimer) clearInterval(detailTimer);
});
</script>
