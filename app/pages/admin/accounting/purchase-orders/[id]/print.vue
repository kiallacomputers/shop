<script setup lang="ts">
definePageMeta({ layout:'admin', middleware:['admin'] })
const route=useRoute(); await navigateTo(`/admin/purchasing/purchase-orders/${route.params.id}/print`,{replace:true})
</script><template><div /></template>
