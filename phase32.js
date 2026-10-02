(()=>{'use strict';
const marker=['الأقسام','روابط','منصات التواصل'];
function clean(){
 document.querySelectorAll('footer:not(.phase30-footer),.site-footer:not(.phase30-footer),#site-footer,.footer-main,.global-footer').forEach(e=>e.remove());
 // Find the obsolete white footer by its unique headings, without touching ordinary page sections.
 document.querySelectorAll('h2,h3,h4,strong').forEach(el=>{
  if(el.closest('.phase30-footer,header,main,article,.admin-dashboard'))return;
  if(!marker.includes(el.textContent.trim()))return;
  let candidate=el.parentElement;
  for(let i=0;i<5&&candidate&&candidate!==document.body;i++,candidate=candidate.parentElement){
   const t=candidate.innerText||'';
   if(marker.every(x=>t.includes(x)) && t.includes('عيادة الدكتور') && t.length<2400){candidate.remove();break;}
  }
 });
 document.querySelectorAll('.phase30-wa').forEach(a=>{a.href='https://wa.me/967777554626?text='+encodeURIComponent('مرحبًا، أود حجز موعد في عيادة الدكتور عبدالباسط.');});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean);else clean();
window.addEventListener('load',clean);
const ob=new MutationObserver(()=>{if(document.readyState!=='loading')clean()});
ob.observe(document.documentElement,{childList:true,subtree:true});
})();