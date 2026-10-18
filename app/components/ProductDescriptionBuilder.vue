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
          <option value="link">Link</option>
          <option value="downloads">Downloads</option>
          <option value="image">Image</option>
          <option value="list">List</option>
          <option value="table">Table</option>
          <option value="tabbed_specs">Tabbed Specifications</option>
          <option value="quote">Quote</option>
          <option value="warning">Warning</option>
          <option value="info">Info Box</option>
          <option value="divider">Divider</option>
          <option value="feature_cards">Feature Cards</option>
          <option value="image_text">Image + Text Showcase</option>
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

    <div class="rounded-xl border border-slate-200 bg-white p-4">
      <h3 class="font-semibold text-slate-900">Reusable Professional Sections</h3>
      <p class="mt-1 text-xs text-slate-500">Append a section without replacing your existing description.</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button type="button" class="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50" @click="appendSection('highlights')">+ Feature Highlights</button>
        <button type="button" class="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50" @click="appendSection('warranty')">+ Warranty & Support</button>
        <button type="button" class="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50" @click="appendSection('box')">+ What's in the Box</button>
        <button type="button" class="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50" @click="appendSection('specs')">+ Specifications</button>
        <button type="button" class="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50" @click="appendSection('showcase')">+ Image & Text Showcase</button>
        <button type="button" class="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50" @click="appendSection('shipping')">+ Shipping Information</button>
        <button type="button" class="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50" @click="appendSection('refurbished')">+ Refurbished Condition</button>
      </div>
    </div>

    <!-- Phase 5: shared Supabase library -->
    <section class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-label="Shared description library">
      <h3 class="font-semibold text-slate-900">Shared Description Library</h3>
      <p class="mt-1 text-xs text-slate-500">Templates are stored in Supabase and shared across authorised admin accounts.</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <input v-model="libraryName" class="input min-w-[180px] flex-1" maxlength="80" placeholder="Template name" aria-label="Template name" />
        <select v-model="libraryCategory" class="input min-w-[160px] text-sm" aria-label="Template category">
          <option v-for="category in libraryCategories" :key="category" :value="category">{{ category }}</option>
        </select>
        <button type="button" :disabled="libraryBusy" class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" @click="saveLibraryEntry('layout')">Save entire layout</button>
        <button type="button" :disabled="libraryBusy" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" @click="loadLibrary">Refresh</button>
        <button type="button" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" @click="exportLibrary">Export library</button>
        <label class="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm">Import library
          <input type="file" class="sr-only" accept="application/json,.json" @change="importLibrary" />
        </label>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <select v-model="libraryFilter" class="input text-sm" aria-label="Filter templates">
          <option value="All">All categories</option>
          <option v-for="category in libraryCategories" :key="category" :value="category">{{ category }}</option>
        </select>
        <input v-model="librarySearch" class="input flex-1" placeholder="Search templates" aria-label="Search templates" />
      </div>
      <p v-if="libraryNotice" class="mt-2 text-xs text-slate-600" role="status">{{ libraryNotice }}</p>
      <p class="mt-2 text-xs text-slate-500">Drag a template into the drop area to append it, or use Preview, Duplicate and History.</p>
      <div v-if="filteredLibrary.length" class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div v-for="entry in filteredLibrary" :key="entry.id" draggable="true" @dragstart="onLibraryDragStart($event, entry)" class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm" :aria-label="`Template ${entry.name}`">
          <div class="mb-3 flex h-28 flex-col gap-2 overflow-hidden rounded-lg bg-slate-50 p-3" aria-hidden="true">
            <div v-for="(sample, sampleIndex) in entry.blocks.slice(0, 4)" :key="sampleIndex" class="min-h-0">
              <div v-if="sample.type === 'heading'" class="truncate text-sm font-bold text-slate-800">{{ sample.text || 'Product heading' }}</div>
              <div v-else-if="sample.type === 'feature_cards'" class="flex gap-1"><span v-for="n in Math.min(Number(sample.columns) || 3, 4)" :key="n" class="h-7 flex-1 rounded border border-blue-200 bg-blue-50" /></div>
              <div v-else-if="sample.type === 'image' || sample.type === 'image_text'" class="flex items-center gap-2"><span class="h-8 w-12 rounded bg-blue-100" /><span class="h-2 flex-1 rounded bg-slate-200" /></div>
              <div v-else-if="sample.type === 'table'" class="grid grid-cols-3 gap-1"><span v-for="n in 6" :key="n" class="h-2 rounded bg-slate-200" /></div>
              <div v-else class="truncate text-xs text-slate-500">{{ sample.text || sample.showcaseBody || sample.type.replaceAll('_', ' ') }}</div>
            </div>
          </div>
          <p class="truncate text-sm font-semibold text-slate-800">{{ entry.name }}</p>
          <p class="text-xs text-slate-500">{{ entry.category }} · {{ entry.kind === 'layout' ? 'Full layout' : 'Section' }} · {{ entry.blocks.length }} blocks</p>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <button type="button" class="rounded border border-blue-200 px-2 py-1 text-xs text-blue-700" @click="previewLibraryEntry(entry)">Preview</button>
            <button type="button" class="rounded border border-blue-200 px-2 py-1 text-xs text-blue-700" @click="useLibraryEntry(entry, false)">Append</button>
            <button type="button" class="rounded border border-slate-300 px-2 py-1 text-xs" @click="useLibraryEntry(entry, true)">Replace</button>
            <button type="button" :disabled="libraryBusy" class="rounded border border-slate-300 px-2 py-1 text-xs" @click="duplicateLibraryEntry(entry)">Duplicate</button>
            <button type="button" class="rounded border border-slate-300 px-2 py-1 text-xs" @click="openHistory(entry)">History</button>
            <button type="button" :disabled="libraryBusy" class="rounded border border-red-200 px-2 py-1 text-xs text-red-700" @click="deleteLibraryEntry(entry.id)">Delete</button>
          </div>
        </div>
      </div>
      <p v-else class="mt-3 text-sm text-slate-500">No matching templates. Save a layout or import your Phase 4 library.</p>
      <div class="mt-4 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 p-4 text-center text-sm text-blue-800" @dragover.prevent @drop.prevent="onLibraryDrop($event)">Drop a template here to append its blocks to the product description</div>
      <div v-if="previewEntry" class="mt-4 rounded-xl border border-blue-200 p-4">
        <div class="flex items-center justify-between gap-2"><h4 class="font-semibold">Preview: {{ previewEntry.name }}</h4><button type="button" class="text-sm underline" @click="previewEntry = null">Close</button></div>
        <p class="mt-2 text-xs text-slate-500">{{ previewEntry.blocks.length }} blocks · {{ previewEntry.category }}</p>
        <div class="mt-3 space-y-2">
          <div v-for="(block, index) in previewEntry.blocks" :key="index" class="rounded border border-slate-200 p-2 text-sm">
            <strong>{{ block.type.replaceAll('_', ' ') }}</strong>
            <p class="mt-1 line-clamp-3 whitespace-pre-wrap text-slate-600">{{ block.text || block.showcaseBody || block.features?.map((f: any) => f.title).join(' · ') || block.items?.join(' · ') || block.headers?.join(' · ') || 'Visual or structured content' }}</p>
          </div>
        </div>
        <button type="button" class="mt-3 rounded bg-blue-600 px-3 py-2 text-sm text-white" @click="useLibraryEntry(previewEntry!, false); previewEntry = null">Append to description</button>
      </div>
      <div v-if="historyEntry" class="mt-4 rounded-xl border border-slate-300 p-4">
        <div class="flex items-center justify-between gap-2"><h4 class="font-semibold">Version history: {{ historyEntry.name }}</h4><button type="button" class="text-sm underline" @click="historyEntry = null">Close</button></div>
        <p class="mt-1 text-xs text-slate-500">Saving a revision updates the shared template, not the product description.</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button type="button" :disabled="libraryBusy || !blocks.length" class="rounded bg-blue-600 px-3 py-2 text-xs text-white disabled:opacity-50" @click="saveTemplateRevision(historyEntry!)">Save current editor as new revision</button>
          <button type="button" class="rounded border px-3 py-2 text-xs" @click="openHistory(historyEntry!)">Refresh versions</button>
        </div>
        <p v-if="historyLoading" class="mt-2 text-xs">Loading history…</p>
        <div v-for="version in historyVersions" :key="version.id" class="mt-2 flex flex-wrap items-center justify-between gap-2 rounded border p-2 text-xs">
          <span>Version {{ version.version_number }} · {{ new Date(version.created_at).toLocaleString() }} · {{ version.blocks.length }} blocks</span>
          <div class="flex gap-2"><button type="button" class="underline" @click="previewLibraryEntry({ ...historyEntry!, blocks: version.blocks })">Preview</button><button type="button" :disabled="libraryBusy" class="font-semibold text-blue-700" @click="restoreTemplateRevision(historyEntry!, version)">Restore</button></div>
        </div>
      </div>
    </section>

    <!-- Professional description layouts: templates are editable and never overwrite without confirmation. -->
    <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="font-semibold text-slate-900">Professional Description Designer</h3>
          <p class="mt-1 text-sm text-slate-500">Choose a starting layout, edit every section and preview the storefront presentation.</p>
        </div>
        <button type="button" class="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50" @click="showPreview = !showPreview">
          {{ showPreview ? 'Hide Live Preview' : 'Show Live Preview' }}
        </button>
      </div>
      <div class="mt-4 grid gap-3 sm:grid-cols-3">
        <button v-for="preset in descriptionPresets" :key="preset.id" type="button"
          class="rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          @click="applyDescriptionPreset(preset.id)">
          <span class="block text-sm font-bold text-slate-900">{{ preset.name }}</span>
          <span class="mt-1 block text-xs leading-5 text-slate-500">{{ preset.description }}</span>
          <span class="mt-3 block text-xs font-semibold text-blue-700">Use this template →</span>
        </button>
      </div>
      <p v-if="templateNotice" class="mt-3 text-sm text-slate-600" role="status">{{ templateNotice }}</p>
      <div v-if="showPreview" class="mt-5 border-t border-slate-200 pt-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-sm font-bold text-slate-900">Live Storefront Preview</h4>
          <div class="inline-flex rounded-lg border border-slate-200 p-1 text-xs">
            <button type="button" :class="previewDevice === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-600'" class="rounded px-3 py-1.5" @click="previewDevice = 'desktop'">Desktop</button>
            <button type="button" :class="previewDevice === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-600'" class="rounded px-3 py-1.5" @click="previewDevice = 'mobile'">Mobile</button>
          </div>
        </div>
        <div class="overflow-x-auto rounded-xl bg-slate-100 p-3">
          <div class="mx-auto bg-white transition-all" :class="previewDevice === 'mobile' ? 'w-[360px] max-w-full' : 'w-full'">
            <ProductDescriptionRenderer :description="blocks.map(stripInternalFields)" />
          </div>
        </div>
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
      <div class="flex justify-end border-b border-slate-100 px-3 py-1">
        <button type="button" class="text-xs font-semibold text-blue-700 hover:underline" @click="saveLibraryEntry('section', block)">Save section to library</button>
      </div>
      <header
        draggable="true"
        class="flex flex-wrap cursor-grab items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 active:cursor-grabbing"
        @dragstart="onBlockDragStart($event, index)"
        @dragover.prevent
        @drop.prevent="onBlockDrop(index)"
        @dragend="draggedBlockIndex = null"
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

              <input
                v-model="block.text"
                type="text"
                class="input"
                placeholder="e.g. CPU Specifications"
              />
            </label>

            <label class="sm:col-span-2">
              <span class="field-label">Underline</span>
              <span class="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  v-model="block.underline"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-slate-700">Underline this heading</span>
                <span class="ml-auto text-xs font-semibold text-slate-500">
                  {{ block.underline ? "On" : "Off" }}
                </span>
              </span>
            </label>

          </div>
        </template>

        <!-- ======================================== -->
        <!-- PARAGRAPH -->
        <!-- ======================================== -->

        <template v-else-if="block.type === 'paragraph'">
          <div class="space-y-4">
            <div class="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div>
                <p class="text-sm font-bold text-slate-800">Paragraph Heading</p>
                <p class="mt-1 text-xs text-slate-500">Optional heading displayed above the paragraph text. It can have its own size and colour.</p>
              </div>

              <div class="mt-4 grid gap-4 sm:grid-cols-2">
                <label class="sm:col-span-2">
                  <span class="field-label">Heading Text</span>
                  <input
                    v-model="block.paragraphHeading"
                    type="text"
                    class="input"
                    placeholder="e.g. Inbuilt Microphone"
                  />
                </label>

                <label>
                  <span class="field-label">Heading Size</span>
                  <select v-model="block.paragraphHeadingSize" class="input">
                    <option value="sm">Small</option>
                    <option value="base">Normal</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                    <option value="2xl">2X Large</option>
                  </select>
                </label>

                <label>
                  <span class="field-label">Heading Colour</span>
                  <div class="flex gap-2">
                    <input
                      v-model="block.paragraphHeadingColor"
                      type="color"
                      class="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                    />
                    <input
                      v-model="block.paragraphHeadingColor"
                      type="text"
                      class="input"
                      placeholder="#1f2937"
                    />
                  </div>
                </label>

                <label class="sm:col-span-2">
                  <span class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                    <input
                      v-model="block.paragraphHeadingBold"
                      type="checkbox"
                      class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm font-medium text-slate-700">Bold heading</span>
                    <span class="ml-auto text-xs font-semibold text-slate-500">{{ block.paragraphHeadingBold ? "On" : "Off" }}</span>
                  </span>
                </label>

                <div v-if="block.paragraphHeading" class="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Heading Preview</p>
                  <div
                    class="mt-2"
                    :class="paragraphHeadingSizeClass(block.paragraphHeadingSize)"
                    :style="{ color: block.paragraphHeadingColor || '#1f2937', fontWeight: block.paragraphHeadingBold === false ? '400' : '700' }"
                  >{{ block.paragraphHeading }}</div>
                </div>
              </div>
            </div>

            <label>
              <span class="field-label">Paragraph</span>
              <textarea
                v-model="block.text"
                rows="5"
                class="input"
                placeholder="Enter product information..."
              ></textarea>
            </label>

            <div class="rounded-xl border border-slate-200 bg-white p-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-bold text-slate-800">Paragraph Image</p>
                  <p class="mt-1 text-xs text-slate-500">
                    Optional image displayed beside this paragraph.
                  </p>
                </div>

                <button
                  v-if="block.paragraphImageUrl"
                  type="button"
                  class="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                  @click="removeParagraphImage(block)"
                >
                  Remove Image
                </button>
              </div>

              <div class="mt-4 grid gap-4 lg:grid-cols-[180px_1fr]">
                <div class="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <div class="flex h-36 items-center justify-center bg-white p-2">
                    <img
                      v-if="block.paragraphImageUrl"
                      :src="block.paragraphImageUrl"
                      :alt="block.paragraphImageAlt || ''"
                      class="h-full w-full object-contain"
                    />
                    <span v-else class="px-3 text-center text-xs font-semibold text-slate-400">
                      No paragraph image
                    </span>
                  </div>
                </div>

                <div class="space-y-4">
                  <label
                    class="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
                    :class="uploadingImageKey === block._key ? 'pointer-events-none opacity-60' : ''"
                  >
                    <span class="text-sm font-semibold text-slate-700">
                      {{
                        uploadingImageKey === block._key
                          ? "Uploading image..."
                          : block.paragraphImageUrl
                            ? "Replace Paragraph Image"
                            : "Add Paragraph Image"
                      }}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      class="hidden"
                      :disabled="uploadingImageKey === block._key"
                      @change="uploadParagraphImage($event, index)"
                    />
                  </label>

                  <div
                    v-if="imageUploadError && imageUploadErrorKey === block._key"
                    class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {{ imageUploadError }}
                  </div>

                  <div v-if="block.paragraphImageUrl" class="grid gap-4 sm:grid-cols-2">
                    <label>
                      <span class="field-label">Image Position</span>
                      <select v-model="block.paragraphImagePosition" class="input">
                        <option value="left">Left of paragraph</option>
                        <option value="right">Right of paragraph</option>
                      </select>
                    </label>

                    <label>
                      <span class="field-label">Image Width</span>
                      <select v-model="block.paragraphImageWidth" class="input">
                        <option value="25">25%</option>
                        <option value="35">35%</option>
                        <option value="40">40%</option>
                        <option value="50">50%</option>
                      </select>
                    </label>

                    <label class="sm:col-span-2">
                      <span class="field-label">Image Alt Text</span>
                      <input
                        v-model="block.paragraphImageAlt"
                        type="text"
                        class="input"
                        placeholder="Describe the image..."
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ======================================== -->
        <!-- LINK -->
        <!-- ======================================== -->
        <template v-else-if="block.type === 'feature_cards'">
          <div class="space-y-3 p-4">
            <label class="block text-sm font-semibold text-slate-700">Feature Cards Heading</label>
            <input v-model="block.text" class="input w-full" placeholder="Product Highlights" />
            <label class="block text-sm font-semibold text-slate-700">Columns</label>
            <select v-model.number="block.columns" class="input w-full"><option :value="2">Two columns</option><option :value="3">Three columns</option><option :value="4">Four columns</option></select>
            <div v-for="(feature, featureIndex) in block.features" :key="featureIndex" class="rounded-lg border border-slate-200 p-3 space-y-2">
              <div class="flex justify-between items-center"><strong class="text-sm">Card {{ featureIndex + 1 }}</strong><button type="button" class="text-sm text-red-600" @click="block.features?.splice(featureIndex, 1)">Remove</button></div>
              <label class="block text-xs font-semibold text-slate-600">Icon</label>
              <select v-model="feature.icon" class="input w-full"><option value="">No icon</option><option value="⚡">⚡ Performance</option><option value="🔒">🔒 Security</option><option value="🔌">🔌 Connectivity</option><option value="🖥️">🖥️ Display</option><option value="💾">💾 Storage</option><option value="🔋">🔋 Battery</option><option value="🛡️">🛡️ Warranty</option><option value="✓">✓ Check</option><option value="🌐">🌐 Network</option><option value="📦">📦 Package</option></select>
              <label class="block text-xs font-semibold text-slate-600">Colour SVG icon URL (optional)</label>
              <input v-model="feature.iconUrl" type="url" class="input w-full" placeholder="https://www.svgrepo.com/show/.../icon.svg" />
              <p class="text-xs text-slate-500">Find an icon at <a href="https://www.svgrepo.com/" target="_blank" rel="noopener noreferrer" class="text-blue-700 underline">SVG Repo ↗</a>, then paste the direct HTTPS .svg image URL. This overrides the emoji icon. Use only trusted SVG files.</p>
              <img v-if="feature.iconUrl && /^https:\/\//i.test(feature.iconUrl)" :src="feature.iconUrl" alt="Icon preview" class="mx-auto h-12 w-12 object-contain" referrerpolicy="no-referrer" />
              <input v-model="feature.title" class="input w-full" placeholder="Feature title" />
              <textarea v-model="feature.description" class="input w-full" rows="2" placeholder="Customer benefit or verified specification" />
            </div>
            <button type="button" class="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700" @click="block.features?.push({ icon: '', title: '', description: '' })">+ Add Feature Card</button>
          </div>
        </template>

        <template v-else-if="block.type === 'image_text'">
          <div class="space-y-4 rounded-lg border border-slate-200 p-4">
            <p class="text-sm text-slate-500">Create a responsive image and text showcase. Use a public HTTPS image URL or a Supabase Storage image URL.</p>
            <label class="block"><span class="field-label">Section heading</span><input v-model="block.text" class="input w-full" placeholder="Designed for everyday productivity" /></label>
            <label class="block"><span class="field-label">Description</span><textarea v-model="block.showcaseBody" class="input w-full" rows="5" placeholder="Describe a verified product benefit and why it matters to customers." /></label>
            <label class="block"><span class="field-label">Image URL</span><input v-model="block.showcaseImageUrl" class="input w-full" placeholder="https://..." /></label>
            <div v-if="productImages.length" class="space-y-2">
              <p class="field-label">Choose an existing product image</p>
              <div class="flex gap-2 overflow-x-auto pb-2">
                <button v-for="(image, imageIndex) in productImages" :key="imageIndex" type="button" class="shrink-0 overflow-hidden rounded-lg border-2 p-1" :class="block.showcaseImageUrl === image ? 'border-blue-600' : 'border-slate-200'" :aria-label="'Use product image ' + (imageIndex + 1)" @click="block.showcaseImageUrl = image">
                  <img :src="image" alt="" class="h-16 w-16 object-contain" loading="lazy" />
                </button>
              </div>
            </div>
            <label class="block"><span class="field-label">Image alternative text</span><input v-model="block.showcaseImageAlt" class="input w-full" placeholder="Describe the image for accessibility" /></label>
            <div class="grid gap-3 sm:grid-cols-2">
              <label><span class="field-label">Image placement</span><select v-model="block.showcaseImageSide" class="input w-full"><option value="left">Image on left</option><option value="right">Image on right</option></select></label>
              <label><span class="field-label">Presentation</span><select v-model="block.showcaseStyle" class="input w-full"><option value="clean">Clean</option><option value="soft">Soft background</option><option value="dark">Dark showcase</option></select></label>
            </div>
          </div>
        </template>

        <template v-else-if="block.type === 'link'">
          <div class="grid gap-4 sm:grid-cols-2">
            <label><span class="field-label">Link Text</span><input v-model="block.linkText" class="input" type="text" placeholder="e.g. Manufacturer website" /></label>
            <label><span class="field-label">Link URL</span><input v-model="block.linkUrl" class="input" type="text" placeholder="https://manufacturer.com/download/file.pdf" /></label>
            <label><span class="field-label">Display Style</span><select v-model="block.linkStyle" class="input"><option value="text">Text Link</option><option value="button">Button</option></select></label>
            <label><span class="field-label">Alignment</span><select v-model="block.textAlign" class="input"><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></label>
          </div>
        </template>

        <!-- ======================================== -->
        <!-- DOWNLOADS -->
        <!-- ======================================== -->
        <template v-else-if="block.type === 'downloads'">
          <div class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div><p class="font-bold text-slate-800">Product Downloads</p><p class="text-xs text-slate-500">Add as many external download links as this product needs.</p></div>
              <button type="button" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700" @click="addDownloadRow(block)">+ Add Download</button>
            </div>
            <label class="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 px-5 py-5 hover:bg-blue-50">
              <span class="text-sm font-bold text-blue-700">{{ uploadingDownloadsKey === block._key ? 'Uploading files...' : 'Choose Download Files' }}</span>
              <input type="file" multiple class="hidden" :disabled="uploadingDownloadsKey === block._key" @change="uploadDownloadFiles($event, block)" />
            </label>
            <p class="text-xs text-slate-500">You can select multiple files at once. Description, size and type are filled automatically.</p>
            <div v-if="downloadUploadError && downloadUploadErrorKey === block._key" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ downloadUploadError }}</div>

            <div class="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
              External links only — enter the description, displayed file size, file type and external URL for each download.
            </div>
            <div v-if="!block.downloads?.length" class="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No external downloads added yet.</div>
            <div v-for="(download, downloadIndex) in block.downloads" :key="download._key || downloadIndex" class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div class="mb-3 flex items-center justify-between"><strong>Download {{ downloadIndex + 1 }}</strong><button type="button" class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600" @click="removeDownloadRow(block, downloadIndex)">Remove</button></div>
              <div class="grid gap-4 md:grid-cols-2">
                <label><span class="field-label">Description</span><input v-model="download.description" class="input" type="text" placeholder="e.g. User Manual" /></label>
                <label><span class="field-label">External Download URL</span><input v-model="download.url" class="input" type="text" placeholder="https://manufacturer.com/download/file.pdf" /></label>
                <label><span class="field-label">File Size</span><input v-model="download.size" class="input" type="text" placeholder="e.g. 4.2 MB" /></label>
                <label><span class="field-label">File Type</span><input v-model="download.fileType" class="input" type="text" placeholder="e.g. PDF" /></label>
              </div>
              <div class="mt-3 flex gap-2">
                <button type="button" class="rounded border px-3 py-1 text-xs font-bold disabled:opacity-40" :disabled="downloadIndex === 0" @click="moveDownloadRow(block, downloadIndex, -1)">↑ Up</button>
                <button type="button" class="rounded border px-3 py-1 text-xs font-bold disabled:opacity-40" :disabled="downloadIndex === block.downloads.length - 1" @click="moveDownloadRow(block, downloadIndex, 1)">↓ Down</button>
              </div>
            </div>

            <div v-if="block.downloads?.length" class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table class="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead class="bg-slate-100"><tr><th class="px-4 py-3">Description</th><th class="px-4 py-3">Size</th><th class="px-4 py-3">Type</th><th class="px-4 py-3">Download</th></tr></thead>
                <tbody><tr v-for="(download, i) in block.downloads" :key="`preview-${download._key || i}`" class="border-t"><td class="px-4 py-3">{{ download.description || 'Download' }}</td><td class="px-4 py-3">{{ download.size || '—' }}</td><td class="px-4 py-3">{{ download.fileType || '—' }}</td><td class="px-4 py-3 font-bold text-blue-600">⇩ Download</td></tr></tbody>
              </table>
            </div>
          </div>
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
                <div class="mb-2 flex flex-wrap items-end justify-between gap-3">
                  <span class="field-label">Caption</span>

                  <label class="min-w-40">
                    <span class="caption-tool-label">Caption position</span>
                    <select v-model="block.captionPosition" class="caption-tool-select">
                      <option value="below">Below image (Default)</option>
                      <option value="above">Above image</option>
                    </select>
                  </label>
                </div>

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

                    <label class="min-w-32">
                      <span class="caption-tool-label">Alignment</span>
                      <select v-model="block.textAlign" class="caption-tool-select">
                        <option value="left">Left</option>
                        <option value="center">Centre</option>
                        <option value="right">Right</option>
                        <option value="justify">Justify</option>
                      </select>
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
                    data-placeholder="Optional image caption"
                    v-caption-html="block.captionHtml || ''"
                    :style="{
                      color: block.captionColor || '#64748b',
                      backgroundColor: block.captionBackgroundColor || '#ffffff',
                      textAlign: block.textAlign || 'left',
                    }"
                    @input="updateCaptionFromEditor(block, $event)"
                    @keydown="handleCaptionKeydown(block, $event)"
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

            <p v-if="block.type === 'info'" class="mb-2 text-xs text-slate-500">
              Bold selected words by placing <strong>**double asterisks**</strong> around them,
              for example: Free <strong>**12 month warranty**</strong> included.
            </p>

            <textarea
              v-model="block.text"
              rows="3"
              class="input"
              :placeholder="
                block.type === 'warning'
                  ? 'Important information for the customer...'
                  : block.type === 'info'
                    ? 'Enter info text — use **text** for bold...'
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
                <option value="bullet">• Bullet</option>
                <option value="circle">○ Circle</option>
                <option value="square">■ Square</option>
                <option value="dash">– Dash</option>
                <option value="arrow">→ Arrow</option>
                <option value="chevron">› Chevron</option>
                <option value="check">✓ Check Mark</option>
                <option value="star">★ Star</option>
                <option value="diamond">◆ Diamond</option>
                <option value="plus">+ Plus</option>
                <option value="number">1. Numbered</option>
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

        <!-- Tabbed specifications: one list per tab, automatically laid out by storefront -->
        <template v-else-if="block.type === 'tabbed_specs'">
          <div class="space-y-4">
            <label class="block text-sm font-semibold">Main heading
              <input v-model="block.text" class="input mt-1 w-full" placeholder="Main Specifications" />
            </label>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm font-semibold">Tabs (1–4)</span>
              <button type="button" class="secondary-button" :disabled="(block.tabs?.length || 0) >= 4" @click="block.tabs!.push({ title: 'New Tab', specs: [] })">+ Add Tab</button>
            </div>
            <div v-for="(tab, tabIndex) in block.tabs" :key="tabIndex" class="rounded-lg border border-slate-200 p-3 space-y-3">
              <div class="flex flex-wrap gap-2 items-center">
                <input v-model="tab.title" class="input flex-1 min-w-[150px]" :aria-label="`Tab ${tabIndex + 1} title`" />
                <button type="button" class="secondary-button" :disabled="tabIndex === 0" @click="block.tabs!.splice(tabIndex - 1, 0, ...block.tabs!.splice(tabIndex, 1))">↑</button>
                <button type="button" class="secondary-button" :disabled="tabIndex === block.tabs!.length - 1" @click="block.tabs!.splice(tabIndex + 1, 0, ...block.tabs!.splice(tabIndex, 1))">↓</button>
                <button type="button" class="secondary-button text-red-600" :disabled="block.tabs!.length <= 1" @click="block.tabs!.splice(tabIndex, 1)">Remove tab</button>
              </div>
              <p class="text-xs text-slate-500">One specification list. Desktop displays two columns; mobile displays one.</p>
              <div v-for="(spec, specIndex) in tab.specs" :key="specIndex" class="flex flex-wrap items-start gap-2">
                <input v-model="spec.label" class="input min-w-[140px] flex-1" placeholder="Specification name" />
                <textarea v-model="spec.value" rows="2" class="input min-w-[180px] flex-[2]" placeholder="Details" />
                <button type="button" class="secondary-button" :disabled="specIndex === 0" @click="tab.specs.splice(specIndex - 1, 0, ...tab.specs.splice(specIndex, 1))">↑</button>
                <button type="button" class="secondary-button" :disabled="specIndex === tab.specs.length - 1" @click="tab.specs.splice(specIndex + 1, 0, ...tab.specs.splice(specIndex, 1))">↓</button>
                <button type="button" class="secondary-button text-red-600" @click="tab.specs.splice(specIndex, 1)">×</button>
              </div>
              <button type="button" class="secondary-button" @click="tab.specs.push({ label: '', value: '' })">+ Add Specification</button>
              <details class="rounded-lg bg-slate-50 p-3">
                <summary class="cursor-pointer text-sm font-semibold">Bulk paste specifications</summary>
                <p class="my-2 text-xs text-slate-500">One per line: Name: Value (or tab-separated Name and Value). Existing entries are kept.</p>
                <textarea :id="`spec-paste-${block._key}-${tabIndex}`" rows="5" class="input w-full" placeholder="Engine speed: Up to 35 ppm" />
                <button type="button" class="secondary-button mt-2" @click="pasteSpecifications(tab, block._key, tabIndex)">Import lines</button>
              </details>
            </div>
          </div>
        </template>

        <!-- ======================================== -->
        <!-- TABLE -->
        <!-- ======================================== -->

        <template v-else-if="block.type === 'table'">
          <p class="mb-3 text-xs text-slate-500">
            Press Enter for a new line. Use <strong>**text**</strong> to make selected text bold.
          </p>

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
                    <textarea
                      v-model="block.headers![headerIndex]"
                      rows="1"
                      class="input table-cell-textarea bg-white font-semibold"
                      :placeholder="`Column ${headerIndex + 1}`"
                      @input="autoGrowTableCell"
                      @focus="autoGrowTableCell"
                    ></textarea>
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
                    <textarea
                      v-model="row[cellIndex]"
                      rows="1"
                      class="input table-cell-textarea"
                      placeholder="Value"
                      @input="autoGrowTableCell"
                      @focus="autoGrowTableCell"
                    ></textarea>
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

        <!-- Shared styling for every text-based description block. -->
        <div
          v-if="block.type !== 'divider' && block.type !== 'image'"
          class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <div class="mb-3">
            <p class="text-sm font-bold text-slate-800">Block Style</p>
            <p class="mt-1 text-xs text-slate-500">
              These settings apply to the whole {{ blockLabel(block.type).toLowerCase() }} block.
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <label>
              <span class="field-label">Font Colour</span>
              <div class="flex items-center gap-2">
                <input
                  v-model="block.fontColor"
                  type="color"
                  class="h-11 w-12 cursor-pointer rounded border border-slate-300 bg-white p-1"
                  title="Choose font colour"
                />
                <input v-model="block.fontColor" type="text" class="input min-w-0" placeholder="#374151" />
              </div>
            </label>

            <label>
              <span class="field-label">Background Colour</span>
              <div class="flex items-center gap-2">
                <input
                  v-model="block.backgroundColor"
                  type="color"
                  class="h-11 w-12 cursor-pointer rounded border border-slate-300 bg-white p-1"
                  title="Choose background colour"
                />
                <input v-model="block.backgroundColor" type="text" class="input min-w-0" placeholder="#FFFFFF" />
              </div>
            </label>

            <label>
              <span class="field-label">Alignment</span>
              <select v-model="block.textAlign" class="input">
                <option value="left">Left</option>
                <option value="center">Centre</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </label>
          </div>
        </div>
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
  columns?: number;
  features?: Array<{ icon?: string; iconUrl?: string; title: string; description: string }>;
  showcaseBody?: string;
  showcaseImageUrl?: string;
  showcaseImageAlt?: string;
  showcaseImageSide?: "left" | "right";
  showcaseStyle?: "clean" | "soft" | "dark"; 
  level?: number;
  headingColor?: string;
  underline?: boolean;
  fontColor?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  style?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  tabs?: Array<{ title: string; specs: Array<{ label: string; value: string }> }>;
  url?: string;
  path?: string;
  alt?: string;
  caption?: string;
  captionHtml?: string;
  captionBold?: boolean;
  captionFontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  captionColor?: string;
  captionBackgroundColor?: string;
  captionPosition?: "above" | "below";
  width?: "small" | "medium" | "large" | "full";
  paragraphImageUrl?: string;
  paragraphImagePath?: string;
  paragraphImageAlt?: string;
  paragraphImagePosition?: "left" | "right";
  paragraphImageWidth?: "25" | "35" | "40" | "50";
  paragraphHeading?: string;
  paragraphHeadingSize?: "sm" | "base" | "lg" | "xl" | "2xl";
  paragraphHeadingColor?: string;
  paragraphHeadingBold?: boolean;
  linkText?: string;
  linkUrl?: string;
  linkStyle?: "text" | "button";
  downloads?: Array<{ _key?: string; description: string; size: string; fileType: string; url: string }>;
};

const props = defineProps<{
  modelValue: any[];
  productImages?: string[];
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: any[]): void;
}>();

const { adminFetch } = useAdminFetch();

const newBlockType = ref("heading");
const blocks = ref<DescriptionBlock[]>([]);
const showPreview = ref(false);
const previewDevice = ref<'desktop' | 'mobile'>('desktop');
const templateNotice = ref('');
const draggedBlockIndex = ref<number | null>(null);
const libraryName = ref('');
const libraryNotice = ref('');
const libraryBusy = ref(false);
const libraryCategory = ref('General');
const libraryFilter = ref('All');
const librarySearch = ref('');
const libraryCategories = ['General', 'Laptops', 'Desktops', 'Monitors', 'Printers', 'Networking', 'Storage', 'Accessories', 'Refurbished'];
type LibraryEntry = { id: string; name: string; category: string; kind: 'layout' | 'section'; blocks: any[] };
type LibraryVersion = { id: string; version_number: number; blocks: any[]; created_at: string };
const previewEntry = ref<LibraryEntry | null>(null);
const historyEntry = ref<LibraryEntry | null>(null);
const historyVersions = ref<LibraryVersion[]>([]);
const historyLoading = ref(false);
const draggedLibraryId = ref<string | null>(null);
const previewLibraryEntry = (entry: LibraryEntry) => { previewEntry.value = entry; };
const onLibraryDragStart = (event: DragEvent, entry: LibraryEntry) => {
  draggedLibraryId.value = entry.id;
  event.dataTransfer?.setData('text/plain', entry.id);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
};
const onLibraryDrop = (event: DragEvent) => {
  const id = draggedLibraryId.value || event.dataTransfer?.getData('text/plain');
  draggedLibraryId.value = null;
  const entry = savedLibrary.value.find(item => item.id === id);
  if (entry) useLibraryEntry(entry, false);
};
const duplicateLibraryEntry = async (entry: LibraryEntry) => {
  libraryBusy.value = true;
  try {
    await adminFetch('/api/admin/description-templates', { method: 'POST', body: { name: `${entry.name.slice(0, 73)} (Copy)`, category: entry.category, kind: entry.kind, blocks: entry.blocks } });
    await loadLibrary(); libraryNotice.value = `Duplicated "${entry.name}".`;
  } catch (error: any) { libraryNotice.value = `Duplicate failed: ${error?.data?.statusMessage || error?.message || 'request failed'}`; }
  finally { libraryBusy.value = false; }
};
const openHistory = async (entry: LibraryEntry) => {
  historyEntry.value = entry; historyLoading.value = true; historyVersions.value = [];
  try {
    const result = await adminFetch(`/api/admin/description-templates/${encodeURIComponent(entry.id)}/versions`);
    historyVersions.value = Array.isArray(result) ? result as LibraryVersion[] : [];
  } catch (error: any) { libraryNotice.value = `History failed: ${error?.data?.statusMessage || error?.message || 'request failed'}`; }
  finally { historyLoading.value = false; }
};
const saveTemplateRevision = async (entry: LibraryEntry) => {
  if (!window.confirm(`Save the current product description as a new revision of "${entry.name}"? This updates the shared template.`)) return;
  libraryBusy.value = true;
  try {
    await adminFetch(`/api/admin/description-templates/${encodeURIComponent(entry.id)}`, { method: 'PUT', body: { blocks: blocks.value.map(item => JSON.parse(JSON.stringify(stripInternalFields(item)))) } });
    await loadLibrary(); libraryNotice.value = 'New template revision saved.';
    await openHistory(entry);
  } catch (error: any) { libraryNotice.value = `Revision failed: ${error?.data?.statusMessage || error?.message || 'request failed'}`; }
  finally { libraryBusy.value = false; }
};
const restoreTemplateRevision = async (entry: LibraryEntry, version: LibraryVersion) => {
  if (!window.confirm(`Restore version ${version.version_number} of "${entry.name}" for all admins? The current template is preserved in history.`)) return;
  libraryBusy.value = true;
  try {
    await adminFetch(`/api/admin/description-templates/${encodeURIComponent(entry.id)}`, { method: 'PUT', body: { blocks: version.blocks } });
    await loadLibrary(); libraryNotice.value = `Restored version ${version.version_number}.`;
    await openHistory(entry);
  } catch (error: any) { libraryNotice.value = `Restore failed: ${error?.data?.statusMessage || error?.message || 'request failed'}`; }
  finally { libraryBusy.value = false; }
};
const savedLibrary = ref<LibraryEntry[]>([]);
const filteredLibrary = computed(() => savedLibrary.value.filter(item =>
  (libraryFilter.value === 'All' || item.category === libraryFilter.value) &&
  item.name.toLowerCase().includes(librarySearch.value.trim().toLowerCase())));
const productImages = computed(() => (props.productImages || []).filter((url): url is string => typeof url === 'string' && /^https:\/\//i.test(url)));
const validLibraryEntry = (value: any): value is LibraryEntry =>
  !!value && typeof value.name === 'string' && value.name.length > 0 && value.name.length <= 80 &&
  (value.kind === 'layout' || value.kind === 'section') && Array.isArray(value.blocks) && value.blocks.length > 0 && value.blocks.length <= 100 &&
  value.blocks.every((block: any) => block && typeof block.type === 'string' && block.type.length < 40);
const loadLibrary = async () => {
  try {
    const result = await adminFetch('/api/admin/description-templates');
    savedLibrary.value = Array.isArray(result) ? result as LibraryEntry[] : [];
  } catch (error: any) { libraryNotice.value = `Could not load shared library: ${error?.data?.statusMessage || error?.message || 'request failed'}`; }
};
onMounted(() => { void loadLibrary(); });
const saveLibraryEntry = async (kind: 'layout' | 'section', block?: DescriptionBlock) => {
  const name = (libraryName.value || (kind === 'section' ? window.prompt('Name this reusable section:', block?.text || block?.type || '') : '') || '').trim();
  if (!name || name.length > 80) { libraryNotice.value = 'Enter a template name (up to 80 characters).'; return; }
  const chosen = kind === 'section' && block ? [block] : blocks.value;
  if (!chosen.length) { libraryNotice.value = 'Add at least one block before saving.'; return; }
  libraryBusy.value = true;
  try {
    await adminFetch('/api/admin/description-templates', { method: 'POST', body: { name, category: libraryCategory.value, kind, blocks: chosen.map(item => JSON.parse(JSON.stringify(stripInternalFields(item)))) } });
    libraryName.value = ''; libraryNotice.value = `Saved "${name}" to the shared library.`;
    await loadLibrary();
  } catch (error: any) { libraryNotice.value = `Save failed: ${error?.data?.statusMessage || error?.message || 'request failed'}`; }
  finally { libraryBusy.value = false; }
};
const useLibraryEntry = (entry: LibraryEntry, replace: boolean) => {
  if (replace && blocks.value.length && !window.confirm('Replace the current description with this saved template? Unsaved changes will be lost.')) return;
  const copied = entry.blocks.map(item => normaliseBlock(JSON.parse(JSON.stringify(item))));
  if (replace) blocks.value = copied;
  else blocks.value.push(...copied);
  libraryNotice.value = `${replace ? 'Loaded' : 'Appended'} "${entry.name}". Review content before saving the product.`;
};
const deleteLibraryEntry = async (id: string) => {
  const entry = savedLibrary.value.find(item => item.id === id);
  if (!entry || !window.confirm(`Delete shared template "${entry.name}" for all admins?`)) return;
  libraryBusy.value = true;
  try {
    await adminFetch(`/api/admin/description-templates/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadLibrary(); libraryNotice.value = 'Shared template deleted.';
  } catch (error: any) { libraryNotice.value = `Delete failed: ${error?.data?.statusMessage || error?.message || 'request failed'}`; }
  finally { libraryBusy.value = false; }
};
const exportLibrary = () => {
  if (!savedLibrary.value.length) { libraryNotice.value = 'No templates to export.'; return; }
  const blob = new Blob([JSON.stringify({ version: 1, templates: savedLibrary.value }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'kialla-description-library.json'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); libraryNotice.value = 'Shared library backup downloaded.';
};
const importLibrary = async (event: Event) => {
  const input = event.target as HTMLInputElement; const file = input.files?.[0];
  input.value = ''; if (!file) return;
  if (file.size > 2_000_000) { libraryNotice.value = 'File too large (maximum 2 MB).'; return; }
  libraryBusy.value = true;
  try {
    const parsed = JSON.parse(await file.text());
    if (parsed?.version !== 1 || !Array.isArray(parsed.templates) || parsed.templates.length > 60 || !parsed.templates.every(validLibraryEntry)) throw new Error('Invalid library format');
    let imported = 0;
    for (const entry of parsed.templates as LibraryEntry[]) {
      await adminFetch('/api/admin/description-templates', { method: 'POST', body: { name: entry.name, category: libraryCategories.includes(entry.category) ? entry.category : 'General', kind: entry.kind, blocks: entry.blocks } });
      imported++;
    }
    await loadLibrary(); libraryNotice.value = `Imported ${imported} template(s) to Supabase.`;
  } catch (error: any) { libraryNotice.value = `Import stopped: ${error?.data?.statusMessage || error?.message || 'invalid file'}. Previously imported entries remain saved.`; }
  finally { libraryBusy.value = false; }
};

const descriptionPresets = [
  { id: 'retail', name: 'Modern Retail', description: 'Overview, selling points, image and specifications.' },
  { id: 'technical', name: 'Technical Professional', description: 'Detailed specifications, compatibility and downloads.' },
  { id: 'premium', name: 'Premium Showcase', description: 'Strong visual introduction, feature highlights and key details.' },
] as const;
const onBlockDragStart = (event: DragEvent, index: number) => {
  draggedBlockIndex.value = index;
  if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(index)); }
};
const onBlockDrop = (target: number) => {
  const from = draggedBlockIndex.value;
  draggedBlockIndex.value = null;
  if (from === null || from === target || from < 0 || from >= blocks.value.length) return;
  const [block] = blocks.value.splice(from, 1);
  blocks.value.splice(target, 0, block);
};
const applyDescriptionPreset = (id: string) => {
  if (blocks.value.length && !window.confirm('Replace your current description blocks with this template? Existing unsaved description content will be replaced.')) return;
  const section = (type: string, values: Record<string, any> = {}) => normaliseBlock({ type, ...values });
  const overview = section('paragraph', { paragraphHeading: 'Product Overview', text: 'Write a concise introduction explaining what this product does and who it is for.' });
  const benefits = section('list', { items: ['Add the first verified benefit', 'Add another useful feature', 'Explain a practical customer benefit'] });
  const specs = section('table', { headers: ['Specification', 'Details'], rows: [['Brand', ''], ['Model', ''], ['Key specification', '']] });
  const image = section('image', { caption: 'Add a clear product or feature image', alt: 'Product feature image' });
  const cards = section('feature_cards', { text: 'Product Highlights', columns: 3, features: [{ title: 'Performance', description: 'Describe a verified advantage.' }, { title: 'Connectivity', description: 'Describe supported connections.' }, { title: 'Reliability', description: 'Describe the practical benefit.' }] });
  const templates: Record<string, DescriptionBlock[]> = {
    retail: [section('heading', { text: 'Why Choose This Product?', level: 2 }), overview, section('heading', { text: 'Key Features', level: 3 }), benefits, cards, image, section('heading', { text: 'Technical Specifications', level: 3 }), specs],
    technical: [section('heading', { text: 'Product Overview', level: 2 }), overview, section('heading', { text: 'Technical Specifications', level: 3 }), specs, section('heading', { text: 'Compatibility & Requirements', level: 3 }), section('paragraph', { text: 'Enter verified compatibility, connectivity and system requirements.' }), section('heading', { text: 'Included in the Box', level: 3 }), section('list', { items: ['List included accessories'] })],
    premium: [section('heading', { text: 'Designed to Perform', level: 2 }), overview, image, cards, section('heading', { text: 'Highlights', level: 3 }), benefits, section('paragraph', { paragraphHeading: 'Built for Your Needs', text: 'Explain the product’s main advantage with clear, customer-friendly language.' }), section('heading', { text: 'At a Glance', level: 3 }), specs],
  };
  blocks.value = templates[id] || templates.retail;
  templateNotice.value = 'Template added. Replace all placeholder text and verify specifications before saving.';
  showPreview.value = true;
};

const appendSection = (kind: string) => {
  const section = (type: string, values: Record<string, any> = {}) => normaliseBlock({ type, ...values });
  if (kind === 'highlights') blocks.value.push(createBlock('feature_cards'));
  if (kind === 'warranty') blocks.value.push(section('paragraph', { paragraphHeading: 'Warranty & Support', text: 'Enter the verified manufacturer warranty, coverage and support arrangements.' }));
  if (kind === 'box') blocks.value.push(section('list', { items: ['List each included item', 'Add included accessories'] }));
  if (kind === 'specs') blocks.value.push(section('table', { headers: ['Specification', 'Details'], rows: [['Brand', ''], ['Model', ''], ['Connectivity', '']] }));
  if (kind === 'showcase') blocks.value.push(createBlock('image_text'));
  if (kind === 'shipping') blocks.value.push(section('paragraph', { paragraphHeading: 'Delivery & Shipping', text: 'Enter your actual dispatch, shipping and collection arrangements.' }));
  if (kind === 'refurbished') blocks.value.push(section('paragraph', { paragraphHeading: 'Refurbished Product Condition', text: 'Describe the inspected condition, included accessories, testing performed and applicable warranty.' }));
  templateNotice.value = 'Section appended. Replace placeholders and verify all details before publishing.';
};

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

// Keep the contenteditable DOM under the browser's control while the user is
// typing. Re-applying innerHTML on every reactive update resets the caret to
// the beginning, which makes newly typed text appear backwards.
const vCaptionHtml = {
  mounted(el: HTMLElement, binding: { value?: string }) {
    el.innerHTML = binding.value || "";
  },
  updated(el: HTMLElement, binding: { value?: string }) {
    // Never replace the editor HTML while it has focus; doing so destroys the
    // current selection/caret. We still refresh it when data is loaded or
    // changed externally and the editor is not being edited.
    if (typeof document !== "undefined" && document.activeElement === el) return;

    const html = binding.value || "";
    if (el.innerHTML !== html) {
      el.innerHTML = html;
    }
  },
};

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

// Keep caption line breaks predictable. Browsers often create <div> elements when
// Enter is pressed inside contenteditable, but the storefront sanitiser deliberately
// allows <br> instead. Insert an explicit <br> so new lines are saved and displayed.
const handleCaptionKeydown = (block: DescriptionBlock, event: KeyboardEvent) => {
  if (event.key !== "Enter") return;

  event.preventDefault();

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const br = document.createElement("br");
  range.insertNode(br);

  // Put the caret immediately after the new line so typing can continue normally.
  range.setStartAfter(br);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  captionSelections.set(block._key, range.cloneRange());
  syncCaptionEditor(block);
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

const paragraphHeadingSizeClass = (size?: string) => {
  if (size === "sm") return "text-sm";
  if (size === "base") return "text-base";
  if (size === "xl") return "text-xl";
  if (size === "2xl") return "text-2xl";
  return "text-lg";
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

  const styleDefaults: Record<string, { fontColor: string; backgroundColor: string; textAlign: DescriptionBlock["textAlign"] }> = {
    heading: { fontColor: "#566C9D", backgroundColor: "#ffffff", textAlign: "center" },
    paragraph: { fontColor: "#374151", backgroundColor: "#ffffff", textAlign: "left" },
    link: { fontColor: "#2563eb", backgroundColor: "#ffffff", textAlign: "left" },
    downloads: { fontColor: "#374151", backgroundColor: "#ffffff", textAlign: "left" },
    quote: { fontColor: "#4b5563", backgroundColor: "#ffffff", textAlign: "left" },
    warning: { fontColor: "#854d0e", backgroundColor: "#fefce8", textAlign: "left" },
    info: { fontColor: "#1e3a8a", backgroundColor: "#eff6ff", textAlign: "left" },
    list: { fontColor: "#374151", backgroundColor: "#ffffff", textAlign: "left" },
    table: { fontColor: "#374151", backgroundColor: "#ffffff", textAlign: "left" },
    image_text: { fontColor: "#1e293b", backgroundColor: "#ffffff", textAlign: "left" },
    feature_cards: { fontColor: "#1e293b", backgroundColor: "#ffffff", textAlign: "left" },
    image: { fontColor: "#64748b", backgroundColor: "#ffffff", textAlign: "left" },
  };

  const defaults = styleDefaults[type] || styleDefaults.paragraph;
  base.fontColor = input?.fontColor || (type === "heading" ? input?.headingColor : "") || defaults.fontColor;
  base.backgroundColor = input?.backgroundColor || defaults.backgroundColor;
  base.textAlign = ["left", "center", "right", "justify"].includes(input?.textAlign)
    ? input.textAlign
    : defaults.textAlign;

  if (type === "tabbed_specs") {
    base.tabs = Array.isArray(input?.tabs) ? input.tabs.slice(0, 4).map((tab: any) => ({
      title: String(tab?.title ?? ''),
      specs: Array.isArray(tab?.specs) ? tab.specs.map((spec: any) => ({ label: String(spec?.label ?? ''), value: String(spec?.value ?? '') })) : [],
    })) : [];
  }

  if (type === "feature_cards") {
    base.text = typeof input?.text === "string" ? input.text : "Product Highlights";
    base.columns = [2, 3, 4].includes(Number(input?.columns)) ? Number(input.columns) : 3;
    base.features = Array.isArray(input?.features) ? input.features.map((f: any) => ({ title: String(f?.title || ""), description: String(f?.description || ""), icon: String(f?.icon || "") })) : [];
  }
  if (type === "image_text") {
    base.text = String(input?.text || "Product Showcase");
    base.showcaseBody = String(input?.showcaseBody || "");
    base.showcaseImageUrl = String(input?.showcaseImageUrl || "");
    base.showcaseImageAlt = String(input?.showcaseImageAlt || "");
    base.showcaseImageSide = input?.showcaseImageSide === "right" ? "right" : "left";
    base.showcaseStyle = ["clean", "soft", "dark"].includes(input?.showcaseStyle) ? input.showcaseStyle : "clean";
  }
  if (type === "heading") {
    base.text = input?.text || "";
    base.level = Number(input?.level || 2);
    base.headingColor = base.fontColor;
    base.underline = input?.underline === true;
  } else if (type === "paragraph") {
    base.text = input?.text || "";
    base.paragraphHeading = input?.paragraphHeading || "";
    base.paragraphHeadingSize = ["sm", "base", "lg", "xl", "2xl"].includes(String(input?.paragraphHeadingSize))
      ? input.paragraphHeadingSize
      : "lg";
    base.paragraphHeadingColor = input?.paragraphHeadingColor || "#1f2937";
    base.paragraphHeadingBold = input?.paragraphHeadingBold !== false;
    base.paragraphImageUrl = input?.paragraphImageUrl || "";
    base.paragraphImagePath = input?.paragraphImagePath || "";
    base.paragraphImageAlt = input?.paragraphImageAlt || "";
    base.paragraphImagePosition = input?.paragraphImagePosition === "right" ? "right" : "left";
    base.paragraphImageWidth = ["25", "35", "40", "50"].includes(String(input?.paragraphImageWidth))
      ? String(input.paragraphImageWidth) as DescriptionBlock["paragraphImageWidth"]
      : "35";
  } else if (type === "link") {
    base.linkText = input?.linkText || "";
    base.linkUrl = input?.linkUrl || "";
    base.linkStyle = input?.linkStyle === "button" ? "button" : "text";
  } else if (type === "downloads") {
    base.downloads = Array.isArray(input?.downloads)
      ? input.downloads.map((item: any) => ({
          _key: item?._key || makeKey(), description: item?.description || "", size: item?.size || "", fileType: item?.fileType || item?.type || "", url: item?.url || "",
        }))
      : [];
  } else if (type === "image") {
    base.url = input?.url || "";
    base.path = input?.path || "";
    base.alt = input?.alt || "";
    base.caption = input?.caption || "";
    base.captionBold = Boolean(input?.captionBold);
    base.captionFontSize = input?.captionFontSize || "sm";
    base.captionColor = input?.captionColor || input?.fontColor || "#64748b";
    base.captionBackgroundColor = input?.captionBackgroundColor || input?.backgroundColor || "#ffffff";
    base.captionPosition = input?.captionPosition === "above" ? "above" : "below";
    base.textAlign = ["left", "center", "right", "justify"].includes(input?.textAlign) ? input.textAlign : "left";
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
      underline: false,
    });
  }

  if (type === "paragraph") {
    return normaliseBlock({
      type,
      text: "",
      paragraphHeading: "",
      paragraphHeadingSize: "lg",
      paragraphHeadingColor: "#1f2937",
      paragraphHeadingBold: true,
    });
  }

  if (type === "link") return normaliseBlock({ type, linkText: "", linkUrl: "", linkStyle: "text", textAlign: "left" });
  if (type === "downloads") return normaliseBlock({ type, downloads: [] });

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
      textAlign: "left",
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

  if (type === "tabbed_specs") return normaliseBlock({ type, text: "Main Specifications", tabs: [{ title: "General", specs: [{ label: "", value: "" }] }] });

  if (type === "table") {
    return normaliseBlock({
      type,
      headers: ["Feature", "Specification"],
      rows: [["", ""]],
    });
  }

  if (type === "image_text") {
    return normaliseBlock({ type, text: "Product Showcase", showcaseBody: "Explain a verified customer benefit.", showcaseImageUrl: "", showcaseImageAlt: "", showcaseImageSide: "left", showcaseStyle: "soft" });
  }
  if (type === "feature_cards") {
    return normaliseBlock({ type, text: "Product Highlights", columns: 3, features: [
      { title: "Feature One", description: "Describe the customer benefit." },
      { title: "Feature Two", description: "Add a verified product detail." },
      { title: "Feature Three", description: "Explain what makes this useful." },
    ] });
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

const pasteSpecifications = (tab: { title: string; specs: Array<{ label: string; value: string }> }, key: string, index: number) => {
  const field = document.getElementById(`spec-paste-${key}-${index}`) as HTMLTextAreaElement | null;
  if (!field) return;
  for (const line of field.value.split(/\r?\n/)) {
    const match = line.match(/^(.+?)(?:\t|:\s+)(.+)$/);
    if (match) tab.specs.push({ label: match[1].trim(), value: match[2].trim() });
  }
  field.value = '';
};

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
// DOWNLOADS
// ========================================
const addDownloadRow = (block: DescriptionBlock) => {
  if (!Array.isArray(block.downloads)) block.downloads = [];
  block.downloads.push({ _key: makeKey(), description: "", size: "", fileType: "", url: "" });
};
const removeDownloadRow = (block: DescriptionBlock, index: number) => block.downloads?.splice(index, 1);
const moveDownloadRow = (block: DescriptionBlock, index: number, direction: number) => {
  if (!block.downloads) return; const target=index+direction; if(target<0||target>=block.downloads.length)return;
  const [item]=block.downloads.splice(index,1); block.downloads.splice(target,0,item);
};
// ========================================
// PARAGRAPH IMAGE
// ========================================

const uploadParagraphImage = async (event: Event, index: number) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  const block = blocks.value[index];
  if (!block || block.type !== "paragraph") {
    input.value = "";
    return;
  }

  uploadingImageKey.value = block._key;
  imageUploadError.value = "";
  imageUploadErrorKey.value = block._key;

  try {
    const formData = new FormData();
    formData.append("file", file);

    const result = await adminFetch<{ path: string; url: string }>(
      "/api/admin/products/upload-image",
      { method: "POST", body: formData },
    );

    block.paragraphImageUrl = result.url;
    block.paragraphImagePath = result.path;

    if (!block.paragraphImageAlt) {
      block.paragraphImageAlt = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim();
    }
  } catch (error: any) {
    console.error("PARAGRAPH IMAGE UPLOAD ERROR:", error);
    imageUploadError.value =
      error?.data?.statusMessage ||
      error?.message ||
      "Unable to upload paragraph image.";
  } finally {
    uploadingImageKey.value = null;
    input.value = "";
  }
};

const removeParagraphImage = (block: DescriptionBlock) => {
  block.paragraphImageUrl = "";
  block.paragraphImagePath = "";
  block.paragraphImageAlt = "";
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


const autoGrowTableCell = (event: Event) => {
  const el = event.target as HTMLTextAreaElement | null;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

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
    link: "Link",
    downloads: "Downloads",
    image: "Image",
    list: "List",
    table: "Table",
    tabbed_specs: "Tabbed Specifications",
    quote: "Quote",
    warning: "Warning",
    info: "Info Box",
    divider: "Divider",
    feature_cards: "Feature Cards",
    image_text: "Image + Text Showcase",
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


.table-cell-textarea {
  min-height: 2.625rem;
  resize: vertical;
  overflow: hidden;
  white-space: pre-wrap;
  line-height: 1.4;
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
