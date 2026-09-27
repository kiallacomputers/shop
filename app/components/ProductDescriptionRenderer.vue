<template>
<!-- Product description -->
          <section
            v-if="description?.length"
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div class="mb-5 border-b border-slate-200 pb-4">
              <h2 class="text-xl font-bold text-slate-900">Product Details</h2>
            </div>
              <div class="text-[#566C9D] text-sm">
              <div
                v-for="(section, index) in description"
                :key="index"
                :class="section.type === 'heading' ? 'mb-2' : 'mb-6'"
              >
                <!-- Heading -->
                <component
                  :is="section.level === 4 ? 'h4' : section.level === 3 ? 'h3' : 'h2'"
                  v-if="section.type === 'heading'"
                  :class="[
                    'font-semibold mb-1 rounded-lg px-3 py-1',
                    section.level === 4 ? 'text-3xl' : section.level === 3 ? 'text-4xl' : 'text-5xl'
                  ]"
                  :style="{
                    color: section.fontColor || section.headingColor || '#566C9D',
                    backgroundColor: section.backgroundColor || '#ffffff',
                    textAlign: section.textAlign || 'center',
                    textDecoration: section.underline === true ? 'underline' : 'none',
                  }"
                >
                  {{ section.text }}
                </component>

                <!-- Paragraph -->
                <div
                  v-else-if="section.type === 'paragraph'"
                  class="mb-4 rounded-lg px-3 py-2"
                  :style="descriptionTextBlockStyle(section, '#374151', '#ffffff', 'left')"
                >
                  <div
                    v-if="section.paragraphImageUrl"
                    class="flex flex-col gap-5 md:flex-row md:items-start"
                    :class="section.paragraphImagePosition === 'right' ? 'md:flex-row-reverse' : ''"
                  >
                    <div
                      class="w-full shrink-0 overflow-hidden rounded-lg bg-white md:w-[var(--paragraph-image-width)]"
                      :style="{ '--paragraph-image-width': `${section.paragraphImageWidth || 35}%` }"
                    >
                      <img
                        :src="section.paragraphImageUrl"
                        :alt="section.paragraphImageAlt || ''"
                        class="h-auto w-full object-contain"
                      />
                    </div>

                    <p class="min-w-0 flex-1 whitespace-pre-line leading-7">
                      <template
                        v-for="(part, partIndex) in parseBoldText(section.text)"
                        :key="partIndex"
                      >
                        <strong v-if="part.bold">{{ part.text }}</strong>
                        <span v-else>{{ part.text }}</span>
                      </template>
                    </p>
                  </div>

                  <p v-else class="whitespace-pre-line leading-7">
                    <template
                      v-for="(part, partIndex) in parseBoldText(section.text)"
                      :key="partIndex"
                    >
                      <strong v-if="part.bold">{{ part.text }}</strong>
                      <span v-else>{{ part.text }}</span>
                    </template>
                  </p>
                </div>

                <!-- Link -->
                <div v-else-if="section.type === 'link'" class="mb-4" :class="section.textAlign === 'center' ? 'text-center' : section.textAlign === 'right' ? 'text-right' : 'text-left'">
                  <a v-if="section.linkUrl" :href="section.linkUrl" target="_blank" rel="noopener noreferrer external" :class="section.linkStyle === 'button' ? 'inline-flex rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700' : 'font-semibold text-blue-600 underline'">{{ section.linkText || section.linkUrl }}</a>
                </div>

                <!-- Downloads -->
                <div v-else-if="section.type === 'downloads'" class="mb-6 not-prose">
                  <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table class="w-full min-w-[620px] border-collapse text-left text-sm">
                      <thead class="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
                        <tr><th class="px-4 py-3">Description</th><th class="w-28 px-4 py-3">Size</th><th class="w-24 px-4 py-3">Type</th><th class="w-40 px-4 py-3">Download</th></tr>
                      </thead>
                      <tbody>
                        <tr v-for="(download, downloadIndex) in section.downloads || []" :key="download._key || downloadIndex" class="border-t border-slate-200">
                          <td class="px-4 py-3 font-semibold text-slate-800">{{ download.description || 'Download' }}</td>
                          <td class="px-4 py-3 text-slate-600">{{ download.size || '—' }}</td>
                          <td class="px-4 py-3 font-semibold uppercase text-slate-600">{{ download.fileType || '—' }}</td>
                          <td class="px-4 py-3"><a v-if="download.url" :href="download.url" target="_blank" rel="noopener noreferrer external" class="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-800"><img src="/icons/download.svg" alt="" aria-hidden="true" class="h-5 w-5 shrink-0" /><span>Download</span></a><span v-else class="text-slate-400">Unavailable</span></td>
                        </tr>
                        <tr v-if="!(section.downloads || []).length"><td colspan="4" class="px-4 py-6 text-center text-slate-500">No downloads available.</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Quote -->
                <blockquote
                  v-else-if="section.type === 'quote'"
                  class="border-l-4 border-blue-500 px-4 py-3 italic mb-4 rounded-r-lg whitespace-pre-line"
                  :style="descriptionTextBlockStyle(section, '#4b5563', '#ffffff', 'left')"
                >
                  {{ section.text }}
                </blockquote>

                <!-- List -->
                <ol
                  v-else-if="section.type === 'list' && section.style === 'number'"
                  class="list-decimal list-inside space-y-2 rounded-lg p-4"
                  :style="descriptionTextBlockStyle(section, '#374151', '#ffffff', 'left')"
                >
                  <li v-for="(item, i) in section.items" :key="i">
                    <template
                      v-for="(part, partIndex) in parseBoldText(item)"
                      :key="partIndex"
                    >
                      <strong v-if="part.bold">{{ part.text }}</strong>
                      <span v-else>{{ part.text }}</span>
                    </template>
                  </li>
                </ol>

                <ul
                  v-else-if="section.type === 'list'"
                  class="space-y-2 rounded-lg p-4"
                  :style="descriptionTextBlockStyle(section, '#374151', '#ffffff', 'left')"
                >
                  <li
                    v-for="(item, i) in section.items"
                    :key="i"
                    :class="['flex gap-2', descriptionFlexAlignClass(section.textAlign)]"
                  >
                    <span
                      class="shrink-0 font-bold"
                      :class="section.style === 'check' ? 'text-green-600' : ''"
                      aria-hidden="true"
                    >{{ listPointer(section.style) }}</span>
                    <span>
                      <template
                        v-for="(part, partIndex) in parseBoldText(item)"
                        :key="partIndex"
                      >
                        <strong v-if="part.bold">{{ part.text }}</strong>
                        <span v-else>{{ part.text }}</span>
                      </template>
                    </span>
                  </li>
                </ul>

                <!-- Warning -->
                <div
                  v-else-if="section.type === 'warning'"
                  class="border border-yellow-300 p-4 rounded-lg whitespace-pre-line"
                  :style="descriptionTextBlockStyle(section, '#854d0e', '#fefce8', 'left')"
                >
                  <template
                    v-for="(part, partIndex) in parseBoldText(section.text)"
                    :key="partIndex"
                  >
                    <strong v-if="part.bold">{{ part.text }}</strong>
                    <span v-else>{{ part.text }}</span>
                  </template>
                </div>

                <!-- Info -->
                <div
                  v-else-if="section.type === 'info'"
                  class="border border-blue-200 p-4 rounded-lg whitespace-pre-line"
                  :style="descriptionTextBlockStyle(section, '#1e3a8a', '#eff6ff', 'left')"
                >
                  <template
                    v-for="(part, partIndex) in parseBoldText(section.text)"
                    :key="partIndex"
                  >
                    <strong v-if="part.bold">{{ part.text }}</strong>
                    <span v-else>{{ part.text }}</span>
                  </template>
                </div>

                <!-- Image -->
                <figure
                  v-else-if="section.type === 'image' && section.url"
                  class="my-8"
                >
                  <figcaption
                    v-if="section.caption && section.captionPosition === 'above'"
                    class="mx-auto mb-2 w-fit max-w-full rounded-md px-3 py-1.5 text-sm"
                    :style="{
                      color: section.captionColor || '#64748b',
                      backgroundColor: section.captionBackgroundColor || 'transparent',
                      textAlign: section.textAlign || 'left',
                    }"
                  >
                    <span v-if="section.captionHtml" v-html="sanitiseCaptionHtml(section.captionHtml)"></span>
                    <span v-else :class="[captionFontSizeClass(section.captionFontSize), section.captionBold ? 'font-bold' : 'font-normal']">{{ section.caption }}</span>
                  </figcaption>

                  <img
                    :src="section.url"
                    :alt="section.alt || product.name"
                    class="mx-auto h-auto rounded-lg object-contain"
                    :class="descriptionImageClass(section.width)"
                  />

                  <figcaption
                    v-if="section.caption && section.captionPosition !== 'above'"
                    class="mx-auto mt-2 w-fit max-w-full rounded-md px-3 py-1.5 text-sm"
                    :style="{
                      color: section.captionColor || '#64748b',
                      backgroundColor: section.captionBackgroundColor || 'transparent',
                      textAlign: section.textAlign || 'left',
                    }"
                  >
                    <span v-if="section.captionHtml" v-html="sanitiseCaptionHtml(section.captionHtml)"></span>
                    <span v-else :class="[captionFontSizeClass(section.captionFontSize), section.captionBold ? 'font-bold' : 'font-normal']">{{ section.caption }}</span>
                  </figcaption>
                </figure>

                <!-- Divider -->
                <hr v-else-if="section.type === 'divider'" class="my-6 border-gray-200" />

                <!-- Table -->
                <div
                  v-else-if="section.type === 'table'"
                  class="overflow-hidden rounded-lg border border-gray-200"
                  :style="{ backgroundColor: section.backgroundColor || '#ffffff' }"
                >
                  <table
                    class="w-full"
                    :style="{ color: section.fontColor || '#374151', backgroundColor: section.backgroundColor || '#ffffff' }"
                  >
                    <thead>
                      <tr>
                        <th
                          v-for="header in section.headers"
                          :key="header"
                          class="whitespace-pre-line border-b border-gray-200 p-3 font-semibold"
                          :style="{ textAlign: section.textAlign || 'left' }"
                        >
                          <template
                            v-for="(part, partIndex) in parseBoldText(header)"
                            :key="partIndex"
                          >
                            <strong v-if="part.bold">{{ part.text }}</strong>
                            <span v-else>{{ part.text }}</span>
                          </template>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr
                        v-for="(row, r) in section.rows"
                        :key="r"
                        class="border-t"
                      >
                        <td
                          v-for="(cell, c) in row"
                          :key="c"
                          class="whitespace-pre-line p-3"
                          :style="{ textAlign: section.textAlign || 'left' }"
                        >
                          <template
                            v-for="(part, partIndex) in parseBoldText(cell)"
                            :key="partIndex"
                          >
                            <strong v-if="part.bold">{{ part.text }}</strong>
                            <span v-else>{{ part.text }}</span>
                          </template>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
</template>

<script setup lang="ts">
const props = defineProps<{ description?: any[] | null }>();

const parseBoldText = (text = "") => {
  const parts = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), bold: false });
    }

    parts.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), bold: false });
  }

  return parts.length ? parts : [{ text, bold: false }];
};

const descriptionTextBlockStyle = (
  section,
  defaultFontColor = '#374151',
  defaultBackgroundColor = '#ffffff',
  defaultAlign = 'left',
) => ({
  color: section?.fontColor || defaultFontColor,
  backgroundColor: section?.backgroundColor || defaultBackgroundColor,
  textAlign: section?.textAlign || defaultAlign,
});

const descriptionFlexAlignClass = (align = 'left') => {
  if (align === 'center') return 'justify-center';
  if (align === 'right') return 'justify-end';
  return 'justify-start';
};

const listPointer = (style = 'bullet') => ({
  bullet: '•',
  circle: '○',
  square: '■',
  dash: '–',
  arrow: '→',
  chevron: '›',
  check: '✓',
  star: '★',
  diamond: '◆',
  plus: '+',
}[style] || '•');

/*
|--------------------------------------------------------------------------
| Description Image Width
|--------------------------------------------------------------------------
*/

const sanitiseCaptionHtml = (html = '') => {
  if (!html) return '';

  return String(html)
    .replace(/<(?!\/?(?:strong|b|span|br)\b)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/style\s*=\s*["']([^"']*)["']/gi, (_match, styleValue) => {
      const safeStyles = String(styleValue)
        .split(';')
        .map((rule) => rule.trim())
        .filter((rule) => /^(font-size|color|background-color)\s*:/i.test(rule))
        .filter((rule) => !/url\s*\(|expression\s*\(|javascript:/i.test(rule))
        .join(';');

      return safeStyles ? `style="${safeStyles}"` : '';
    });
};

const captionFontSizeClass = (size) => {
  const sizes = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  };

  return sizes[size || "sm"] || "text-sm";
};

const descriptionImageClass = (width) => {
  if (width === "small") {
    return "w-full max-w-xs";
  }

  if (width === "medium") {
    return "w-full max-w-md";
  }

  if (width === "large") {
    return "w-full max-w-2xl";
  }

  return "w-full";
};

</script>
