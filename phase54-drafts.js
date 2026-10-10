/* PHASE54: non-patient editorial drafts, session-only, no personal data */
(()=>{'use strict';
 const editor=document.getElementById('editor');if(!editor||typeof window.sessionStorage==='undefined')return;
 const allowed={"admin-data.html":['diseases','articles','services'],"admin-content.html":['sliders','events','videos','hours','social']};
 const page=location.pathname.split('/').pop();if(!allowed[page])return;
 let dirty=false,timer,activeKey='',initial='',restoredKeys=new Set();
 const fields=()=>[...editor.querySelectorAll('[data-k]')];
 const serialize=()=>{const o={};fields().forEach(el=>{o[el.dataset.k]=el.type==='checkbox'?el.checked:el.value});return JSON.stringify(o)};
 const key=()=>{const tab=location.hash.slice(1)||(document.querySelector('#tabs button.active')?.dataset.tab)||'sliders';if(!allowed[page].includes(tab))return '';const title=editor.querySelector('h2')?.textContent||'';const idMatch=title.includes('تعديل')?'edit':'new';const record=idMatch==='edit'?(fields().find(f=>f.dataset.k==='slug')?.value||fields().find(f=>f.dataset.k==='title_ar')?.value||'current'):'new';return `p54:${page}:${tab}:${idMatch}:${record}`};
 const note=()=>{let n=editor.querySelector('#phase54DraftStatus');if(!n){n=document.createElement('div');n.id='phase54DraftStatus';n.style.cssText='margin:10px 0;padding:10px;border:1px solid #c7dfd4;border-radius:9px;background:#f4faf6;color:#295942;font-size:13px';const form=editor.querySelector('.form');(form||editor).before(n)}return n};
 const snapshot=()=>{if(!fields().length){dirty=false;return}activeKey=key();if(!activeKey){dirty=false;return}initial=serialize();dirty=false;const n=note();n.replaceChildren(document.createTextNode('المسودة محفوظة مؤقتًا على هذا الجهاز أثناء الجلسة فقط. لا تُنشر قبل الضغط على حفظ.'));
 const draft=sessionStorage.getItem(activeKey);if(draft&&draft!==initial&&!restoredKeys.has(activeKey)){restoredKeys.add(activeKey);const restore=document.createElement('button');restore.type='button';restore.textContent='استعادة المسودة';restore.className='btn secondary';restore.style.marginInline='8px';restore.onclick=()=>{try{const obj=JSON.parse(draft);fields().forEach(f=>{if(Object.hasOwn(obj,f.dataset.k)){if(f.type==='checkbox')f.checked=!!obj[f.dataset.k];else f.value=obj[f.dataset.k]??'';f.dispatchEvent(new Event('change',{bubbles:true}))}});dirty=true;n.textContent='تمت استعادة المسودة. اضغط حفظ لاعتمادها في الموقع.'}catch{n.textContent='تعذر استعادة المسودة.'}};n.append(restore)}
 };
 editor.addEventListener('input',e=>{if(!e.target.closest('[data-k]')||!activeKey)return;dirty=true;clearTimeout(timer);timer=setTimeout(()=>{try{sessionStorage.setItem(activeKey,serialize());note().firstChild.textContent='تم حفظ مسودة محلية مؤقتة. اضغط حفظ لنشر تعديلاتك.'}catch{}},650)});
 editor.addEventListener('change',e=>{if(!e.target.closest('[data-k]'))return;dirty=true;clearTimeout(timer);timer=setTimeout(()=>{try{sessionStorage.setItem(activeKey,serialize())}catch{}},350)});
 // Only clear drafts after a confirmed success message from the existing save flow.
 const observer=new MutationObserver(()=>{const n=document.getElementById('msg');if(n?.classList.contains('success')&&activeKey){sessionStorage.removeItem(activeKey);dirty=false}});
 observer.observe(editor,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
 let lastForm=null;new MutationObserver(()=>{const form=editor.querySelector('.form');if(form&&form!==lastForm){lastForm=form;setTimeout(snapshot,0)}}).observe(editor,{childList:true,subtree:true});
 window.addEventListener('beforeunload',e=>{if(dirty&&serialize()!==initial){e.preventDefault();e.returnValue=''}});
 setTimeout(snapshot,0);
})();
