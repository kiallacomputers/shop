<script setup>
definePageMeta({
  layout: "auth",
});

  const supabase = useSupabaseClient()

const loading = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: ''
})

const errorMessage = ref('')
const successMessage = ref('')

const signUp = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const { error } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
    options: {
      data: {
        display_name: form.FullName,
      }
    }
  })

  loading.value = false

  if (error) {
    errorMessage.value = error.message
    return
  }

  successMessage.value =
    'Your account has been created. Please check your email to verify your account.'
// Redirect after 5 seconds
  setTimeout(() => {
    router.push("/")
  }, 5000)
}
</script>

<template>
  <div class="max-w-md mx-auto bg-white rounded-lg p-6">
    <h1 class="text-2xl font-bold mb-6">
      Create Account
    </h1>

    <form @submit.prevent="signUp" class="space-y-4">

      <div>
        <label class="block mb-1">Full Name</label>
        <input
          v-model="form.FullName"
          type="text"
          required
          class="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label class="block mb-1">Email</label>
        <input
          v-model="form.email"
          type="email"
          required
          class="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label class="block mb-1">Password</label>
        <input
          v-model="form.password"
          type="password"
          required
          minlength="8"
          class="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700"
      >
        {{ loading ? 'Creating Account...' : 'Create Account' }}
      </button>

      <p v-if="errorMessage" class="text-red-600">
        {{ errorMessage }}
      </p>

      <p v-if="successMessage" class="text-green-600">
        {{ successMessage }}
      </p>
    </form>
  </div>
</template>
