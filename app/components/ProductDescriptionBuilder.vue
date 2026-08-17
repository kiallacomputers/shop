<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="font-semibold text-slate-900">Description Builder</h3>
        <p class="mt-1 text-sm text-slate-500">Add content blocks and arrange them in the order customers should see them.</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <select v-model="newBlockType" class="input min-w-[170px] text-sm">
          <option value="heading">Heading</option>
          <option value="paragraph">Paragraph</option>
          <option value="list">List</option>
          <option value="table">Table</option>
          <option value="quote">Quote</option>
          <option value="warning">Warning</option>
          <option value="info">Info Box</option>
          <option value="divider">Divider</option>
        </select>
        <button type="button" class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700" @click="addBlock">
          + Add Block
        </button>
      </div>
    </div>

    <div v-if="!blocks.length" class="rounded-xl border-2 border-dashed border-slate-300 p-10 text-center">
      <p class="font-semibold text-slate-700">No description blocks yet</p>
      <p class="mt-1 text-sm text-slate-500">Choose a block type above and click Add Block.</p>
    </div>

    <article v-for="(block, index) in blocks" :key="block._key" class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div class="flex items-center gap-3">
          <span class="flex h-7 w-7 items-center justify-center rounded-md bg-slate-200 text-xs font-bold text-slate-600">{{ index + 1 }}</span>
          <div>
            <p class="text-sm font-bold text-slate-800">{{ blockLabel(block.type) }}</p>
            <p class="text-xs text-slate-500">{{ block.type }}</p>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <button type="button" :disabled="index === 0" class="block-action" title="Move up" @click="moveBlock(index, -1)">↑</button>
          <button type="button" :disabled="index === blocks.length - 1" class="block-action" title="Move down" @click="moveBlock(index, 1)">↓</button>
          <button type="button" class="block-action" title="Duplicate" @click="duplicateBlock(index)">⧉</button>
          <button type="button" class="block-action text-red-600 hover:bg-red-50" title="Delete" @click="removeBlock(index)">×</button>
        </div>
      </header>

      <div class="p-4 sm:p-5">
        <template v-if="block.type === 'heading'">
          <div class="grid gap-4 sm:grid-cols-[150px_1fr]">
            <label>
              <span class="field-label">Heading Size</span>
              <select v-model.number="block.level" class="input">
                <option :value="2">Heading 2</option>
                <option :value="3">Heading 3</option>
                <option :value="4">Heading 4</option>
              </select>
            </label>
            <label>
              <span class="field-label">Heading Text</span>
              <input v-model="block.text" type="text" class="input" placeholder="e.g. CPU Specifications" />
            </label>
          </div>
        </template>

        <template v-else-if="block.type === 'paragraph'">
          <label>
            <span class="field-label">Paragraph</span>
            <textarea v-model="block.text" rows="5" class="input" placeholder="Enter product information..."></textarea>
          </label>
        </template>

        <template v-else-if="block.type === 'quote' || block.type === 'warning' || block.type === 'info'">
          <label>
            <span class="field-label">{{ blockLabel(block.type) }} Text</span>
            <textarea v-model="block.text" rows="3" class="input" :placeholder="block.type === 'warning' ? 'Important information for the customer...' : 'Enter text...'"></textarea>
          </label>
        </template>

        <template v-else-if="block.type === 'list'">
          <div class="mb-4 flex flex-wrap items-end gap-4">
            <label class="w-full sm:w-44">
              <span class="field-label">List Style</span>
              <select v-model="block.style" class="input">
                <option value="bullet">Bullet</option>
                <option value="check">Check Marks</option>
                <option value="number">Numbered</option>
              </select>
            </label>
            <button type="button" class="secondary-button" @click="block.items.push('')">+ Add Item</button>
          </div>

          <div class="space-y-2">
            <div v-for="(_item, itemIndex) in block.items" :key="itemIndex" class="flex items-center gap-2">
              <span class="w-6 text-center text-sm font-semibold text-slate-400">{{ itemIndex + 1 }}</span>
              <input v-model="block.items[itemIndex]" type="text" class="input" placeholder="List item" />
              <button type="button" class="remove-small" @click="block.items.splice(itemIndex, 1)">×</button>
            </div>
          </div>
        </template>

        <template v-else-if="block.type === 'table'">
          <div class="mb-4 flex flex-wrap gap-2">
            <button type="button" class="secondary-button" @click="addTableColumn(block)">+ Column</button>
            <button type="button" class="secondary-button" @click="addTableRow(block)">+ Row</button>
            <button v-if="block.headers.length > 1" type="button" class="secondary-button text-red-600" @click="removeTableColumn(block)">− Column</button>
          </div>

          <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="min-w-full border-collapse text-sm">
              <thead class="bg-slate-100">
                <tr>
                  <th v-for="(_header, headerIndex) in block.headers" :key="headerIndex" class="min-w-[180px] border-r border-slate-200 p-2 last:border-r-0">
                    <input v-model="block.headers[headerIndex]" type="text" class="input bg-white font-semibold" :placeholder="`Column ${headerIndex + 1}`" />
                  </th>
                  <th class="w-12 p-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in block.rows" :key="rowIndex" class="border-t border-slate-200">
                  <td v-for="(_cell, cellIndex) in row" :key="cellIndex" class="border-r border-slate-200 p-2 last:border-r-0">
                    <input v-model="row[cellIndex]" type="text" class="input" placeholder="Value" />
                  </td>
                  <td class="p-2 text-center">
                    <button type="button" class="remove-small" title="Remove row" @click="block.rows.splice(rowIndex, 1)">×</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <template v-else-if="block.type === 'divider'">
          <div class="py-4"><hr class="border-slate-300" /></div>
        </template>
      </div>
    </article>

    <details class="rounded-xl border border-slate-200 bg-white">
      <summary class="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700">View generated JSON</summary>
      <pre class="max-h-80 overflow-auto border-t border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">{{ jsonPreview }}</pre>
    </details>
  </div>
</template>

<script setup lang="ts">
type DescriptionBlock = {
  _key: string;
  type: string;
  text?: string;
  level?: number;
  style?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
};

const props = defineProps<{ modelValue: any[] }>();
const emit = defineEmits<{ (event: 'update:modelValue', value: any[]): void }>();

const newBlockType = ref('heading');
const blocks = ref<DescriptionBlock[]>([]);
let syncingFromParent = false;

const makeKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const normaliseBlock = (input: any): DescriptionBlock => {
  const type = input?.type || 'paragraph';
  const base: DescriptionBlock = { ...input, _key: input?._key || makeKey(), type };

  if (type === 'heading') {
    base.text = input?.text || '';
    base.level = Number(input?.level || 2);
  } else if (type === 'list') {
    base.style = input?.style || 'bullet';
    base.items = Array.isArray(input?.items) ? [...input.items] : [''];
  } else if (type === 'table') {
    base.headers = Array.isArray(input?.headers) && input.headers.length ? [...input.headers] : ['Feature', 'Specification'];
    base.rows = Array.isArray(input?.rows) ? input.rows.map((row: any[]) => [...row]) : [['', '']];
    base.rows = base.rows.map((row) => {
      const resized = [...row];
      while (resized.length < base.headers!.length) resized.push('');
      return resized.slice(0, base.headers!.length);
    });
  } else if (type !== 'divider') {
    base.text = input?.text || '';
  }

  return base;
};

const stripInternalFields = (block: DescriptionBlock) => {
  const { _key, ...clean } = block;
  return clean;
};

watch(
  () => props.modelValue,
  (value) => {
    const incoming = Array.isArray(value) ? value : [];
    const currentClean = blocks.value.map(stripInternalFields);
    if (JSON.stringify(incoming) === JSON.stringify(currentClean)) return;
    syncingFromParent = true;
    blocks.value = incoming.map(normaliseBlock);
    nextTick(() => { syncingFromParent = false; });
  },
  { immediate: true, deep: true },
);

watch(
  blocks,
  (value) => {
    if (syncingFromParent) return;
    emit('update:modelValue', value.map(stripInternalFields));
  },
  { deep: true },
);

const createBlock = (type: string): DescriptionBlock => {
  if (type === 'heading') return normaliseBlock({ type, text: '', level: 2 });
  if (type === 'paragraph') return normaliseBlock({ type, text: '' });
  if (type === 'list') return normaliseBlock({ type, style: 'bullet', items: ['', ''] });
  if (type === 'table') return normaliseBlock({ type, headers: ['Feature', 'Specification'], rows: [['', '']] });
  if (type === 'divider') return normaliseBlock({ type });
  return normaliseBlock({ type, text: '' });
};

const addBlock = () => blocks.value.push(createBlock(newBlockType.value));
const removeBlock = (index: number) => blocks.value.splice(index, 1);

const duplicateBlock = (index: number) => {
  const copy = JSON.parse(JSON.stringify(stripInternalFields(blocks.value[index])));
  blocks.value.splice(index + 1, 0, normaliseBlock(copy));
};

const moveBlock = (index: number, direction: number) => {
  const target = index + direction;
  if (target < 0 || target >= blocks.value.length) return;
  const [item] = blocks.value.splice(index, 1);
  blocks.value.splice(target, 0, item);
};

const addTableColumn = (block: DescriptionBlock) => {
  block.headers!.push(`Column ${block.headers!.length + 1}`);
  block.rows!.forEach((row) => row.push(''));
};

const removeTableColumn = (block: DescriptionBlock) => {
  if (block.headers!.length <= 1) return;
  block.headers!.pop();
  block.rows!.forEach((row) => row.pop());
};

const addTableRow = (block: DescriptionBlock) => {
  block.rows!.push(Array(block.headers!.length).fill(''));
};

const blockLabel = (type: string) => ({
  heading: 'Heading', paragraph: 'Paragraph', list: 'List', table: 'Table', quote: 'Quote', warning: 'Warning', info: 'Info Box', divider: 'Divider',
}[type] || 'Content');

const jsonPreview = computed(() => JSON.stringify(blocks.value.map(stripInternalFields), null, 2));
</script>

<style scoped>
.input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgb(203 213 225);
  background: white;
  padding: 0.625rem 0.75rem;
  color: rgb(15 23 42);
  outline: none;
}
.input:focus { border-color: rgb(59 130 246); box-shadow: 0 0 0 3px rgb(219 234 254); }
.field-label { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 600; color: rgb(51 65 85); }
.block-action { display: flex; height: 2rem; min-width: 2rem; align-items: center; justify-content: center; border-radius: 0.375rem; padding: 0 0.5rem; font-weight: 700; color: rgb(71 85 105); }
.block-action:hover { background: rgb(226 232 240); }
.block-action:disabled { cursor: not-allowed; opacity: 0.3; }
.secondary-button { border-radius: 0.5rem; border: 1px solid rgb(203 213 225); background: white; padding: 0.625rem 0.875rem; font-size: 0.875rem; font-weight: 600; color: rgb(51 65 85); }
.secondary-button:hover { background: rgb(248 250 252); }
.remove-small { display: flex; height: 2rem; width: 2rem; flex: none; align-items: center; justify-content: center; border-radius: 0.375rem; font-size: 1.25rem; font-weight: 700; color: rgb(220 38 38); }
.remove-small:hover { background: rgb(254 242 242); }
</style>
