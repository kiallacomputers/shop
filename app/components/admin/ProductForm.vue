<script setup>
const emit = defineEmits(['close', 'saved'])

const supabase = useSupabaseClient()

const loading = ref(false)
const errorMessage = ref('')

const product = ref({
  name: '',
  slug: '',
  description: '',
  price: '',
  stock: 0,
  category_id: '',
  images: '',
  featured: false,
  active: true
})

const { data: categories } = await useAsyncData(
  'product-form-categories',
  async () => {

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('sort_order', {
        ascending: true
      })

    if (error) {
      throw error
    }

    return data || []
  }
)

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

watch(
  () => product.value.name,
  (value) => {
    product.value.slug = createSlug(value)
  }
)

async function addProduct() {

  loading.value = true
  errorMessage.value = ''

  try {

    const { error } = await supabase
      .from('products')
      .insert({
        name: product.value.name.trim(),
        slug: product.value.slug.trim(),
        description: product.value.description?.trim() || null,
        price: Number(product.value.price),
        stock: Number(product.value.stock),
        category_id: product.value.category_id || null,
        images: product.value.images?.trim() || null,
        featured: product.value.featured,
        active: product.value.active
      })

    if (error) {
      throw error
    }

    emit('saved')

  } catch (error) {

    console.error(error)

    errorMessage.value =
      error?.message ||
      'Unable to add product.'

  } finally {

    loading.value = false

  }
}
</script>
