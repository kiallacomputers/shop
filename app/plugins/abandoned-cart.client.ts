export default defineNuxtPlugin(()=>{
 const cart=useCartStore(); const user=useSupabaseUser(); const supabase=useSupabaseClient(); let timer:any=null;
 const sync=()=>{clearTimeout(timer);timer=setTimeout(async()=>{if(!user.value?.id)return;try{const {data:{session}}=await supabase.auth.getSession();if(!session?.access_token)return;await $fetch('/api/cart/track',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`},body:{items:cart.items}})}catch(e){console.warn('Cart recovery tracking unavailable',e)}},1200)};
 watch(()=>cart.items, sync,{deep:true}); watch(()=>user.value?.id,()=>{if(user.value?.id)sync()}); onNuxtReady(sync);
});
