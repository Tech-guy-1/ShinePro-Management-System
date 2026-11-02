import {useEffect,useState} from 'react'
import {supabase} from './supabase'
import {Mod} from './modules'
import {docPdf} from './docPdf'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
type Row=Record<string,any>
function PayrollGen({done}:{done:()=>void}){
 const [a,setA]=useState('');const [b,setB]=useState('');const [msg,setMsg]=useState('')
 const go=async()=>{if(!a||!b)return setMsg('Pick both dates')
  const {data:s}=await supabase.from('staff').select('id,daily_rate');const {data:at}=await supabase.from('attendance').select('staff_id,present').gte('work_date',a).lte('work_date',b)
  const rows=(s??[]).map((x:Row)=>({staff_id:x.id,period:`${a} to ${b}`,amount:(at??[]).filter((y:Row)=>y.staff_id===x.id&&y.present).length*Number(x.daily_rate||0)})).filter(r=>r.amount>0)
  if(!rows.length)return setMsg('No attendance found in that range')
  const {error}=await supabase.from('payroll').insert(rows);setMsg(error?error.message:`Generated ${rows.length} payroll rows`);done()}
 return <div className="card form"><b>Generate from attendance:</b><input type="date" value={a} onChange={e=>setA(e.target.value)}/><input type="date" value={b} onChange={e=>setB(e.target.value)}/><button onClick={go}>Generate</button>{msg&&<span>{msg}</span>}</div>}
function Items({items,onChange}:{items:Row[];onChange:(i:Row[])=>void}){
 const mv=(i:number,d:number)=>{const j=i+d;if(j<0||j>=items.length)return;const a=[...items];[a[i],a[j]]=[a[j],a[i]];onChange(a)}
 const up=(i:number,k:string,v:string)=>onChange(items.map((x,j)=>j===i?{...x,[k]:v}:x))
 return <div style={{width:'100%'}}><b>Line items</b>{items.map((x,i)=><div key={i}><input placeholder="Description" value={x.desc??''} onChange={e=>up(i,'desc',e.target.value)}/><input type="number" placeholder="Qty" style={{width:70}} value={x.qty??''} onChange={e=>up(i,'qty',e.target.value)}/><input type="number" placeholder="Unit price" style={{width:110}} value={x.price??''} onChange={e=>up(i,'price',e.target.value)}/><button className="ghost" onClick={()=>mv(i,-1)}>↑</button><button className="ghost" onClick={()=>mv(i,1)}>↓</button><button className="ghost" onClick={()=>onChange(items.filter((_,j)=>j!==i))}>✕</button></div>)}<button className="ghost" onClick={()=>onChange([...items,{desc:'',qty:1,price:0}])}>+ Add line</button></div>}
function Check({text,onChange}:{text:string|null;onChange:(t:string)=>void}){
 const lines=(text??'').split('\n').filter(Boolean)
 return <div>{lines.map((l,i)=>{const d=l.startsWith('[x] ');return <label key={i} style={{display:'block'}}><input type="checkbox" checked={d} onChange={()=>onChange(lines.map((x,j)=>j===i?(d?'[ ] ':'[x] ')+x.slice(4):x).join('\n'))}/> {l.slice(4)}</label>})}</div>}
export default function ModuleView({m,isAdmin}:{m:Mod;isAdmin:boolean}){
 const [rows,setRows]=useState<Row[]>([]);const [form,setForm]=useState<Row>({});const [err,setErr]=useState('');const [edit,setEdit]=useState<string|null>(null)
 const [look,setLook]=useState<Record<string,Record<string,string>>>({})
 const load=async()=>{const {data,error}=await supabase.from(m.table).select('*').order('created_at',{ascending:false}).limit(500);setErr(error?.message??'');setRows(data??[])}
 useEffect(()=>{load();setForm({});setEdit(null);m.fields.filter(f=>f.ref).forEach(async f=>{const {data}=await supabase.from(f.ref!.table).select(`id,${f.ref!.col}`)
  setLook(l=>({...l,[f.name]:Object.fromEntries((data??[]).map((r:any)=>[r.id,r[f.ref!.col]]))}))})},[m.key])
 const save=async()=>{const f2:Row={...form}
  if(m.key==='documents'&&!edit&&!f2.number){const P:Row={quotation:'QUO',invoice:'INV',receipt:'REC',contract:'CON'};const k=f2.kind||'invoice';f2.kind=k
   const n=rows.filter(r=>r.kind===k).reduce((a,r)=>Math.max(a,parseInt(String(r.number).split('-').pop()||'0')||0),0)+1;f2.number=`${P[k]}-${new Date().getFullYear()}-${String(n).padStart(4,'0')}`}
  if(m.key==='jobs'&&f2.checklist)f2.checklist=String(f2.checklist).split('\n').filter(Boolean).map((l:string)=>/^\[[ x]\] /.test(l)?l:'[ ] '+l).join('\n')
  const p=Object.fromEntries(Object.entries(f2).map(([k,v])=>[k,v===''?null:v]))
  const {error}=edit?await supabase.from(m.table).update(p).eq('id',edit):await supabase.from(m.table).insert(p)
  if(error){setErr(/duplicate/i.test(error.message)?'That document number is already used - press Add again to get the next one.':error.message);load()}else{setForm({});setEdit(null);load()}}
 const startEdit=(r:Row)=>{setEdit(r.id);setForm({...Object.fromEntries(m.fields.map(f=>[f.name,r[f.name]??''])),...(m.key==='documents'?{items:r.items??[]}:{})})}
 const del=async(id:string)=>{if(confirm('Delete?')){const {error}=await supabase.from(m.table).delete().eq('id',id);if(error)setErr(error.message);load()}}
 const upd=async(id:string,patch:Row,t=m.table)=>{await supabase.from(t).update(patch).eq('id',id);load()}
 const cols=rows[0]?Object.keys(rows[0]).filter(k=>!['row_data','items'].includes(k)):[]
 const show=(r:Row,c:string)=>String(look[c]?.[r[c]]??r[c]??'')
 const flat=rows.map(r=>Object.fromEntries(cols.map(c=>[c,show(r,c)])))
 const xlsx=()=>{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(flat),m.key);XLSX.writeFile(wb,`shinepro-${m.key}.xlsx`)}
 const pdf=()=>{const d=new jsPDF({orientation:'landscape'});d.setTextColor(14,165,233);d.setFontSize(16);d.text(`Shine Pro - ${m.label}`,14,15)
  autoTable(d,{startY:22,head:[cols],body:flat.map(r=>cols.map(c=>r[c])),headStyles:{fillColor:[14,165,233]},styles:{fontSize:7}});d.save(`shinepro-${m.key}.pdf`)}
 return <div><div className="bar"><h2>{m.label}</h2><span><button onClick={xlsx}>Excel</button> <button onClick={pdf}>PDF</button></span></div>
 {err&&<p className="err">{err}</p>}
 {m.key==='payroll'&&<PayrollGen done={load}/>}
 {!m.readOnly&&<div className="card form">{m.fields.map(f=>{const v=form[f.name]??'';const set=(x:string)=>setForm({...form,[f.name]:x})
  if(f.ref||f.options)return <select key={f.name} value={v} onChange={e=>set(e.target.value)}><option value="">{f.label}…</option>{f.ref?Object.entries(look[f.name]??{}).map(([id,n])=><option key={id} value={id}>{n}</option>):f.options!.map(o=><option key={o}>{o}</option>)}</select>
  if(f.name==='checklist')return <textarea key={f.name} rows={3} placeholder={f.label} value={v} onChange={e=>set(e.target.value)}/>
  return <input key={f.name} placeholder={f.label} type={f.type??'text'} value={v} onChange={e=>set(e.target.value)}/>})}
  {m.key==='documents'&&<Items items={form.items??[]} onChange={(it:Row[])=>setForm({...form,items:it,amount:it.reduce((s,x)=>s+Number(x.qty||0)*Number(x.price||0),0)})}/>}<button onClick={save}>{edit?'Save changes':'Add'}</button>{edit&&<button className="ghost" onClick={()=>{setEdit(null);setForm({})}}>Cancel</button>}</div>}
 <div className="card scroll"><table><thead><tr>{cols.map(c=><th key={c}>{c}</th>)}<th></th></tr></thead><tbody>
 {rows.map(r=><tr key={r.id}>{cols.map(c=><td key={c}>{m.key==='jobs'&&c==='checklist'?<Check text={r.checklist} onChange={t=>upd(r.id,{checklist:t})}/>:show(r,c)}</td>)}<td>
 {m.key==='users'&&<><button onClick={()=>upd(r.id,{status:'approved'})}>Approve</button> <button className="ghost" onClick={()=>upd(r.id,{status:'rejected'})}>Reject</button></>}
 {m.key==='documents'&&<button onClick={()=>docPdf(r,look.client_id?.[r.client_id]??'')}>PDF</button>}
 {m.key==='payroll'&&!r.paid&&<button onClick={()=>upd(r.id,{paid:true})}>Mark paid</button>}
 {!m.readOnly&&<button className="ghost" onClick={()=>startEdit(r)}>Edit</button>}
 {isAdmin&&!m.readOnly&&<button className="ghost" onClick={()=>del(r.id)}>Delete</button>}</td></tr>)}</tbody></table></div></div>}
