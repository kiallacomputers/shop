<template>
  <Teleport to="body">
    <Transition name="app-dialog">
      <div v-if="request" class="dialog-backdrop" role="presentation" @mousedown.self="cancel">
        <section
          ref="panel"
          class="dialog-panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`app-dialog-title-${request.id}`"
          @keydown.esc.prevent="cancel"
        >
          <div class="dialog-icon" :class="{ danger: request.tone === 'danger' }">
            {{ request.kind === 'prompt' ? '✎' : request.tone === 'danger' ? '!' : request.kind === 'confirm' ? '?' : 'i' }}
          </div>
          <div class="dialog-copy">
            <h2 :id="`app-dialog-title-${request.id}`">{{ request.title }}</h2>
            <p>{{ request.message }}</p>
            <input
              v-if="request.kind === 'prompt'"
              ref="input"
              v-model="inputValue"
              class="dialog-input"
              :placeholder="request.placeholder"
              @keyup.enter="accept"
            />
          </div>
          <div class="dialog-actions">
            <button v-if="request.kind !== 'alert'" type="button" class="dialog-button secondary" @click="cancel">
              {{ request.cancelText }}
            </button>
            <button
              type="button"
              class="dialog-button primary"
              :class="{ danger: request.tone === 'danger' }"
              @click="accept"
            >
              {{ request.confirmText }}
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { request, resolve } = useAppDialog();
const inputValue = ref("");
const input = ref<HTMLInputElement | null>(null);
const panel = ref<HTMLElement | null>(null);

watch(request, async (next) => {
  if (!next) return;
  inputValue.value = next.value || "";
  await nextTick();
  if (next.kind === "prompt") {
    input.value?.focus();
    input.value?.select();
  } else {
    panel.value?.focus();
  }
});

const accept = () => {
  if (!request.value) return;
  resolve(request.value.kind === "prompt" ? inputValue.value : true);
};

const cancel = () => {
  if (!request.value) return;
  resolve(request.value.kind === "prompt" ? null : false);
};
</script>

<style scoped>
.dialog-backdrop{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(15,23,42,.56);backdrop-filter:blur(3px)}
.dialog-panel{width:min(520px,100%);border:1px solid #e2e8f0;border-radius:22px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.28);padding:28px;outline:none;display:grid;grid-template-columns:48px 1fr;gap:16px}
.dialog-icon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:#eaf3ff;color:#175ea8;font-size:24px;font-weight:800}.dialog-icon.danger{background:#fff0f0;color:#b42318}
.dialog-copy h2{margin:1px 0 8px;font-size:1.25rem;line-height:1.25;color:#172033}.dialog-copy p{margin:0;white-space:pre-line;color:#536174;line-height:1.55}
.dialog-input{width:100%;margin-top:18px;padding:11px 13px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#172033;font:inherit;outline:none}.dialog-input:focus{border-color:#4f8fd8;box-shadow:0 0 0 3px rgba(79,143,216,.15)}
.dialog-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:10px;margin-top:8px}.dialog-button{border:0;border-radius:10px;padding:10px 18px;font-weight:700;cursor:pointer}.dialog-button.secondary{background:#eef2f6;color:#334155}.dialog-button.primary{background:#175ea8;color:#fff}.dialog-button.primary.danger{background:#b42318}.dialog-button:hover{filter:brightness(.97)}
.app-dialog-enter-active,.app-dialog-leave-active{transition:opacity .16s ease}.app-dialog-enter-active .dialog-panel,.app-dialog-leave-active .dialog-panel{transition:transform .16s ease,opacity .16s ease}.app-dialog-enter-from,.app-dialog-leave-to{opacity:0}.app-dialog-enter-from .dialog-panel,.app-dialog-leave-to .dialog-panel{transform:translateY(8px) scale(.98);opacity:0}
@media(max-width:560px){.dialog-backdrop{padding:14px}.dialog-panel{padding:22px;grid-template-columns:42px 1fr;border-radius:18px}.dialog-icon{width:42px;height:42px;border-radius:13px}.dialog-actions{flex-direction:column-reverse}.dialog-button{width:100%}}
</style>
