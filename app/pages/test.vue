<template>
  <div
    v-for="(section, index) in product.description"
    :key="index"
    class="mb-6"
  >
    <!-- Heading -->
    <h2
      v-if="section.type === 'heading'"
      class="text-2xl font-semibold border-b border-gray-200 pb-2 mb-4"
    >
      {{ section.text }}
    </h2>

    <!-- Paragraph -->
    <p
      v-else-if="section.type === 'paragraph'"
      class="text-gray-700 leading-7 mb-4"
    >
      {{ section.text }}
    </p>

    <!-- Dot Points -->
    <ul
      v-else-if="section.type === 'list'"
      class="list-disc pl-6 space-y-2 text-gray-700"
    >
      <li v-for="(item, i) in section.items" :key="i">
        {{ item }}
      </li>
    </ul>

    <!-- Table -->
    <div
      v-else-if="section.type === 'table'"
      class="overflow-hidden rounded-lg border border-gray-200"
    >
      <table class="w-full">
        <thead class="bg-gray-100">
          <tr>
            <th
              v-for="header in section.headers"
              :key="header"
              class="p-3 text-left font-semibold"
            >
              {{ header }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(row, r) in section.rows" :key="r" class="border-t">
            <td v-for="(cell, c) in row" :key="c" class="p-3">
              {{ cell }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const products = ref([
  {
    id: 1,
    name: "Intel Core i7-14700K",
    description: [
      {
        type: "heading",
        text: "Product Description",
      },
      {
        type: "paragraph",
        text: "The Intel Core i7-14700K is a high-performance desktop processor designed for gaming, content creation, and multitasking.",
      },
      {
        type: "paragraph",
        text: "Featuring 20 cores and support for DDR5 memory, it delivers exceptional performance for demanding workloads.",
      },
      {
        type: "heading",
        text: "Key Features",
      },
      {
        type: "list",
        items: [
          "20 Cores (8 Performance + 12 Efficient)",
          "28 Threads",
          "Up to 5.6GHz Turbo",
          "Intel UHD 770 Graphics",
          "Supports DDR4 & DDR5 Memory",
        ],
      },
      {
        type: "heading",
        text: "Specifications",
      },
      {
        type: "table",
        headers: ["Specification", "Value"],
        rows: [
          ["Socket", "LGA1700"],
          ["Base Clock", "3.4 GHz"],
          ["Max Turbo", "5.6 GHz"],
          ["Cache", "33 MB"],
          ["TDP", "125 W"],
          ["PCIe", "5.0"],
        ],
      },
    ],
  },
]);

const product = computed(() => products.value[0]);
</script>
