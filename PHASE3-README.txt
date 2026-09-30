المرحلة الثالثة: مكتبة الوسائط
1) ارفع ملفات هذه الحزمة إلى GitHub واستبدل الملفات الحالية.
2) شغّل PHASE3-MEDIA-LIBRARY.sql مرة واحدة في Supabase SQL Editor.
3) تأكد أن لديك مستخدمًا في Supabase Auth وأن له صفًا مطابقًا في public.profiles.
4) عيّن role للمستخدم إلى super_admin أو admin أو editor. مثال موجود كتعليق داخل ملف SQL.
5) افتح admin.html وسجّل الدخول، ثم افتح مكتبة الوسائط.
مهم: لا تستخدم service_role في المتصفح. الملف supabase-config.js يستخدم publishable key فقط.
