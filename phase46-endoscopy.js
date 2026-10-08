/* PHASE46 enhancement for existing endoscopy editor. */
(function(){
'use strict';
const app=document.getElementById('app'),list=document.getElementById('list'),editor=document.querySelector('.form');
if(!app||!list||!editor)return;
const toolbar=document.createElement('section');toolbar.className='p46-tools';
toolbar.innerHTML='<h3>التحكم الجماعي بخدمات المناظير</h3><div class="p46-toolrow"><input id="p46-endo-search" type="search" placeholder="بحث في أسماء الخدمات ومحتواها"><select id="p46-endo-filter"><option value="all">الكل</option><option value="published">الظاهر</option><option value="hidden">المخفي</option></select><span id="p46-endo-count"></span></div><div class="p46-toolrow"><label class="p46-select-label"><input type="checkbox" id="p46-endo-all"> تحديد المعروض</label><button type="button" id="p46-endo-show">إظهار المحدد</button><button type="button" id="p46-endo-hide">إخفاء المحدد</button><button type="button" id="p46-endo-csv">تصدير CSV</button><button type="button" id="p46-endo-json">نسخة JSON</button></div><p class="p46-note">التغييرات تحفظ في Supabase فقط بعد التأكيد. ملفات CSV/JSON تشمل الخدمات المحملة حاليًا وليست نسخة كاملة من قاعدة البيانات.</p><p id="p46-endo-status" class="p46-notice" role="status"></p>';
app.insertBefore(toolbar,app.firstChild);
const $=id=>document.getElementById(id);
const selected=new Set();
const message=(text,error=false)=>{const el=$('p46-endo-status');el.textContent=text;el.classList.toggle('error',!!error)};
function renderExtras(){
 const items=[...list.querySelectorAll('.row')];
 items.forEach((el,i)=>{
  const model=rows[i]; if(!model)return;
  el.dataset.p46Id=String(model.id);
  if(!el.querySelector('.p46-selection')){
   const label=document.createElement('label');label.className='p46-select-label';
   const select=document.createElement('input');select.type='checkbox';select.className='p46-selection';select.checked=selected.has(String(model.id));
   select.addEventListener('change',()=>{select.checked?selected.add(String(model.id)):selected.delete(String(model.id));sync();});
   label.append(select,document.createTextNode('تحديد'));el.prepend(label);
  }
 });filter();
}
function shown(){return [...list.querySelectorAll('.row[data-p46-id]')].filter(x=>!x.hidden)}
function sync(){const id=shown().map(el=>el.dataset.p46Id);$('p46-endo-all').checked=!!id.length&&id.every(v=>selected.has(v));$('p46-endo-all').indeterminate=id.some(v=>selected.has(v))&&!id.every(v=>selected.has(v));}
function filter(){const q=$('p46-endo-search').value.trim().toLowerCase(),f=$('p46-endo-filter').value;[...list.querySelectorAll('.row[data-p46-id]')].forEach(el=>{const x=rows.find(r=>String(r.id)===el.dataset.p46Id);el.hidden=!!x&&((f==='published'&&x.is_published!==true)||(f==='hidden'&&x.is_published!==false)||!!q&&!String(x.title_ar+' '+(x.short_description_ar||'')+' '+(x.body_ar||'')).toLowerCase().includes(q));});$('p46-endo-count').textContent=`${shown().length} من ${rows.length} خدمة`;sync();}
async function verify(){if(!supabaseClient)return false;const s=await supabaseClient.auth.getSession();if(!s.data?.session)return false;const r=await supabaseClient.rpc('is_content_editor');return !r.error&&r.data===true;}
async function batch(published){const ids=[...selected].filter(id=>rows.some(x=>String(x.id)===id));if(!ids.length){message('حدد خدمة أولًا.',true);return}if(!confirm(`هل تؤكد ${published?'إظهار':'إخفاء'} ${ids.length} خدمة؟`))return;const a=$('p46-endo-show'),b=$('p46-endo-hide');a.disabled=b.disabled=true;try{if(!await verify())throw Error('ليس لديك جلسة إدارة صالحة أو صلاحية المحتوى');const r=await supabaseClient.from('services').update({is_published:published}).in('id',ids).select('id');if(r.error)throw r.error;const done=new Set((r.data||[]).map(x=>String(x.id)));done.forEach(x=>selected.delete(x));message(`تم تحديث ${done.size} من ${ids.length} خدمة.`,done.size!==ids.length);await load();}catch(e){message('تعذر التعديل: '+(e.message||e),true)}finally{a.disabled=b.disabled=false}}
const csv=s=>'"'+String(s??'').replace(/^[\s]*[=+@-]/,v=>"'"+v).replace(/"/g,'""')+'"';
function exportFile(kind){const entries=rows.filter(x=>shown().some(el=>el.dataset.p46Id===String(x.id)));if(!entries.length){message('لا توجد خدمات معروضة للتصدير.',true);return}const file='clinic-endoscopy-'+new Date().toISOString().slice(0,10);let raw,ext,mime;if(kind==='json'){raw=JSON.stringify({table:'services',category:'endoscopy',rows:entries,at:new Date().toISOString()},null,2);ext='json';mime='application/json'}else{const keys=[...new Set(entries.flatMap(x=>Object.keys(x)))];raw='\ufeff'+keys.map(csv).join(',')+'\r\n'+entries.map(x=>keys.map(k=>csv(typeof x[k]==='object'&&x[k]!==null?JSON.stringify(x[k]):x[k])).join(',')).join('\r\n');ext='csv';mime='text/csv'}const url=URL.createObjectURL(new Blob([raw],{type:mime+';charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=file+'.'+ext;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);message(`تم تجهيز ${entries.length} خدمة للتنزيل.`)}
const oldLoad=load;
load=async function(){const result=await oldLoad.apply(this,arguments);renderExtras();return result};
$('p46-endo-search').oninput=filter;$('p46-endo-filter').onchange=filter;
$('p46-endo-all').onchange=e=>{shown().forEach(el=>{const cb=el.querySelector('.p46-selection');if(!cb)return;cb.checked=e.target.checked;cb.checked?selected.add(el.dataset.p46Id):selected.delete(el.dataset.p46Id)});sync()};
$('p46-endo-show').onclick=()=>batch(true);$('p46-endo-hide').onclick=()=>batch(false);$('p46-endo-csv').onclick=()=>exportFile('csv');$('p46-endo-json').onclick=()=>exportFile('json');
})();
