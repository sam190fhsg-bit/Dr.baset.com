(async()=>{
  if(typeof supabaseClient==='undefined') return;
  const norm=s=>String(s||'').split('#')[0].split('?')[0].split('/').pop()||'index.html';
  const current=norm(location.pathname);
  try{
    const {data,error}=await supabaseClient.from('page_visibility').select('page_path,title_ar,is_visible,show_in_navigation');
    if(error||!data) return;
    const map=new Map(data.map(x=>[norm(x.page_path),x]));
    const row=map.get(current);
    if(row&&row.is_visible===false && !/^admin/i.test(current)){
      document.documentElement.style.background='#f7faf8';
      document.body.innerHTML=`<main dir="rtl" style="max-width:760px;margin:12vh auto;padding:32px;font-family:Tahoma,Arial;text-align:center"><div style="background:#fff;border:1px solid #e3ebe5;border-radius:18px;padding:38px"><h1 style="color:#15506b">هذه الصفحة غير متاحة حاليًا</h1><p>تم إخفاء الصفحة مؤقتًا من لوحة إدارة العيادة.</p><a href="index.html" style="display:inline-block;background:#4c963d;color:#fff;text-decoration:none;padding:11px 22px;border-radius:9px">العودة للرئيسية</a></div></main>`;
      return;
    }
    document.querySelectorAll('a[href]').forEach(a=>{
      const p=norm(a.getAttribute('href'));
      const r=map.get(p);
      if(r&&(r.is_visible===false||r.show_in_navigation===false)) a.style.display='none';
    });
  }catch(e){console.warn('page visibility',e)}
})();
