// PHASE50: canonical cover-image URLs; never treat storage paths as GitHub Pages URLs.
window.phase50EventImageUrl=function(value){
 const raw=String(value||'').trim(); if(!raw)return '';
 if(/^https?:\/\//i.test(raw))return raw;
 if(/^\/\//.test(raw))return 'https:'+raw;
 const base=typeof SUPABASE_URL!=='undefined'?SUPABASE_URL:'';
 let path=raw.replace(/^\/+/, '').replace(/^storage\/v1\/object\/public\/site-media\//i,'').replace(/^object\/public\/site-media\//i,'').replace(/^site-media\//i,'');
 if(!base||!path||/^(?:javascript|data):/i.test(path))return '';
 const encoded=path.split('/').map(encodeURIComponent).join('/');
 return base.replace(/\/$/,'')+'/storage/v1/object/public/site-media/'+encoded;
};
window.phase50EventImageFailed=function(img){
 const frame=img.closest('.phase48-event-media,.cover,.row-main');
 if(frame){ const p=document.createElement('span');p.className='phase48-event-placeholder';p.textContent='الصورة غير متاحة';p.style.cssText='display:grid;place-items:center;height:100%;font-size:14px;color:#386078';img.replaceWith(p); }
};
