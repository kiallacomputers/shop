<script setup lang="ts">
definePageMeta({ layout:'admin', middleware:['admin'] })
const route=useRoute(); await navigateTo({path:'/admin/purchasing/purchase-orders/new',query:route.query},{replace:true})
</script><template><div /></template>
