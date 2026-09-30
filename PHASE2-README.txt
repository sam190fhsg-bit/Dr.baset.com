تحديث المرحلة الثانية قبل إضافة الصور
====================================
1) ارفع جميع ملفات هذا المجلد إلى جذر مستودع GitHub واستبدل الملفات الحالية.
2) لا تحذف doctor.jpg أو logo.jpg ولم يتم تعديلهما في هذه الحزمة.
3) شغّل PHASE2-COMPLETE.sql مرة واحدة فقط في Supabase SQL Editor لإنشاء/استكمال جداول: media, sliders, working_hours, social_links, events.
4) لوحة الإدارة: admin.html. تعتمد على Supabase Auth ولا تحتوي أي Service Role Key.
5) مكتبة الوسائط: media-library.html. قبل السماح بالرفع في الإنتاج، اربط سياسات INSERT/UPDATE/DELETE بأدوار profiles الموجودة لديك. ملف SQL يفعّل RLS ويترك الكتابة مقفلة افتراضيًا للأمان.
6) تمت إضافة PWA service worker للملفات العامة فقط؛ صفحات الحجز والتوظيف والاستبيان والإدارة وطلبات Supabase لا تُخزن Offline.
7) تم تحسين حالات الخطأ/إعادة المحاولة في صفحات التخصص، وإزالة عبارات التطوير المؤقتة من صفحة الطبيب والمعرض.
8) تم إضافة Why Choose / Patient Journey، تحسين الجوال، SEO defaults وSchema، accessibility، lazy loading، وروابط التواصل.
9) الصور هي المرحلة التالية: ارفعها بعد ضبط سياسات Media Library، ثم اربطها بالحالات والخدمات والمقالات والسلايدر.
