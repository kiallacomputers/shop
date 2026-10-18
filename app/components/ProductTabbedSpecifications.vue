<template>
  <section class="my-6 text-slate-800">
    <h3 v-if="block.text" class="mb-6 text-center text-2xl font-bold sm:text-3xl">{{ block.text }}</h3>
    <div v-if="tabs.length > 1" class="grid gap-1" :style="{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }" role="tablist" :aria-label="block.text || 'Specifications'">
      <button v-for="(tab, index) in tabs" :key="index" type="button" role="tab"
        :id="`spec-tab-${uid}-${index}`" :aria-controls="`spec-panel-${uid}`" :aria-selected="active === index" :tabindex="active === index ? 0 : -1"
        class="rounded-t-md px-2 py-3 text-xs font-semibold transition-colors sm:text-base"
        :class="active === index ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'"
        @click="active = index" @keydown.right.prevent="active = (active + 1) % tabs.length" @keydown.left.prevent="active = (active + tabs.length - 1) % tabs.length">
        {{ tab.title }}
      </button>
    </div>
    <div v-if="tabs.length" :id="`spec-panel-${uid}`"  :role="tabs.length > 1 ? 'tabpanel' : undefined" :aria-labelledby="tabs.length > 1 ? `spec-tab-${uid}-${active}` : undefined" class="pt-6">
      <div class="spec-columns">
        <div v-for="(spec, index) in tabs[active]?.specs || []" :key="index" class="mb-5 break-inside-avoid">
          <h4 class="font-semibold text-slate-900">{{ spec.label }}</h4>
          <p class="mt-1 whitespace-pre-line leading-relaxed text-slate-700">{{ spec.value }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ block: { text?: string; tabs?: Array<{ title: string; specs: Array<{ label: string; value: string }> }> } }>();
const uid = useId();
const active = ref(0);
const tabs = computed(() => (props.block.tabs || []).slice(0, 4).filter(t => t && typeof t.title === 'string'));
watch(tabs, () => { if (active.value >= tabs.value.length) active.value = 0; });
</script>

<style scoped>
.spec-columns { column-count: 1; column-gap: 2rem; }
@media (min-width: 768px) { .spec-columns { column-count: 2; } }
</style>
