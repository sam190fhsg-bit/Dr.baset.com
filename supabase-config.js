// =====================================
// Supabase Configuration
// موقع عيادة الدكتور عبده الباسط عبده الحاج مقبل
// =====================================

const SUPABASE_URL = "https://uwrspcwmsxwbpynjjctx.supabase.co";

const SUPABASE_KEY = "sb_publishable_-j-5QzUvd5w3qkgXLsMOUw_0_TzCKOa";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

console.log("Supabase connected successfully");
