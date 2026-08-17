<template>
  <div class="bg-white border rounded-xl p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-bold">
        Product Description
      </h2>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
          @click="addHeader"
        >
          + Header
        </button>

        <button
          type="button"
          class="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
          @click="addParagraph"
        >
          + Paragraph
        </button>

        <button
          type="button"
          class="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
          @click="addList"
        >
          + List
        </button>

        <button
          type="button"
          class="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
          @click="addTable"
        >
          + Table
        </button>
      </div>
    </div>

    <div
      v-if="blocks.length === 0"
      class="text-gray-400 text-sm"
    >
      No content blocks added.
    </div>

    <div
      v-for="(block,index) in blocks"
      :key="index"
      class="border rounded-xl p-4 mb-4"
    >
      <!-- HEADER -->

      <template
        v-if="block.type === 'header'"
      >
        <div class="flex gap-3 mb-3">
          <select
            v-model="block.level"
            class="border rounded-lg px-3 py-2"
          >
            <option :value="1">
              H1
            </option>

            <option :value="2">
              H2
            </option>

            <option :value="3">
              H3
            </option>

            <option :value="4">
              H4
            </option>
          </select>

          <button
            class="ml-auto text-red-600"
            @click="removeBlock(index)"
          >
            Delete
          </button>
        </div>

        <input
          v-model="block.text"
          placeholder="Header text"
          class="w-full border rounded-lg px-3 py-2"
        >
      </template>

      <!-- PARAGRAPH -->

      <template
        v-else-if="
          block.type === 'paragraph'
        "
      >
        <div class="flex justify-between mb-3">
          <span class
