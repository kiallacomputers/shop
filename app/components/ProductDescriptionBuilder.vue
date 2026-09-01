<template>
  <div class="space-y-5">
    <div
      class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h3 class="font-semibold text-slate-900">Description Builder</h3>
        <p class="mt-1 text-sm text-slate-500">
          Add content blocks and arrange them in the order customers should see them.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <select
          v-model="newBlockType"
          class="input min-w-[170px] text-sm"
        >
          <option value="heading">Heading</option>
          <option value="paragraph">Paragraph</option>
          <option value="image">Image</option>
          <option value="list">List</option>
          <option value="table">Table</option>
          <option value="quote">Quote</option>
          <option value="warning">Warning</option>
          <option value="info">Info Box</option>
          <option value="divider">Divider</option>
        </select>

        <button
          type="button"
          class="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          @click="addBlock"
        >
          + Add Block
        </button>
      </div>
    </div>

    <div
      v-if="!blocks.length"
      class="rounded-xl border-2 border-dashed border-slate-300 p-10 text-center"
    >
      <p class="font-semibold text-slate-700">No description blocks yet</p>
      <p class="mt-1 text-sm text-slate-500">
        Choose a block type above and click Add Block.
      </p>
    </div>

    <article
      v-for="(block, index) in blocks"
      :key="block._key"
      class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <header
        class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3"
      >
        <div class="flex items-center gap-3">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-md bg-slate-200 text-xs font-bold text-slate-600"
          >
            {{ index + 1 }}
          </span>

          <div>
            <p class="text-sm font-bold text-slate-800">
              {{ blockLabel(block.type) }}
            </p>
            <p class="text-xs text-slate-500">{{ block.type }}</p>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <button
            type="button"
            :disabled="index === 0"
            class="block-action"
            title="Move up"
            @click="moveBlock(index, -1)"
          >
            ↑
          </button>

          <button
            type="button"
            :disabled="index === blocks.length - 1"
            class="block-action"
            title="Move down"
            @click="moveBlock(index, 1)"
          >
            ↓
          </button>

          <button
            type="button"
            class="block-action"
            title="Duplicate"
            @click="duplicateBlock(index)"
          >
            ⧉
          </button>

          <button
            type="button"
            class="block-action text-red-600 hover:bg-red-50"
            title="Delete"
            @click="removeBlock(index)"
          >
            ×
          </button>
        </div>
      </header>

      <div class="p-4 sm:p-5">
        <!-- ======================================== -->
        <!-- HEADING -->
        <!-- ======================================== -->

        <template v-if="block.type === 'heading'">
          <div class="grid gap-4 sm:grid-cols-[150px_1fr_180px]">
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

              <input
                v-model="block.text"
                type="text"
                class="input"
                placeholder="e.g. CPU Specifications"
              />
            </label>

            <label>
              <span class="field-label">Font Colour</span>
              <div class="flex items-center gap-2">
                <input
                  v-model="block.headingColor"
                  type="color"
                  class="h-11 w-12 cursor-pointer rounded border border-slate-300 bg-white p-1"
                  title="Choose heading font colour"
                />
                <input
                  v-model="block.headingColor"
                  type="text"
                  class="input min-w-0"
                  placeholder="#566C9D"
                />
              </div>
            </label>
          </div>
        </template>

        <!-- ======================================== -->
        <!-- PARAGRAPH -->
        <!-- ======================================== -->

        <template v-else-if="block.type === 'paragraph'">
          <label>
            <span class="field-label">Paragraph</span>

            <textarea
              v-model="block.text"
              rows="5"
              class="input"
              placeholder="Enter product information..."
            ></textarea>
          </label>
        </template>

        <!-- ======================================== -->
        <!-- IMAGE -->
        <!-- ======================================== -->

        <template v-else-if="block.type === 'image'">
          <div class="space-y-5">
            <div>
              <span class="field-label">Description Image</span>

              <label
                class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
                :class="uploadingImageKey === block._key ? 'pointer-events-none opacity-60' : ''"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="mb-3 h-9 w-9 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>

                <span class="font-semibold text-slate-700">
                  {{
                    uploadingImageKey === block._key
                      ? "Uploading image..."
                      : block.url
                        ? "Replace Image"
                        : "Upload Image"
                  }}
                </span>

                <span class="mt-1 text-xs text-slate-500">
                  JPG, PNG, WEBP or GIF. Maximum 10 MB.
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  class="hidden"
                  :disabled="uploadingImageKey === block._key"
                  @change="uploadDescriptionImage($event, index)"
                />
              </label>
            </div>

            <div
              v-if="imageUploadError && imageUploadErrorKey === block._key"
              class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {{ imageUploadError }}
            </div>

            <div
              v-if="block.url"
              class="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div class="flex min-h-48 items-center justify-center rounded-lg bg-white p-4">
                <img
                  :src="block.url"
                  :alt="block.alt || 'Description image preview'"
                  class="max-h-72 max-w-full object-contain"
                />
              </div>

              <div class="mt-3 flex justify-end">
                <button
                  type="button"
                  class="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  @click="clearImage(block)"
                >
                  Remove Image
                </button>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label>
                <span class="field-label">Alt Text</span>

                <input
                  v-model="block.alt"
                  type="text"
                  class="input"
                  placeholder="Describe the image for accessibility"
                />
              </label>

              <label>
                <span class="field-label">Display Width</span>

                <select v-model="block.width" class="input">
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="full">Full Width</option>
                </select>
              </label>
            </div>

            <div class="space-y-3">
              <div>
                <span class="field-label">Caption</span>

                <div class="rounded-lg border border-slate-300 bg-white">
                  <div class="flex flex-wrap items-end gap-2 border-b border-slate-200 bg-slate-50 p-2">
                    <button
                      type="button"
                      class="caption-tool-button font-bold"
                      title="Bold selected text"
                      @mousedown.prevent="applyCaptionCommand(block, 'bold')"
                    >
                      B
                    </button>

                    <label class="min-w-36">
                      <span class="caption-tool-label">Font size</span>
                      <select
                        v-model="block.captionFontSize"
                        class="caption-tool-select"
                        @mousedown="rememberCaptionSelection(block)"
                        @change="applyCaptionFontSize(block)"
                      >
                        <option value="xs">Extra Small</option>
                        <option value="sm">Small</option>
                        <option value="base">Normal</option>
                        <option value="lg">Large</option>
                        <option value="xl">Extra Large</option>
                        <option value="2xl">2X Large</option>
                      </select>
                    </label>

                    <div class="mx-1 hidden h-8 w-px bg-slate-300 sm:block"></div>

                    <label>
                      <span class="caption-tool-label">Caption text colour</span>
                      <input
                        v-model="block.captionColor"
                        type="color"
                        class="caption-colour-input"
                        title="Set the default text colour for the whole caption box"
                      />
                    </label>

                    <label>
                      <span class="caption-tool-label">Caption background</span>
                      <input
                        v-model="block.captionBackgroundColor"
                        type="color"
                        class="caption-colour-input"
                        title="Set the background colour for the whole caption box"
                      />
                    </label>

                    <span class="pb-2 text-xs text-slate-500">
                      Select text only for Bold or Font size. Colours apply to the whole caption box.
                    </span>
                  </div>

                  <div
                    :data-caption-editor="block._key"
                    class="caption-editor"
                    contenteditable="true"
                    role="textbox"
                    aria-multiline="true"
                    data-placeholder="Optional caption displayed underneath the image"
                    v-html="block.captionHtml || ''"
                    :style="{
                      color: block.captionColor || '#64748b',
                      backgroundColor: block.captionBackgroundColor || '#ffffff',
                    }"
                    @input="updateCaptionFromEditor(block, $event)"
                    @mouseup="rememberCaptionSelection(block)"
                    @keyup="rememberCaptionSelection(block)"
                    @focus="rememberCaptionSelection(block)"
                  ></div>
                </div>
              </div>
            </div>

            <label>
              <span class="field-label">Image URL</span>

              <input
                v-model="block.url"
                type="text"
                class="input"
                placeholder="Uploaded image URL"
              />
            </label>
          </div>
        </template>

        <!-- ======================================== -->
        <!-- QUOTE / WARNING / INFO -->
        <!-- ======================================== -->

        <template
          v-else-if="
            block.type === 'quote' ||
            block.type === 'warning' ||
            block.type === 'info'
          "
        >
          <label>
            <span class="field-label">
              {{ blockLabel(block.type) }} Text
            </span>

            <textarea
              v-model="block.text"
              rows="3"
              class="input"
              :placeholder="
                block.type === 'warning'
                  ? 'Important information for the customer...'
                  : 'Enter text...'
              "
            ></textarea>
          </label>
        </template>

        <!-- ======================================== -->
        <!-- LIST -->
        <!-- ======================================== -->

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

            <button
              type="button"
              class="secondary-button"
              @click="block.items!.push('')"
            >
              + Add Item
            </button>
          </div>

          <p class="mb-3 text-xs text-slate-500">
            Bold part of a list item by placing
            <strong>**double asterisks**</strong> around it, for example:
            Includes <strong>**12 months warranty**</strong>.
          </p>

          <div class="space-y-2">
            <div
              v-for="(_item, itemIndex) in block.items"
              :key="itemIndex"
              class="flex items-center gap-2"
            >
              <span
                class="w-6 text-center text-sm font-semibold text-slate-400"
              >
                {{ itemIndex + 1 }}
              </span>

              <input
                v-model="block.items![itemIndex]"
                type="text"
                class="input"
                placeholder="List item — use **text** for bold"
              />

              <button
                type="button"
                class="remove-small"
                @click="block.items!.splice(itemIndex, 1)"
              >
                ×
              </button>
            </div>
          </div>
        </template>

        <!-- ======================================== -->
        <!-- TABLE -->
        <!-- ======================================== -->

        <template v-else-if="block.type === 'table'">
          <div class="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              class="secondary-button"
              @click="addTableColumn(block)"
            >
              + Column
            </button>

            <button
              type="button"
              class="secondary-button"
              @click="addTableRow(block)"
            >
              + Row
            </button>

            <button
              v-if="block.headers!.length > 1"
              type="button"
              class="secondary-button text-red-600"
              @click="removeTableColumn(block)"
            >
              − Column
            </button>
          </div>

          <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="min-w-full border-collapse text-sm">
              <thead class="bg-slate-100">
                <tr>
                  <th
                    v-for="(_header, headerIndex) in block.headers"
                    :key="headerIndex"
                    class="min-w-[180px] border-r border-slate-200 p-2 last:border-r-0"
                  >
                    <input
                      v-model="block.headers![headerIndex]"
                      type="text"
                      class="input bg-white font-semibold"
                      :placeholder="`Column ${headerIndex + 1}`"
                    />
                  </th>

                  <th class="w-12 p-2"></th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(row, rowIndex) in block.rows"
                  :key="rowIndex"
                  class="border-t border-slate-200"
                >
                  <td
                    v-for="(_cell, cellIndex) in row"
                    :key="cellIndex"
                    class="border-r border-slate-200 p-2 last:border-r-0"
                  >
                    <input
                      v-model="row[cellIndex]"
                      type="text"
                      class="input"
                      placeholder="Value"
                    />
                  </td>

                  <td class="p-2 text-center">
                    <button
                      type="button"
                      class="remove-small"
                      title="Remove row"
                      @click="block.rows!.splice(rowIndex, 1)"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- ======================================== -->
        <!-- DIVIDER -->
        <!-- ======================================== -->

        <template v-else-if="block.type === 'divider'">
          <div class="py-4">
            <hr class="border-slate-300" />
          </div>
        </template>
      </div>
    </article>

    <details class="rounded-xl border border-slate-200 bg-white">
      <summary
        class="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700"
      >
        View generated JSON
      </summary>

      <pre
        class="max-h-80 overflow-auto border-t border-slate-200 bg-slate-950 p-4 text-xs text-slate-100"
      >{{ jsonPreview }}</pre>
    </details>
  </div>
</template>

<script setup lang="ts">
type DescriptionBlock = {
  _key: string;
  type: string;
  text?: string;
  level?: number;
  headingColor?: string;
  style?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  url?: string;
  path?: string;
  alt?: string;
  caption?: string;
  captionHtml?: string;
  captionBold?: boolean;
  captionFontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  captionColor?: string;
  captionBackgroundColor?: string;
  width?: "small" | "medium" | "large" | "full";
};

const props = defineProps<{
  modelValue: any[];
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: any[]): void;
}>();

const { adminFetch } = useAdminFetch();

const newBlockType = ref("heading");
const blocks = ref<DescriptionBlock[]>([]);

const uploadingImageKey = ref<string | null>(null);
const imageUploadError = ref("");
const imageUploadErrorKey = ref<string | null>(null);

let syncingFromParent = false;

const makeKey = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ========================================
// CAPTION RICH-TEXT EDITOR
// ========================================

const captionSelections = new Map<string, Range>();

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const legacyCaptionHtml = (block: DescriptionBlock) => {
  if (!block.caption) return "";

  const text = escapeHtml(block.caption);
  return block.captionBold ? `<strong>${text}</strong>` : text;
};

const getCaptionEditor = (block: DescriptionBlock) =>
  document.querySelector<HTMLElement>(`[data-caption-editor="${block._key}"]`);

const rememberCaptionSelection = (block: DescriptionBlock) => {
  if (typeof window === "undefined") return;

  const selection = window.getSelection();
  const editor = getCaptionEditor(block);
  if (!selection || !editor || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (editor.contains(range.commonAncestorContainer)) {
    captionSelections.set(block._key, range.cloneRange());
  }
};

const restoreCaptionSelection = (block: DescriptionBlock) => {
  if (typeof window === "undefined") return false;

  const range = captionSelections.get(block._key);
  const selection = window.getSelection();
  const editor = getCaptionEditor(block);
  if (!range || !selection || !editor) return false;

  editor.focus();
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
};

const syncCaptionEditor = (block: DescriptionBlock) => {
  const editor = getCaptionEditor(block);
  if (!editor) return;

  block.captionHtml = editor.innerHTML;
  block.caption = editor.innerText.trim();
  rememberCaptionSelection(block);
};

const updateCaptionFromEditor = (block: DescriptionBlock, event: Event) => {
  const editor = event.currentTarget as HTMLElement;
  block.captionHtml = editor.innerHTML;
  block.caption = editor.innerText.trim();
  rememberCaptionSelection(block);
};

const applyCaptionCommand = (block: DescriptionBlock, command: string, value?: string) => {
  if (typeof document === "undefined" || !restoreCaptionSelection(block)) return;
  document.execCommand(command, false, value);
  syncCaptionEditor(block);
};

const captionFontSizes: Record<string, string> = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
};

const applyCaptionInlineStyle = (
  block: DescriptionBlock,
  property: "fontSize" | "color" | "backgroundColor",
  value: string,
) => {
  if (typeof document === "undefined" || !restoreCaptionSelection(block)) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  const span = document.createElement("span");
  span.style[property] = value;
  span.appendChild(range.extractContents());
  range.insertNode(span);

  const updatedRange = document.createRange();
  updatedRange.selectNodeContents(span);
  selection.removeAllRanges();
  selection.addRange(updatedRange);
  captionSelections.set(block._key, updatedRange.cloneRange());

  syncCaptionEditor(block);
};

const applyCaptionFontSize = (block: DescriptionBlock) => {
  const size = captionFontSizes[block.captionFontSize || "sm"] || captionFontSizes.sm;
  applyCaptionInlineStyle(block, "fontSize", size);
};

// ========================================
// NORMALISE BLOCK
// ========================================

const normaliseBlock = (input: any): DescriptionBlock => {
  const type = input?.type || "paragraph";

  const base: DescriptionBlock = {
    ...input,
    _key: input?._key || makeKey(),
    type,
  };

  if (type === "heading") {
    base.text = input?.text || "";
    base.level = Number(input?.level || 2);
    base.headingColor = input?.headingColor || "#566C9D";
  } else if (type === "image") {
    base.url = input?.url || "";
    base.path = input?.path || "";
    base.alt = input?.alt || "";
    base.caption = input?.caption || "";
    base.captionBold = Boolean(input?.captionBold);
    base.captionFontSize = input?.captionFontSize || "sm";
    base.captionColor = input?.captionColor || "#64748b";
    base.captionBackgroundColor = input?.captionBackgroundColor || "#ffffff";
    base.captionHtml = input?.captionHtml || legacyCaptionHtml(base);
    base.width = input?.width || "full";
  } else if (type === "list") {
    base.style = input?.style || "bullet";
    base.items = Array.isArray(input?.items) ? [...input.items] : [""];
  } else if (type === "table") {
    base.headers =
      Array.isArray(input?.headers) && input.headers.length
        ? [...input.headers]
        : ["Feature", "Specification"];

    base.rows = Array.isArray(input?.rows)
      ? input.rows.map((row: any[]) => [...row])
      : [["", ""]];

    base.rows = base.rows.map((row) => {
      const resized = [...row];

      while (resized.length < base.headers!.length) {
        resized.push("");
      }

      return resized.slice(0, base.headers!.length);
    });
  } else if (type !== "divider") {
    base.text = input?.text || "";
  }

  return base;
};

// ========================================
// REMOVE INTERNAL FIELDS BEFORE SAVING
// ========================================

const stripInternalFields = (block: DescriptionBlock) => {
  const { _key, ...clean } = block;

  return clean;
};

// ========================================
// SYNC FROM PARENT
// ========================================

watch(
  () => props.modelValue,
  (value) => {
    const incoming = Array.isArray(value) ? value : [];

    const currentClean = blocks.value.map(stripInternalFields);

    if (JSON.stringify(incoming) === JSON.stringify(currentClean)) {
      return;
    }

    syncingFromParent = true;

    blocks.value = incoming.map(normaliseBlock);

    nextTick(() => {
      syncingFromParent = false;
    });
  },
  {
    immediate: true,
    deep: true,
  },
);

// ========================================
// SYNC TO PARENT
// ========================================

watch(
  blocks,
  (value) => {
    if (syncingFromParent) {
      return;
    }

    emit(
      "update:modelValue",
      value.map(stripInternalFields),
    );
  },
  {
    deep: true,
  },
);

// ========================================
// CREATE BLOCK
// ========================================

const createBlock = (type: string): DescriptionBlock => {
  if (type === "heading") {
    return normaliseBlock({
      type,
      text: "",
      level: 2,
      headingColor: "#566C9D",
    });
  }

  if (type === "paragraph") {
    return normaliseBlock({
      type,
      text: "",
    });
  }

  if (type === "image") {
    return normaliseBlock({
      type,
      url: "",
      path: "",
      alt: "",
      caption: "",
      captionHtml: "",
      captionBold: false,
      captionFontSize: "sm",
      captionColor: "#64748b",
      captionBackgroundColor: "#ffffff",
      width: "full",
    });
  }

  if (type === "list") {
    return normaliseBlock({
      type,
      style: "bullet",
      items: ["", ""],
    });
  }

  if (type === "table") {
    return normaliseBlock({
      type,
      headers: ["Feature", "Specification"],
      rows: [["", ""]],
    });
  }

  if (type === "divider") {
    return normaliseBlock({ type });
  }

  return normaliseBlock({
    type,
    text: "",
  });
};

// ========================================
// BLOCK ACTIONS
// ========================================

const addBlock = () => {
  blocks.value.push(createBlock(newBlockType.value));
};

const removeBlock = (index: number) => {
  blocks.value.splice(index, 1);
};

const duplicateBlock = (index: number) => {
  const copy = JSON.parse(
    JSON.stringify(stripInternalFields(blocks.value[index])),
  );

  blocks.value.splice(index + 1, 0, normaliseBlock(copy));
};

const moveBlock = (index: number, direction: number) => {
  const target = index + direction;

  if (target < 0 || target >= blocks.value.length) {
    return;
  }

  const [item] = blocks.value.splice(index, 1);

  blocks.value.splice(target, 0, item);
};

// ========================================
// DESCRIPTION IMAGE UPLOAD
// ========================================

const uploadDescriptionImage = async (
  event: Event,
  index: number,
) => {
  const input = event.target as HTMLInputElement;

  const file = input.files?.[0];

  if (!file) {
    return;
  }

  const block = blocks.value[index];

  if (!block || block.type !== "image") {
    input.value = "";
    return;
  }

  uploadingImageKey.value = block._key;
  imageUploadError.value = "";
  imageUploadErrorKey.value = block._key;

  try {
    const formData = new FormData();

    formData.append("file", file);

    const result = await adminFetch<{
      path: string;
      url: string;
    }>("/api/admin/products/upload-image", {
      method: "POST",
      body: formData,
    });

    block.url = result.url;
    block.path = result.path;

    if (!block.alt) {
      block.alt = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim();
    }
  } catch (error: any) {
    console.error("DESCRIPTION IMAGE UPLOAD ERROR:", error);

    imageUploadError.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to upload description image.";
  } finally {
    uploadingImageKey.value = null;
    input.value = "";
  }
};

// ========================================
// CLEAR IMAGE FROM BLOCK
// ========================================

const clearImage = (block: DescriptionBlock) => {
  block.url = "";
  block.path = "";
};

// ========================================
// TABLE ACTIONS
// ========================================

const addTableColumn = (block: DescriptionBlock) => {
  block.headers!.push(`Column ${block.headers!.length + 1}`);

  block.rows!.forEach((row) => {
    row.push("");
  });
};

const removeTableColumn = (block: DescriptionBlock) => {
  if (block.headers!.length <= 1) {
    return;
  }

  block.headers!.pop();

  block.rows!.forEach((row) => {
    row.pop();
  });
};

const addTableRow = (block: DescriptionBlock) => {
  block.rows!.push(Array(block.headers!.length).fill(""));
};

// ========================================
// LABELS
// ========================================

const blockLabel = (type: string) =>
  ({
    heading: "Heading",
    paragraph: "Paragraph",
    image: "Image",
    list: "List",
    table: "Table",
    quote: "Quote",
    warning: "Warning",
    info: "Info Box",
    divider: "Divider",
  })[type] || "Content";

// ========================================
// JSON PREVIEW
// ========================================

const jsonPreview = computed(() =>
  JSON.stringify(
    blocks.value.map(stripInternalFields),
    null,
    2,
  ),
);
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

.input:focus {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgb(219 234 254);
}

.field-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(51 65 85);
}

.block-action {
  display: flex;
  height: 2rem;
  min-width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  padding: 0 0.5rem;
  font-weight: 700;
  color: rgb(71 85 105);
}

.block-action:hover {
  background: rgb(226 232 240);
}

.block-action:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.secondary-button {
  border-radius: 0.5rem;
  border: 1px solid rgb(203 213 225);
  background: white;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(51 65 85);
}

.secondary-button:hover {
  background: rgb(248 250 252);
}

.remove-small {
  display: flex;
  height: 2rem;
  width: 2rem;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(220 38 38);
}

.remove-small:hover {
  background: rgb(254 242 242);
}

.caption-tool-button {
  height: 2.5rem;
  min-width: 2.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(203 213 225);
  background: white;
  color: rgb(30 41 59);
}

.caption-tool-button:hover {
  background: rgb(241 245 249);
}

.caption-tool-label {
  display: block;
  margin-bottom: 0.2rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: rgb(71 85 105);
}

.caption-tool-select {
  height: 2.5rem;
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgb(203 213 225);
  background: white;
  padding: 0 0.6rem;
  color: rgb(15 23 42);
}

.caption-colour-input {
  height: 2.5rem;
  width: 3rem;
  cursor: pointer;
  border-radius: 0.5rem;
  border: 1px solid rgb(203 213 225);
  background: white;
  padding: 0.2rem;
}

.caption-editor {
  min-height: 3rem;
  padding: 0.75rem;
  color: rgb(51 65 85);
  outline: none;
}

.caption-editor:focus {
  box-shadow: inset 0 0 0 2px rgb(147 197 253);
}

.caption-editor:empty::before {
  content: attr(data-placeholder);
  color: rgb(148 163 184);
  pointer-events: none;
}

</style>
