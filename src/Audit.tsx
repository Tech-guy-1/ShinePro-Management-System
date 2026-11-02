import {useEffect,useState} from 'react'
import {supabase} from './supabase'
type Row=Record<string,any>
const NOUN:Record<string,string>={clients:'client',jobs:'job',staff:'ground worker',attendance:'attendance record',expenses:'expense',inventory:'inventory item',documents:'document',payroll:'payroll entry',profiles:'user'}
const VERB:Record<string,string>={INSERT:'Added',UPDATE:'Edited',DELETE:'Deleted'}
export function describe(l:Row){
 const r=l.row_data||{};const name=r.number&&r.kind?`${r.kind} ${r.number}`:r.number||r.name||r.item||r.title||r.full_name||r.description||r.period||''
 const extra=l.table_name==='inventory'&&r.quantity!=null?` (qty ${r.quantity})`:l.table_name==='attendance'?(r.present?' (present)':' (absent)'):''
 return `${VERB[l.action]||l.action} ${NOUN[l.table_name]||l.table_name}${name?` “${name}”`:''}${extra}`}
const when=(s:string)=>new Date(s).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})
async function load(limit:number,sup?:string){
 const {data:ps}=await supabase.from('profiles').select('id,full_name,role').neq('role','admin')
 const sups=ps??[];const names:Record<string,string>=Object.fromEntries(sups.map((p:Row)=>[p.id,p.full_name]))
 const ids=sup?[sup]:sups.map((p:Row)=>p.id)
 if(!ids.length)return {sups,names,logs:[] as Row[]}
 const {data}=await supabase.from('audit_logs').select('*').in('user_id',ids).order('created_at',{ascending:false}).limit(limit)
 return {sups,names,logs:data??[]}}
// Admin view: what each supervisor has been doing
export function AuditView(){
 const [sup,setSup]=useState('');const [tbl,setTbl]=useState('');const [s,setS]=useState<{sups:Row[];names:Record<string,string>;logs:Row[]}>({sups:[],names:{},logs:[]})
 useEffect(()=>{load(500,sup||undefined).then(setS)},[sup])
 const logs=s.logs.filter(l=>!tbl||l.table_name===tbl)
 return <div><div className="bar"><h2>Audit Logs — Supervisor Activity</h2></div>
  <div className="card form"><select value={sup} onChange={e=>setSup(e.target.value)}><option value="">All supervisors</option>{s.sups.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select>
  <select value={tbl} onChange={e=>setTbl(e.target.value)}><option value="">All activity</option>{Object.entries(NOUN).filter(([k])=>k!=='profiles').map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
  <div className="card scroll"><table><thead><tr><th>When</th><th>Supervisor</th><th>Activity</th></tr></thead><tbody>
  {logs.map(l=><tr key={l.id}><td>{when(l.created_at)}</td><td><b>{s.names[l.user_id]??'—'}</b></td><td>{describe(l)}</td></tr>)}
  {!logs.length&&<tr><td colSpan={3}>No supervisor activity yet.</td></tr>}</tbody></table></div></div>}
// Compact version for the admin dashboard
export function RecentActivity({goto}:{goto:()=>void}){
 const [s,setS]=useState<{names:Record<string,string>;logs:Row[]}>({names:{},logs:[]})
 useEffect(()=>{load(8).then(setS)},[])
 return <div className="card"><div className="bar"><b>Supervisor activity</b><a className="link" onClick={goto}>View all →</a></div>
  {s.logs.length?<ul>{s.logs.map(l=><li key={l.id}><b>{s.names[l.user_id]??'—'}</b>: {describe(l)} <small>· {when(l.created_at)}</small></li>)}</ul>:<p><small>No supervisor activity yet.</small></p>}</div>}
