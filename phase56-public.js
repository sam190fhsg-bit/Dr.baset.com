/* PHASE56. Public presentation gate for supported lists. RLS remains the data security boundary. */
window.phase56Filter=async function(table,records){
 if(!Array.isArray(records)||!records.length)return records||[];
 const sb=typeof supabaseClient==='undefined'?null:supabaseClient;
 if(!sb)return []; // fail closed when publication check is unavailable
 const ids=records.map(x=>x.id).filter(Boolean);
 if(!ids.length)return [];
 try{
  const {data,error}=await sb.rpc('phase56_visible_ids',{p_table:table,p_ids:ids});
  if(error)throw error;
  const allowed=new Set(data||[]);
  return records.filter(x=>!x.id||allowed.has(x.id));
 }catch(err){console.warn('Publication schedule check unavailable:',err.message);return [];}
};
