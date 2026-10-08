/* PHASE46 — optional, non-destructive management tools for existing admin pages.
 * All writes are performed via the existing authenticated Supabase client/RLS.
 * Bookings are never exported or saved to browser drafts.
 */
(function () {
  'use strict';
  const mode = document.body.dataset.phase46;
  if (!['data', 'content'].includes(mode)) return;
  const app = document.getElementById('app');
  const editor = document.getElementById('editor');
  const list = document.getElementById('list');
  if (!app || !editor || !list) return;
  const $p = id => document.getElementById(id);
  const status = document.createElement('div');
  status.className = 'p46-tools';
  status.innerHTML = '<h3>أدوات الإدارة المتقدمة</h3><div class="p46-toolrow"><span id="p46-count" aria-live="polite"></span><label for="p46-publication">الحالة</label><select id="p46-publication"><option value="all">الكل</option><option value="published">الظاهر</option><option value="hidden">المخفي</option></select><input type="search" id="p46-search" placeholder="تصفية العناصر الظاهرة" aria-label="البحث داخل قائمة السجلات"><select id="p46-booking-status" hidden aria-label="حالة الحجز"><option value="all">جميع الحجوزات</option><option value="NEW">جديد</option><option value="CONTACTED">تم التواصل</option><option value="CONFIRMED">مؤكد</option><option value="COMPLETED">مكتمل</option><option value="CANCELLED">ملغي</option></select></div><div class="p46-toolrow"><label class="p46-select-label"><input id="p46-all" type="checkbox"> تحديد العناصر المعروضة</label><button type="button" id="p46-show">إظهار المحدد</button><button type="button" id="p46-hide">إخفاء المحدد</button><button type="button" id="p46-refresh">تحديث البيانات</button><button type="button" id="p46-more" hidden>تحميل 300 سجل إضافي</button></div><div class="p46-toolrow"><button type="button" id="p46-csv">تصدير CSV</button><button type="button" id="p46-json">نسخة JSON من العناصر المحمّلة</button></div><p class="p46-note">التحديد الجماعي للتغيير في الظهور فقط، مع طلب تأكيد. النسخ الاحتياطية هنا تصدير محلي للعناصر المحمّلة، وليست نسخة كاملة من قاعدة البيانات. لا يتم تصدير بيانات المرضى.</p><div class="p46-notice" id="p46-notice" role="status" aria-live="polite"></div>';
  const tabs = $p('tabs');
  if (tabs && tabs.parentNode) tabs.parentNode.insertBefore(status, tabs.nextSibling);
  else app.insertBefore(status, app.firstChild);
  let selected = new Set();
  let editingId = 'new';
  let draftKey = '';
  let dirty = false;
  let draftTimer = null;
  let isSaving = false;
  let lastTab = '';
  const safeStore = {
    get: k => { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (_) {} },
    del: k => { try { sessionStorage.removeItem(k); } catch (_) {} }
  };
  const type = () => (typeof tab !== 'undefined' ? tab : '');
  const records = () => (typeof rows !== 'undefined' && Array.isArray(rows) ? rows : []);
  const table = () => mode === 'content' ? (defs[type()]?.table || type()) : type();
  const supportsPublish = () => !['bookings', 'hours'].includes(type());
  const allowExport = () => type() !== 'bookings';
  const notice = (message, error = false) => {
    const el = $p('p46-notice');
    el.textContent = message;
    el.classList.toggle('error', !!error);
  };
  const resetSelection = () => { selected.clear(); $p('p46-all').checked = false; };
  const controlVisibility = () => {
    const noBatch = !supportsPublish() || !$p('gate')?.hidden;
    $p('p46-show').disabled = $p('p46-hide').disabled = $p('p46-all').disabled = noBatch;
    $p('p46-publication').disabled = noBatch;
    $p('p46-csv').disabled = $p('p46-json').disabled = !allowExport() || !$p('gate')?.hidden;
  };
  const visibleRows = () => [...list.querySelectorAll('.row[data-p46-id]')].filter(el => !el.hidden);
  function decorate() {
    const current = type();
    if (lastTab !== current) {
      lastTab = current;
      resetSelection();
      $p('p46-publication').value = 'all';
      $p('p46-search').value = '';
      $p('p46-booking-status').value = 'all';
    }
    controlVisibility();
    $p('p46-more').hidden = mode !== 'data' || records().length < 300 || !($p('gate')?.hidden);
    $p('p46-booking-status').hidden = current !== 'bookings';
    const active = records();
    const rowNodes = [...list.querySelectorAll('.row')];
    rowNodes.forEach((element, i) => {
      // Both legacy templates encode the ID in the edit button; avoid relying on row order when filtering.
      const action = element.querySelector('button[onclick*="editRow("],button[onclick*="edit("]');
      const match = action?.getAttribute('onclick')?.match(/\('([^']+)'\)/);
      const row = match ? active.find(x => String(x.id) === match[1]) : (mode === 'content' ? active[i] : null);
      if (!row?.id) return;
      element.dataset.p46Id = String(row.id);
      element.dataset.p46Published = row.is_published === true ? 'yes' : row.is_published === false ? 'no' : 'unknown';
      if (supportsPublish() && !element.querySelector('.p46-selection')) {
        const label = document.createElement('label');
        label.className = 'p46-select-label';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'p46-selection';
        cb.setAttribute('aria-label', 'تحديد عنصر لإجراء جماعي');
        cb.checked = selected.has(String(row.id));
        cb.addEventListener('change', () => {
          if (cb.checked) selected.add(String(row.id));
          else selected.delete(String(row.id));
          syncSelectAll();
        });
        label.appendChild(cb);
        label.appendChild(document.createTextNode('تحديد'));
        element.insertBefore(label, element.firstChild);
      }
      if (mode === 'data' && current === 'bookings' && !element.querySelector('[data-p46-followup]')) {
        const raw = String(row.phone || row.phone_number || '').replace(/[^0-9+]/g, '');
        const phone = raw.startsWith('00') ? raw.slice(2) : raw.startsWith('+') ? raw.slice(1) : raw.startsWith('967') ? raw : raw.startsWith('0') ? '967' + raw.slice(1) : raw.length === 9 ? '967' + raw : '';
        if (/^967[0-9]{9}$/.test(phone)) {
          const actions = element.querySelector('.actions');
          if(actions) {
            const link = document.createElement('a');
            link.className = 'btn secondary';
            link.dataset.p46Followup = 'true';
            link.target = '_blank'; link.rel = 'noopener noreferrer';
            link.href = 'https://wa.me/' + phone;
            link.textContent = 'تواصل واتساب';
            link.setAttribute('aria-label','فتح محادثة واتساب مع صاحب الحجز');
            actions.appendChild(link);
          }
        }
      }
      if (mode === 'content' && supportsPublish() && current !== 'events' && !element.querySelector('[data-p46-toggle]')) {
        const container = element.querySelector('.actions');
        if (container) {
          const toggle = document.createElement('button');
          toggle.type = 'button';
          toggle.className = 'btn secondary';
          toggle.dataset.p46Toggle = 'true';
          toggle.textContent = row.is_published ? 'إخفاء' : 'إظهار';
          toggle.addEventListener('click', async () => {
            const target = !row.is_published;
            try {
              if (!(await verifyEditor())) return;
              toggle.disabled = true;
              const result = await supabaseClient.from(table()).update({is_published: target}).eq('id',row.id).select('id');
              if (result.error || !result.data?.length) throw result.error || Error('لم يؤكد الخادم حفظ التعديل');
              notice(target ? 'تم إظهار السجل.' : 'تم إخفاء السجل.');
              await load();
            } catch (e) { notice('تعذر تغيير الظهور: ' + (e.message || e), true); }
            finally { toggle.disabled = false; }
          });
          container.prepend(toggle);
        }
      }
    });
    applyFilters();
  }
  function applyFilters() {
    const state = $p('p46-publication').value;
    const query = $p('p46-search').value.trim().toLowerCase();
    const all = [...list.querySelectorAll('.row[data-p46-id]')];
    all.forEach(el => {
      const item = records().find(x => String(x.id) === el.dataset.p46Id);
      const pub = item?.is_published;
      const bookingStatus = $p('p46-booking-status').value;
      el.hidden = (state === 'published' && pub !== true) || (state === 'hidden' && pub !== false) || (!!query && !el.textContent.toLowerCase().includes(query)) || (type() === 'bookings' && bookingStatus !== 'all' && item?.status !== bookingStatus);
    });
    $p('p46-count').textContent = `المعروض: ${visibleRows().length} من ${records().length} سجل محمّل`;
    syncSelectAll();
  }
  function syncSelectAll() {
    const ids = visibleRows().map(el => el.dataset.p46Id);
    $p('p46-all').checked = ids.length > 0 && ids.every(id => selected.has(id));
    $p('p46-all').indeterminate = ids.some(id => selected.has(id)) && !ids.every(id => selected.has(id));
  }
  async function verifyEditor() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) { notice('الاتصال بقاعدة البيانات غير جاهز.',true); return false; }
    const sess = await supabaseClient.auth.getSession();
    if (!sess.data?.session) { notice('انتهت جلسة الدخول. سجّل الدخول مجددًا.',true); return false; }
    const r = await supabaseClient.rpc('is_content_editor');
    if (r.error || r.data !== true) { notice('لا توجد صلاحية لإجراء تعديل.',true); return false; }
    return true;
  }
  async function batchPublish(publish) {
    if (!supportsPublish()) return;
    const allowed = [...selected].filter(id => records().some(x => String(x.id) === id));
    if (!allowed.length) { notice('حدّد عنصرًا واحدًا على الأقل أولًا.',true); return; }
    if (allowed.length > 100) { notice('لضمان دقة التحديث، حدد 100 عنصر أو أقل في العملية الواحدة.',true); return; }
    if (!confirm(`هل تؤكد ${publish ? 'إظهار' : 'إخفاء'} ${allowed.length} عنصر؟`)) return;
    for (const b of [$p('p46-show'),$p('p46-hide')]) b.disabled = true;
    try {
      if (!(await verifyEditor())) return;
      const {data,error} = await supabaseClient.from(table()).update({is_published:publish}).in('id',allowed).select('id');
      if (error) throw error;
      const done = new Set((data||[]).map(x => String(x.id)));
      for (const id of done) selected.delete(id);
      notice(done.size === allowed.length ? `تم ${publish ? 'إظهار' : 'إخفاء'} ${done.size} عنصر بنجاح.` : `تم تعديل ${done.size} من ${allowed.length}؛ تحقق من الصلاحيات والنتائج.`,done.size!==allowed.length);
      await load();
    } catch (e) { notice('فشل التعديل الجماعي: ' + (e.message || e),true); }
    finally { controlVisibility(); }
  }
  const csvCell = v => {
    const s = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '');
    const safe = /^[\s]*[=+\-@]/.test(s) ? "'" + s : s;
    return '"' + safe.replace(/"/g,'""') + '"';
  };
  function download(content, file, mime) {
    const url = URL.createObjectURL(new Blob([content], {type:mime}));
    const a = document.createElement('a');
    a.href = url;
    a.download = file;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url),3000);
  }
  function exportData(format) {
    if (!allowExport() || !$p('gate')?.hidden) return notice('لا يمكن تصدير هذه البيانات.',true);
    const batch = records().filter(x => visibleRows().some(el => el.dataset.p46Id === String(x.id)));
    if (!batch.length) return notice('لا توجد سجلات ظاهرة للتصدير.',true);
    const name = 'clinic-' + table() + '-' + new Date().toISOString().slice(0,10);
    if (format === 'json') download(JSON.stringify({table:table(), exportedAt:new Date().toISOString(), count:batch.length, records:batch},null,2),name+'.json','application/json;charset=utf-8');
    else {
      const fields = [...new Set(batch.flatMap(x => Object.keys(x)))];
      const content = '\ufeff' + fields.map(csvCell).join(',') + '\r\n' + batch.map(row => fields.map(f => csvCell(row[f])).join(',')).join('\r\n');
      download(content,name+'.csv','text/csv;charset=utf-8');
    }
    notice(`تم تجهيز ${batch.length} سجل للتنزيل على جهازك. لا يشمل ذلك بقية السجلات غير المحمّلة.`);
  }
  function formData() {
    const data = {};
    editor.querySelectorAll('[data-k]').forEach(el => { data[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value; });
    return data;
  }
  const draftPrefix = () => `clinic-p46-draft:${mode}:${type()}:`;
  function clearDraft() { if(draftKey) safeStore.del(draftKey); }
  function markDraft() {
    if (type() === 'bookings') return;
    dirty = true;
    if(draftTimer) clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      safeStore.set(draftKey,JSON.stringify({updated:new Date().toISOString(),values:formData()}));
      const label = $p('p46-draft-status');
      if(label) label.textContent='تم حفظ التعديلات مؤقتًا داخل تبويب المتصفح.';
    },450);
  }
  function showDraft(saved) {
    const old=editor.querySelector('.p46-draft'); if(old) old.remove();
    if(!saved) return;
    let candidate;
    try { candidate=JSON.parse(saved); } catch (_) { return; }
    if(!candidate || !candidate.values) return;
    const banner=document.createElement('div'); banner.className='p46-draft';
    const label=document.createElement('span'); label.textContent='توجد مسودة سابقة لهذه الاستمارة لم تُرسل إلى قاعدة البيانات.';
    const restore=document.createElement('button');restore.type='button';restore.textContent='استعادة المسودة';
    restore.addEventListener('click',()=>{
      editor.querySelectorAll('[data-k]').forEach(el=>{
        if (!Object.prototype.hasOwnProperty.call(candidate.values,el.dataset.k)) return;
        if(el.type==='checkbox') el.checked=!!candidate.values[el.dataset.k];
        else el.value=candidate.values[el.dataset.k];
      });
      dirty=true;
      banner.remove();
      notice('استُعيدت المسودة محليًا. اضغط حفظ لإرسال التعديلات إلى Supabase.');
    });
    const discard=document.createElement('button');discard.type='button';discard.textContent='تجاهل المسودة';
    discard.addEventListener('click',()=>{clearDraft();banner.remove();});
    banner.append(label,restore,discard);editor.prepend(banner);
  }
  function previewForm() {
    if(type()==='bookings') return;
    const data=formData();
    const shade=document.createElement('div'); shade.className='p46-dialog';shade.setAttribute('role','dialog');shade.setAttribute('aria-modal','true');shade.setAttribute('aria-label','معاينة المحتوى');
    const card=document.createElement('div');card.className='p46-dialog-inner';
    const title=document.createElement('h2');title.textContent=data.title_ar||data.question_ar||data.label_ar||'معاينة المحتوى';card.appendChild(title);
    const imgUrl=data.image_url||data.cover_url;
    if(imgUrl&&/^https?:\/\//i.test(imgUrl)){const img=document.createElement('img');img.alt=title.textContent;img.src=imgUrl;img.loading='lazy';card.appendChild(img);}
    for(const [key,value] of Object.entries(data)){
      if(key==='title_ar'||key==='question_ar'||key==='image_url'||key==='cover_url'||key==='slug'||key.startsWith('_'))continue;
      if (typeof value==='boolean' && !value) continue;
      if (!value) continue;
      const label=document.createElement('strong');label.textContent=(defs[type()]?.fields?.find(f=>f[0]===key)?.[1]||key)+':';card.appendChild(label);
      const paragraph=document.createElement('pre');paragraph.textContent=String(value);card.appendChild(paragraph);
    }
    const close=document.createElement('button');close.type='button';close.textContent='إغلاق المعاينة';close.className='btn secondary';close.onclick=()=>shade.remove();card.appendChild(close);
    shade.onclick=e=>{if(e.target===shade)shade.remove()};shade.appendChild(card);document.body.appendChild(shade);close.focus();
  }
  const nativeRender = renderForm;
  renderForm = function (record) {
    if (isSaving) { clearDraft(); dirty=false; }
    const result=nativeRender.apply(this,arguments);
    editingId = record?.id ? String(record.id) : 'new';
    draftKey = draftPrefix() + editingId;
    if (type() !== 'bookings') {
      const actions=editor.querySelector('.actions');
      if(actions) {
        const row=document.createElement('div');row.className='p46-formtools';
        const preview=document.createElement('button');preview.type='button';preview.textContent='معاينة قبل الحفظ';preview.onclick=previewForm;
        const info=document.createElement('span');info.id='p46-draft-status';info.className='p46-note';info.textContent='Ctrl+S للحفظ | المسودة داخل تبويب المتصفح فقط';
        row.append(preview,info);actions.after(row);
      }
      showDraft(safeStore.get(draftKey));
    }
    dirty=false;
    return result;
  };
  const nativeSave = save;
  save = async function () {
    if(type()!=='bookings') {
      const data=formData();
      const title=(data.title_ar||data.question_ar||data.label_ar||data.platform||'').trim();
      if(!title && !['hours','social'].includes(type())) {notice('يجب إدخال اسم العنصر أو عنوانه قبل الحفظ.',true);return;}
      if(data.slug) {
        const duplicate=records().find(x => String(x.id)!==editingId && x.slug===data.slug && (type()!=='diseases'||x.category===data.category));
        if(duplicate) {notice('يوجد عنصر آخر له الرابط المختصر نفسه في التصنيف. غيّر slug قبل الحفظ.',true);return;}
      }
    }
    isSaving=true;
    try { return await nativeSave.apply(this,arguments); }
    finally { isSaving=false; }
  };
  const nativeLoad=load;
  load = async function () {
    const result=await nativeLoad.apply(this,arguments);
    decorate();
    return result;
  };
  if(mode==='data') {
    const nativeDraw=draw;
    draw=function () {const result=nativeDraw.apply(this,arguments);decorate();return result;};
    $p('search')?.addEventListener('input',()=>setTimeout(decorate,0));
    $p('contentFilters')?.addEventListener('click',()=>setTimeout(decorate,0));
  }
  editor.addEventListener('input',markDraft);
  editor.addEventListener('change',markDraft);
  tabs?.addEventListener('click',event=>{
    const target=event.target.closest('button[data-tab]');
    if(!target) return;
    if (dirty && !confirm('توجد تعديلات لم تحفظ بعد. المسودة محفوظة داخل هذا التبويب فقط. هل تريد تغيير القسم؟')) {
      event.preventDefault();event.stopImmediatePropagation();return;
    }
    dirty=false;
    clearTimeout(draftTimer);
    setTimeout(decorate,50);
  },true);
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s' && $p('gate')?.hidden && !$p('save')?.disabled){e.preventDefault();$p('save')?.click();}
  });
  $p('p46-publication').onchange=applyFilters;
  $p('p46-search').oninput=applyFilters;
  $p('p46-booking-status').onchange=applyFilters;
  $p('p46-all').onchange=e=>{
    visibleRows().forEach(el=>{
      const cb=el.querySelector('.p46-selection');
      if(cb){cb.checked=e.target.checked;if(cb.checked)selected.add(el.dataset.p46Id);else selected.delete(el.dataset.p46Id);}
    });
    syncSelectAll();
  };
  $p('p46-show').onclick=()=>batchPublish(true);
  $p('p46-hide').onclick=()=>batchPublish(false);
  $p('p46-csv').onclick=()=>exportData('csv');
  $p('p46-json').onclick=()=>exportData('json');
  $p('p46-refresh').onclick=()=>{resetSelection();load()};
  $p('p46-more').onclick=async()=>{
    if(mode!=='data'||!($p('gate')?.hidden))return;
    const button=$p('p46-more'),originalTab=type(),start=records().length;
    button.disabled=true;notice('جارٍ تحميل سجلات إضافية...');
    try {
      let query=supabaseClient.from(table()).select('*');
      const d=defs[type()];
      if(d.order)query=query.order(d.order,{ascending:type()!=='bookings'});
      const {data,error}=await query.range(start,start+299);
      if(error)throw error;
      if(type()!==originalTab)return;
      const existing=new Set(records().map(r=>String(r.id)));
      const added=(data||[]).filter(x=>!existing.has(String(x.id)));
      rows.push(...added);
      if(mode==='data')draw();
      button.hidden=(data||[]).length<300||!added.length;
      notice(`تم تحميل ${added.length} سجل إضافي. إجمالي المحمل: ${rows.length}.`);
    }catch(e){notice('تعذّر تحميل المزيد: '+(e.message||e),true)}
    finally{button.disabled=false;}
  };
  controlVisibility();
})();
