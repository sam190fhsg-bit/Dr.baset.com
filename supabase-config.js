// =====================================
// Supabase Configuration
// موقع عيادة الدكتور عبده الباسط عبده الحاج مقبل
// =====================================

const SUPABASE_URL = "https://uwrspcwmsxwbpynjjctx.supabase.co";

const SUPABASE_KEY = "sb_publishable_-j-5QzUvd5w3qkgXLsMOUw_0_TzCKOa";

const supabaseClient = (window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

if (!supabaseClient) {
  console.warn('تعذر تحميل مكتبة Supabase من مصادرها.');
  const notify = () => {
    if (!document.body || document.getElementById('clinic-connection-notice')) return;
    const box = document.createElement('div');
    box.id = 'clinic-connection-notice';
    box.setAttribute('role', 'status');
    box.dir = 'rtl';
    box.style.cssText = 'position:relative;z-index:100000;background:#fff7e8;border:1px solid #efdaa7;padding:13px 16px;margin:8px auto;max-width:1100px;border-radius:9px;color:#65480d;text-align:center;font:14px/1.8 Tahoma,Arial,sans-serif';
    box.textContent = 'تعذّر الاتصال بخدمة بيانات العيادة. قد تكون الشبكة أو البروكسي يمنع تحميل المكتبة. جرّب تحديث الصفحة أو شبكة أخرى.';
    document.body.prepend(box);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', notify, { once: true });
  else notify();
}
