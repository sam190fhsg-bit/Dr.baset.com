/* PHASE27: Keep all booking requests on the existing booking form and backend. */
(function(){function ready(){
  var booking=document.querySelector('#bookingForm,form#booking-form,form[data-booking-form]');
  if(document.body && /booking\.html$/i.test(location.pathname)){
    var params=new URLSearchParams(location.search), requested=params.get('service');
    var select=document.querySelector('#service,select[name="service"]');
    if(requested&&select){var option=[...select.options].find(o=>o.value===requested||o.textContent.trim()===requested);if(!option){option=document.createElement('option');option.value=requested;option.textContent=requested;select.add(option)}select.value=option.value;}
  }else{
    var serviceMap={'internal-medicine.html':'أمراض الباطنة','liver.html':'أمراض الكبد','gastroenterology.html':'أمراض الجهاز الهضمي','endoscopy.html':'مناظير الجهاز الهضمي'};
    var page=location.pathname.split('/').pop();var selected=serviceMap[page];
    if(!selected&&/endoscop|colonoscopy|gastroscopy/i.test(page))selected='مناظير الجهاز الهضمي';
    if(selected){document.querySelectorAll('a[href="booking.html"],a[href^="booking.html?"]').forEach(a=>{a.href='booking.html?service='+encodeURIComponent(selected)})}
  }
  document.querySelectorAll('details.mobile-menu,details.mobile-global-menu').forEach(m=>{m.querySelector('summary')?.setAttribute('aria-label','فتح وإغلاق قائمة الموقع')});
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready()})();
