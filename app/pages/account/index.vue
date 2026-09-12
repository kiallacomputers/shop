<template>
  <div class="kc-page">
    <div class="mb-8">
      <p class="kc-eyebrow">Customer account</p>
      <h1 class="kc-title mt-1 text-3xl">My Account</h1>
      <p v-if="user" class="text-slate-600 mt-2">Welcome, {{ user.email }}</p>
    </div>

    <div v-if="loading" class="kc-state">
      <p>Loading your account…</p>
    </div>

    <div v-else-if="errorMessage" class="kc-alert kc-alert-error">
      <h2 class="text-xl font-bold text-red-700 mb-2">Unable to load your account</h2>
      <p class="text-red-600">{{ errorMessage }}</p>
    </div>

    <div v-else>
      <div v-if="successMessage" class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
        {{ successMessage }}
      </div>

      <div v-if="addressError" class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {{ addressError }}
      </div>

            <div class="mb-5 lg:hidden">
        <label class="mb-2 block text-sm font-bold text-slate-700" for="account-section-mobile">
          Account Section
        </label>
        <select
          id="account-section-mobile"
          :value="activeAccountSection"
          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
          @change="handleAccountSectionSelect"
        >
          <option v-for="section in accountSections" :key="section.id" :value="section.id">
            {{ section.label }}
          </option>
        </select>
      </div>

      <div class="grid items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside class="sticky top-24 hidden lg:block">
          <nav class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="My Account sections">
            <p class="px-3 pb-2 pt-1 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
              My Account
            </p>

            <button
              v-for="section in accountSections"
              :key="section.id"
              type="button"
              class="mb-1 flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition"
              :class="
                activeAccountSection === section.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              "
              @click="activeAccountSection = section.id"
            >
              <span>{{ section.label }}</span>
              <span
                v-if="section.id === 'account-orders' && dashboardStats.orders"
                class="inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black"
                :class="activeAccountSection === section.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'"
              >
                {{ dashboardStats.orders }}
              </span>
              <span
                v-else-if="section.id === 'account-wishlist' && dashboardStats.wishlist"
                class="inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black"
                :class="activeAccountSection === section.id ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'"
              >
                {{ dashboardStats.wishlist }}
              </span>
            </button>
          </nav>
        </aside>

        <div class="min-w-0">
<section class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5" id="account-overview" v-show="activeAccountSection === 'account-overview'">
        <div class="kc-panel p-5"><p class="text-xs font-bold uppercase tracking-wide text-slate-500">Orders</p><p class="mt-2 text-3xl font-black text-slate-900">{{ dashboardStats.orders }}</p></div>
        <div class="kc-panel p-5"><p class="text-xs font-bold uppercase tracking-wide text-slate-500">Open Orders</p><p class="mt-2 text-3xl font-black text-blue-700">{{ dashboardStats.openOrders }}</p></div>
        <div class="kc-panel p-5"><p class="text-xs font-bold uppercase tracking-wide text-slate-500">Total Spent</p><p class="mt-2 text-2xl font-black text-slate-900">{{ currency(dashboardStats.totalSpent) }}</p></div>
        <NuxtLink to="/account/wishlist" class="kc-panel p-5 transition hover:border-rose-300"><p class="text-xs font-bold uppercase tracking-wide text-slate-500">Wishlist</p><p class="mt-2 text-3xl font-black text-rose-600">{{ dashboardStats.wishlist }}</p></NuxtLink>
        <div class="kc-panel p-5"><p class="text-xs font-bold uppercase tracking-wide text-slate-500">Quote Requests</p><p class="mt-2 text-3xl font-black text-slate-900">{{ dashboardStats.quotes }}</p></div>
      </section>

      <section class="kc-panel p-6 mb-8" id="account-profile" v-show="activeAccountSection === 'account-profile'">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Customer Profile</h2>
            <p class="mt-1 text-sm text-slate-500">Keep your contact details and notification preferences up to date.</p>
          </div>
          <button type="button" class="kc-btn-secondary !py-2.5 !px-4 text-sm" @click="showProfileForm = !showProfileForm">
            {{ showProfileForm ? 'Close' : 'Edit Profile' }}
          </button>
        </div>

        <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div><p class="text-xs font-bold uppercase text-slate-400">Name</p><p class="mt-1 font-semibold">{{ customerProfile.display_name || '—' }}</p></div>
          <div><p class="text-xs font-bold uppercase text-slate-400">Business</p><p class="mt-1 font-semibold">{{ customerProfile.business_name || '—' }}</p></div>
          <div><p class="text-xs font-bold uppercase text-slate-400">Phone</p><p class="mt-1 font-semibold">{{ customerProfile.phone || '—' }}</p></div>
          <div><p class="text-xs font-bold uppercase text-slate-400">Preferred Contact</p><p class="mt-1 font-semibold capitalize">{{ customerProfile.preferred_contact || 'email' }}</p></div>
        </div>

        <div v-if="showProfileForm" class="mt-6 border-t border-slate-200 pt-6">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label><span class="mb-1.5 block text-sm font-semibold">Name</span><input v-model="profileForm.display_name" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
            <label><span class="mb-1.5 block text-sm font-semibold">Business Name</span><input v-model="profileForm.business_name" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
            <label><span class="mb-1.5 block text-sm font-semibold">Phone</span><input v-model="profileForm.phone" type="tel" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
            <label><span class="mb-1.5 block text-sm font-semibold">Preferred Contact</span><select v-model="profileForm.preferred_contact" class="w-full rounded-lg border border-slate-300 px-3 py-2.5"><option value="email">Email</option><option value="phone">Phone</option></select></label>
          </div>
          <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label class="flex items-center gap-2 text-sm"><input v-model="profileForm.order_updates" type="checkbox" /> Order updates</label>
            <label class="flex items-center gap-2 text-sm"><input v-model="profileForm.back_in_stock_updates" type="checkbox" /> Back-in-stock notices</label>
            <label class="flex items-center gap-2 text-sm"><input v-model="profileForm.marketing_updates" type="checkbox" /> Specials and new products</label>
          </div>
          <div class="mt-5 text-right"><button type="button" :disabled="savingProfile" class="kc-btn-primary !py-2.5 !px-5" @click="saveProfile">{{ savingProfile ? 'Saving...' : 'Save Profile' }}</button></div>
        </div>
      </section>

      <section class="kc-panel p-6 mb-8" id="account-wishlist" v-show="activeAccountSection === 'account-wishlist'">
        <div class="flex items-center justify-between gap-4">
          <div><h2 class="text-xl font-bold text-slate-900">Wishlist</h2><p class="mt-1 text-sm text-slate-500">Keep products handy while you decide.</p></div>
          <NuxtLink to="/account/wishlist" class="text-sm font-bold text-blue-600 hover:text-blue-700">View Wishlist →</NuxtLink>
        </div>
        <div v-if="wishlistPreview.length" class="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <NuxtLink v-for="item in wishlistPreview" :key="item.id" :to="`/product/${item.slug}`" class="rounded-xl border border-slate-200 p-4 hover:border-blue-300">
            <p class="font-bold text-slate-900 line-clamp-2">{{ item.name }}</p>
            <p class="mt-2 text-sm text-blue-700">View product →</p>
          </NuxtLink>
        </div>
        <p v-else class="mt-4 text-sm text-slate-500">No saved products yet.</p>
      </section>

      <section class="kc-panel p-6 mb-8" id="account-back-in-stock" v-show="activeAccountSection === 'account-back-in-stock'">
        <div class="flex items-center justify-between gap-4">
          <div><h2 class="text-xl font-bold text-slate-900">Back in Stock Notifications</h2><p class="mt-1 text-sm text-slate-500">Products you have asked us to notify you about.</p></div>
        </div>
        <div v-if="backInStockNotifications.length" class="mt-5 divide-y divide-slate-100">
          <div v-for="notice in backInStockNotifications" :key="notice.id" class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <NuxtLink :to="`/product/${notice.products?.slug}`" class="font-bold text-slate-900 hover:text-blue-600">{{ notice.products?.name }}<span v-if="notice.product_variants?.name"> — {{ notice.product_variants.name }}</span></NuxtLink>
              <p class="mt-1 text-xs text-slate-500">Requested {{ formatDate(notice.requested_at) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="rounded-full px-2.5 py-1 text-xs font-bold capitalize" :class="notice.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : notice.status === 'waiting' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'">{{ notice.status }}</span>
              <button v-if="notice.status === 'waiting'" type="button" :disabled="cancellingBackInStockId === Number(notice.id)" class="text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50" @click="cancelBackInStock(notice)">{{ cancellingBackInStockId === Number(notice.id) ? 'Cancelling…' : 'Cancel' }}</button>
            </div>
          </div>
        </div>
        <p v-else class="mt-4 text-sm text-slate-500">You are not currently waiting for any products.</p>
      </section>

      <section class="kc-panel p-6 mb-8" id="account-quotes" v-show="activeAccountSection === 'account-quotes'">
        <div class="flex items-center justify-between gap-4">
          <div><h2 class="text-xl font-bold text-slate-900">Quote Requests</h2><p class="mt-1 text-sm text-slate-500">Quotes requested from your shopping cart.</p></div>
          <NuxtLink to="/shoppingcart" class="text-sm font-bold text-blue-600 hover:text-blue-700">Request a Quote →</NuxtLink>
        </div>
        <div v-if="quoteRequests.length" class="mt-5 divide-y divide-slate-100">
          <div v-for="quote in quoteRequests.slice(0, 5)" :key="quote.id" class="py-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="font-bold">{{ quote.quote_number || `Quote #${quote.id}` }}</p>
                <p class="text-xs text-slate-500">{{ formatDate(quote.created_at) }} · {{ quote.customer_quote_request_items?.length || 0 }} item(s)</p>
                <p v-if="quote.expires_at && quote.status === 'quoted'" class="mt-1 text-xs font-semibold" :class="quoteExpired(quote) ? 'text-amber-700' : 'text-slate-500'">{{ quoteExpired(quote) ? 'Expired' : 'Valid until' }} {{ formatDate(quote.expires_at) }}</p>
                <div v-if="quote.customer_quote_request_items?.length" class="mt-3 space-y-1">
                  <p v-for="item in quote.customer_quote_request_items" :key="item.id" class="text-sm text-slate-600">
                    {{ item.quantity }} × {{ item.product_name }}<span v-if="item.variant_name"> — {{ item.variant_name }}</span>
                    <span v-if="quote.status === 'quoted'" class="font-semibold text-slate-800"> · {{ currency(item.quoted_price ?? item.requested_price) }}</span>
                  </p>
                </div>
              </div>
              <div class="sm:text-right">
                <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-700">{{ quoteExpired(quote) ? 'Expired' : quote.status }}</span>
                <p v-if="quote.quoted_total != null" class="mt-2 text-lg font-black text-slate-900">{{ currency(quote.quoted_total) }}</p>
                <a v-if="['quoted','accepted','closed'].includes(quote.status)" :href="`/api/account/quotes/${quote.id}/pdf`" class="mt-2 inline-block text-sm font-bold text-blue-600 hover:text-blue-700">Download PDF Quote</a>
                <button
                  v-if="quote.status === 'quoted' && !quoteExpired(quote) && Number(quote.quoted_total) > 0"
                  type="button"
                  class="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                  :disabled="payingQuoteId === Number(quote.id)"
                  @click="payQuote(quote)"
                >
                  {{ payingQuoteId === Number(quote.id) ? 'Opening Stripe…' : 'Accept Quote / Pay Now' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="mt-4 text-sm text-slate-500">No quote requests yet.</p>
      </section>

      <section class="kc-panel p-6 mb-8" id="account-information" v-show="activeAccountSection === 'account-information'">
        <h2 class="text-xl font-bold mb-4 text-slate-900">Account Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p class="text-sm text-slate-500">Email</p>
            <p class="font-semibold mt-1">{{ user?.email }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500">Customer ID</p>
            <p class="font-mono text-sm mt-1 break-all">{{ user?.id }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500">Pricing Level</p>
            <p class="font-semibold mt-1 text-blue-700">{{ pricingLevelName }}</p>
          </div>
        </div>
      </section>

      <section class="kc-panel p-6 mb-8" id="account-security" v-show="activeAccountSection === 'account-security'">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Account Security</h2>
            <p class="mt-1 text-sm text-slate-500">
              Change the password used to sign in to your Kialla Computers account.
            </p>
          </div>
          <button
            type="button"
            class="kc-btn-secondary !px-4 !py-2.5 text-sm"
            @click="togglePasswordForm"
          >
            {{ showPasswordForm ? "Cancel" : "Change Password" }}
          </button>
        </div>

        <div
          v-if="passwordSuccess"
          class="kc-alert kc-alert-success mt-5"
        >
          {{ passwordSuccess }}
        </div>

        <div
          v-if="passwordError"
          class="kc-alert kc-alert-error mt-5"
        >
          {{ passwordError }}
        </div>

        <form
          v-if="showPasswordForm"
          class="mt-6 border-t border-slate-200 pt-6"
          @submit.prevent="changePassword"
        >
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">
                New Password
              </span>
              <input
                v-model="newPassword"
                type="password"
                autocomplete="new-password"
                minlength="8"
                required
                class="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>

            <label>
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">
                Confirm New Password
              </span>
              <input
                v-model="confirmNewPassword"
                type="password"
                autocomplete="new-password"
                minlength="8"
                required
                class="w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>
          </div>

          <p class="mt-3 text-xs text-slate-500">
            Your password must be at least 8 characters long.
          </p>

          <div class="mt-5 flex justify-end">
            <button
              type="submit"
              :disabled="changingPassword"
              class="kc-btn-primary !px-5 !py-2.5"
            >
              {{ changingPassword ? "Updating Password..." : "Update Password" }}
            </button>
          </div>
        </form>
      </section>

      <!-- ADDRESS BOOK -->
      <section class="kc-panel mb-8 overflow-hidden" id="account-addresses" v-show="activeAccountSection === 'account-addresses'">
        <div class="p-6 border-b border-slate-200 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Delivery Addresses</h2>
            <p class="mt-1 text-sm text-slate-500">Save multiple delivery addresses and choose one as your primary address.</p>
          </div>
          <button
            v-if="!showAddressForm"
            type="button"
            class="kc-btn-primary !py-2.5 !px-4"
            @click="openAddAddress"
          >
            + Add Address
          </button>
        </div>

        <div v-if="showAddressForm" class="p-6 bg-slate-50 border-b border-slate-200">
          <div class="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3 class="text-lg font-bold text-slate-900">{{ editingAddressId ? 'Edit Delivery Address' : 'Add Delivery Address' }}</h3>
              <p class="text-sm text-slate-500 mt-1">Fields marked * are required.</p>
            </div>
            <button type="button" class="text-sm font-semibold text-slate-500 hover:text-slate-800" @click="cancelAddressForm">Cancel</button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Address Label</span>
              <input v-model="addressForm.label" type="text" placeholder="Home, Work, Office" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            </label>

            <label>
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Recipient Name *</span>
              <input v-model="addressForm.full_name" type="text" autocomplete="name" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            </label>

            <label class="md:col-span-2">
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Street Address *</span>
              <input v-model="addressForm.address_line_1" type="text" autocomplete="address-line1" placeholder="Street number and street name" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            </label>

            <label class="md:col-span-2">
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Address Line 2</span>
              <input v-model="addressForm.address_line_2" type="text" autocomplete="address-line2" placeholder="Unit, suite, building (optional)" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            </label>

            <label>
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Suburb / Town *</span>
              <input v-model="addressForm.suburb" type="text" autocomplete="address-level2" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            </label>

            <label>
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">State / Territory *</span>
              <select v-model="addressForm.state" autocomplete="address-level1" class="w-full rounded-lg border border-slate-300 px-3 py-2.5">
                <option value="">Select state</option>
                <option v-for="state in australianStates" :key="state" :value="state">{{ state }}</option>
              </select>
            </label>

            <label>
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Postcode *</span>
              <input v-model="addressForm.postcode" type="text" inputmode="numeric" maxlength="4" autocomplete="postal-code" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            </label>

            <label>
              <span class="mb-1.5 block text-sm font-semibold text-slate-700">Phone</span>
              <input v-model="addressForm.phone" type="tel" autocomplete="tel" class="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
            </label>
          </div>

          <label class="mt-5 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <input v-model="addressForm.is_primary" type="checkbox" class="h-4 w-4" :disabled="editingPrimary" />
            <div>
              <span class="font-semibold text-slate-700">Make this my primary delivery address</span>
              <p v-if="editingPrimary" class="text-xs text-slate-500 mt-0.5">This is already your primary address. Choose “Make Primary” on another address to change it.</p>
            </div>
          </label>

          <div class="mt-5 flex justify-end gap-3">
            <button type="button" class="kc-btn-secondary !py-2.5 !px-4" @click="cancelAddressForm">Cancel</button>
            <button type="button" :disabled="savingAddress" class="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50" @click="saveAddress">
              {{ savingAddress ? 'Saving...' : editingAddressId ? 'Save Changes' : 'Save Address' }}
            </button>
          </div>
        </div>

        <div v-if="addresses.length === 0 && !showAddressForm" class="p-8 text-center">
          <h3 class="font-semibold text-slate-900">No delivery addresses saved</h3>
          <p class="mt-1 text-sm text-slate-500">Add an address to make future orders easier to manage.</p>
          <button type="button" class="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700" @click="openAddAddress">Add Delivery Address</button>
        </div>

        <div v-else-if="addresses.length" class="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <article
            v-for="address in addresses"
            :key="address.id"
            class="relative rounded-xl border p-5"
            :class="address.is_primary ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-bold text-slate-900">{{ address.label || 'Delivery Address' }}</h3>
                  <span v-if="address.is_primary" class="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">Primary</span>
                </div>
                <div class="mt-3 text-sm leading-6 text-slate-700">
                  <p class="font-semibold">{{ address.full_name }}</p>
                  <p>{{ address.address_line_1 }}</p>
                  <p v-if="address.address_line_2">{{ address.address_line_2 }}</p>
                  <p>{{ address.suburb }} {{ address.state }} {{ address.postcode }}</p>
                  <p>Australia</p>
                  <p v-if="address.phone" class="mt-1">{{ address.phone }}</p>
                </div>
              </div>
            </div>

            <div class="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <button v-if="!address.is_primary" type="button" :disabled="primaryAddressId === String(address.id)" class="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50" @click="makePrimary(address)">
                {{ primaryAddressId === String(address.id) ? 'Saving...' : 'Make Primary' }}
              </button>
              <button type="button" class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" @click="editAddress(address)">Edit</button>
              <button type="button" :disabled="deletingAddressId === String(address.id)" class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50" @click="deleteAddress(address)">
                {{ deletingAddressId === String(address.id) ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- ORDERS -->
      <section id="account-orders" v-show="activeAccountSection === 'account-orders'">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-900">My Orders</h2>
            <p class="text-slate-500">{{ orders.length }} {{ orders.length === 1 ? 'order' : 'orders' }}</p>
          </div>
        </div>

        <div v-if="orders.length === 0" class="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <h3 class="text-xl font-semibold mb-2">No orders yet</h3>
          <p class="text-slate-500 mb-6">You haven't placed any orders yet.</p>
          <NuxtLink to="/" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">Start Shopping</NuxtLink>
        </div>

        <div v-else class="space-y-4">
          <div v-for="order in orders" :key="order.id" class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <p class="text-sm text-slate-500">Order</p>
                <p class="font-bold text-lg">#{{ order.id }}</p>
                <p v-if="order.created_at" class="text-sm text-slate-500 mt-1">{{ formatDate(order.created_at) }}</p>
              </div>
              <div><span class="inline-block px-3 py-1 rounded-full text-sm font-semibold" :class="statusClass(order.status)">{{ order.status || 'Pending' }}</span></div>
              <div class="md:text-right"><p class="text-sm text-slate-500">Total</p><p class="text-xl font-bold">${{ Number(order.total || 0).toFixed(2) }}</p></div>
              <div v-if="order.tracking_number" class="text-sm"><p class="text-slate-500">Tracking</p><p class="font-semibold text-slate-800">{{ order.carrier || 'Carrier' }} · {{ order.tracking_number }}</p></div>
              <div>
                <NuxtLink :to="`/account/orders/${order.id}`" title="View Invoice" aria-label="View Invoice" class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 14.25h6M9 10.5h6M9 6.75h6M6.75 3.75h10.5A2.25 2.25 0 0 1 19.5 6v12a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 18V6a2.25 2.25 0 0 1 2.25-2.25Z" /></svg>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({ robots: "noindex, nofollow" });
definePageMeta({ middleware: "auth" });

const supabase = useSupabaseClient();

const accountSections = [
  { id: "account-overview", label: "Overview" },
  { id: "account-profile", label: "Profile" },
  { id: "account-security", label: "Security" },
  { id: "account-addresses", label: "Delivery Addresses" },
  { id: "account-orders", label: "My Orders" },
  { id: "account-wishlist", label: "Wishlist" },
  { id: "account-back-in-stock", label: "Back in Stock" },
  { id: "account-quotes", label: "Quotes" },
  { id: "account-information", label: "Account Information" },
];

const activeAccountSection = ref("account-overview");

const handleAccountSectionSelect = (event: Event) => {
  activeAccountSection.value = (event.target as HTMLSelectElement).value;
};

const user = ref<any>(null);
const orders = ref<any[]>([]);
const addresses = ref<any[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const addressError = ref("");
const successMessage = ref("");
const pricingLevelName = ref("Standard");
const dashboardStats = reactive({ orders: 0, totalSpent: 0, openOrders: 0, wishlist: 0, quotes: 0 });
const customerProfile = reactive<any>({
  display_name: "", business_name: "", phone: "", preferred_contact: "email",
  order_updates: true, back_in_stock_updates: true, marketing_updates: false,
});
const profileForm = reactive<any>({ ...customerProfile });
const showProfileForm = ref(false);
const savingProfile = ref(false);
const wishlistPreview = ref<any[]>([]);
const quoteRequests = ref<any[]>([]);
const payingQuoteId = ref<number | null>(null);
const backInStockNotifications = ref<any[]>([]);
const cancellingBackInStockId = ref<number | null>(null);

const showPasswordForm = ref(false);
const newPassword = ref("");
const confirmNewPassword = ref("");
const changingPassword = ref(false);
const passwordError = ref("");
const passwordSuccess = ref("");

const showAddressForm = ref(false);
const editingAddressId = ref<string | null>(null);
const editingPrimary = ref(false);
const savingAddress = ref(false);
const deletingAddressId = ref<string | null>(null);
const primaryAddressId = ref<string | null>(null);

const australianStates = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

async function accountFetch<T = any>(url: string, options: any = {}) {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("You must be signed in.");
  }

  return await $fetch<T>(url, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Authorization: `Bearer ${session.access_token}`,
    },
  });
}

const emptyAddressForm = () => ({
  label: "",
  full_name: "",
  address_line_1: "",
  address_line_2: "",
  suburb: "",
  state: "VIC",
  postcode: "",
  phone: "",
  is_primary: false,
});

const addressForm = reactive(emptyAddressForm());

function resetAddressForm() {
  Object.assign(addressForm, emptyAddressForm());
  editingAddressId.value = null;
  editingPrimary.value = false;
}

function openAddAddress() {
  addressError.value = "";
  successMessage.value = "";
  resetAddressForm();
  addressForm.is_primary = addresses.value.length === 0;
  showAddressForm.value = true;
}

function cancelAddressForm() {
  resetAddressForm();
  showAddressForm.value = false;
}

function editAddress(address: any) {
  addressError.value = "";
  successMessage.value = "";
  editingAddressId.value = String(address.id);
  editingPrimary.value = Boolean(address.is_primary);
  Object.assign(addressForm, {
    label: address.label || "",
    full_name: address.full_name || "",
    address_line_1: address.address_line_1 || "",
    address_line_2: address.address_line_2 || "",
    suburb: address.suburb || "",
    state: address.state || "VIC",
    postcode: address.postcode || "",
    phone: address.phone || "",
    is_primary: Boolean(address.is_primary),
  });
  showAddressForm.value = true;
  nextTick(() => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function validateAddress() {
  if (!addressForm.full_name.trim() || !addressForm.address_line_1.trim() || !addressForm.suburb.trim()) return "Name, street address and suburb are required.";
  if (!australianStates.includes(addressForm.state)) return "Please select a valid Australian state or territory.";
  if (!/^\d{4}$/.test(addressForm.postcode.trim())) return "Postcode must contain exactly 4 numbers.";
  return "";
}

async function loadAddresses() {
  addresses.value = await accountFetch<any[]>("/api/account/addresses");
}

async function saveAddress() {
  addressError.value = "";
  successMessage.value = "";
  const validation = validateAddress();
  if (validation) { addressError.value = validation; return; }

  savingAddress.value = true;
  try {
    const body = { ...addressForm, postcode: addressForm.postcode.trim(), state: addressForm.state.toUpperCase() };
    if (editingAddressId.value) {
      await accountFetch(`/api/account/addresses/${editingAddressId.value}`, { method: "PUT", body });
      successMessage.value = "Delivery address updated.";
    } else {
      await accountFetch("/api/account/addresses", { method: "POST", body });
      successMessage.value = "Delivery address added.";
    }
    await loadAddresses();
    cancelAddressForm();
  } catch (error: any) {
    addressError.value = error?.data?.statusMessage || error?.message || "Unable to save delivery address.";
  } finally {
    savingAddress.value = false;
  }
}

async function makePrimary(address: any) {
  addressError.value = "";
  successMessage.value = "";
  primaryAddressId.value = String(address.id);
  try {
    await accountFetch(`/api/account/addresses/${address.id}/primary`, { method: "PUT" });
    await loadAddresses();
    successMessage.value = `${address.label || "Delivery address"} is now your primary address.`;
  } catch (error: any) {
    addressError.value = error?.data?.statusMessage || error?.message || "Unable to change the primary address.";
  } finally {
    primaryAddressId.value = null;
  }
}

async function deleteAddress(address: any) {
  if (!window.confirm(`Delete ${address.label || "this delivery address"}?`)) return;
  addressError.value = "";
  successMessage.value = "";
  deletingAddressId.value = String(address.id);
  try {
    await accountFetch(`/api/account/addresses/${address.id}`, { method: "DELETE" });
    await loadAddresses();
    successMessage.value = "Delivery address deleted.";
    if (editingAddressId.value === String(address.id)) cancelAddressForm();
  } catch (error: any) {
    addressError.value = error?.data?.statusMessage || error?.message || "Unable to delete delivery address.";
  } finally {
    deletingAddressId.value = null;
  }
}

const currency = (value: unknown) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(value || 0));

const quoteExpired = (quote: any) => Boolean(quote?.status === "quoted" && quote?.expires_at && new Date(quote.expires_at).getTime() < Date.now());

async function payQuote(quote: any) {
  errorMessage.value = "";
  successMessage.value = "";
  payingQuoteId.value = Number(quote.id);
  try {
    const result = await accountFetch<{ url?: string }>(`/api/account/quotes/${quote.id}/checkout`, { method: "POST" });
    if (!result?.url) throw new Error("Stripe Checkout did not return a payment link.");
    window.location.href = result.url;
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to open payment for this quote.";
    if (errorMessage.value.includes("delivery address")) {
      nextTick(() => document.getElementById("delivery-addresses")?.scrollIntoView({ behavior: "smooth" }));
    }
  } finally {
    payingQuoteId.value = null;
  }
}

async function cancelBackInStock(notice: any) {
  cancellingBackInStockId.value = Number(notice.id);
  successMessage.value = "";
  errorMessage.value = "";
  try {
    await accountFetch(`/api/account/back-in-stock/${notice.id}`, { method: "DELETE" });
    backInStockNotifications.value = backInStockNotifications.value.map((item) => Number(item.id) === Number(notice.id) ? { ...item, status: "cancelled" } : item);
    successMessage.value = "Back-in-stock notification cancelled.";
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to cancel notification.";
  } finally {
    cancellingBackInStockId.value = null;
  }
}

function togglePasswordForm() {
  showPasswordForm.value = !showPasswordForm.value;
  passwordError.value = "";
  passwordSuccess.value = "";
  newPassword.value = "";
  confirmNewPassword.value = "";
}

async function changePassword() {
  passwordError.value = "";
  passwordSuccess.value = "";

  if (newPassword.value.length < 8) {
    passwordError.value = "Your password must be at least 8 characters long.";
    return;
  }

  if (newPassword.value !== confirmNewPassword.value) {
    passwordError.value = "The passwords do not match.";
    return;
  }

  changingPassword.value = true;

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error("Your sign-in session has expired. Please sign in again.");
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword.value,
    });

    if (error) {
      throw error;
    }

    newPassword.value = "";
    confirmNewPassword.value = "";
    showPasswordForm.value = false;
    passwordSuccess.value = "Your password has been updated successfully.";
  } catch (error: any) {
    passwordError.value =
      error?.message ||
      "Unable to update your password. Please try again.";
  } finally {
    changingPassword.value = false;
  }
}

async function saveProfile() {
  savingProfile.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    const saved = await accountFetch<any>("/api/account/profile", { method: "PUT", body: profileForm });
    Object.assign(customerProfile, saved);
    Object.assign(profileForm, saved);
    successMessage.value = "Customer profile updated.";
    showProfileForm.value = false;
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to save your profile.";
  } finally {
    savingProfile.value = false;
  }
}

async function loadAccount() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!currentUser) {
      await navigateTo({ path: "/auth/signin", query: { redirect: "/account" } });
      return;
    }
    user.value = currentUser;

    const [addressResult, orderResult, pricingResult, profileResult, dashboardResult, wishlistResult, quotesResult, backInStockResult] = await Promise.all([
      accountFetch<any[]>("/api/account/addresses"),
      supabase.from("orders").select(`id,user_id,stripe_session_id,customer_email,customer_name,total,status,tracking_number,carrier,tracking_status,shipped_at,delivered_at,created_at`).eq("user_id", currentUser.id).order("created_at", { ascending: false }),
      accountFetch<any>("/api/account/pricing"),
      accountFetch<any>("/api/account/profile"),
      accountFetch<any>("/api/account/dashboard"),
      accountFetch<any>("/api/account/wishlist"),
      accountFetch<any[]>("/api/account/quotes"),
      accountFetch<any[]>("/api/account/back-in-stock"),
    ]);

    addresses.value = addressResult || [];
    pricingLevelName.value = pricingResult?.pricingLevel?.name || "Standard";
    Object.assign(customerProfile, profileResult || {});
    Object.assign(profileForm, customerProfile);
    Object.assign(dashboardStats, dashboardResult?.stats || {});
    wishlistPreview.value = (wishlistResult?.products || []).slice(0, 3);
    quoteRequests.value = quotesResult || [];
    backInStockNotifications.value = backInStockResult || [];
    if (orderResult.error) throw orderResult.error;
    orders.value = orderResult.data || [];
  } catch (error: any) {
    console.error("ACCOUNT ERROR:", error);
    errorMessage.value = error?.data?.statusMessage || error?.message || "Unable to load your account.";
  } finally {
    loading.value = false;
  }
}

function formatDate(date: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

function statusClass(status: string) {
  switch (String(status).toLowerCase()) {
    case "paid": return "bg-green-100 text-green-700";
    case "processing": return "bg-blue-100 text-blue-700";
    case "shipped": return "bg-purple-100 text-purple-700";
    case "completed": return "bg-green-100 text-green-700";
    case "cancelled": return "bg-red-100 text-red-700";
    case "refunded": return "bg-orange-100 text-orange-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

onMounted(loadAccount);
</script>
