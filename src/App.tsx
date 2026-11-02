import {useEffect,useState} from 'react'
import {supabase,phoneToEmail,configured} from './supabase'
import {MODULES} from './modules'
import ModuleView from './ModuleView'
import Reports from './Reports'
import {RecentActivity} from './Audit'
import logo from './logo-clean.png'
type Profile={full_name:string;role:string;status:string}
export default function App(){
 const [prof,setProf]=useState<Profile|null>(null);const [ready,setReady]=useState(false)
 const [mode,setMode]=useState<'in'|'up'>('in');const [f,setF]=useState({name:'',phone:'',pw:''});const [msg,setMsg]=useState('')
 const [inst,setInst]=useState<any>(null)
 useEffect(()=>{const h=(e:any)=>{e.preventDefault();setInst(e)};addEventListener('beforeinstallprompt',h);return()=>removeEventListener('beforeinstallprompt',h)},[])
 const standalone=matchMedia('(display-mode: standalone)').matches||(navigator as any).standalone
 const isIOS=/iphone|ipad/i.test(navigator.userAgent)
 const installBtn=standalone?null:inst?<button onClick={()=>{inst.prompt();setInst(null)}}>⬇ Install Shine Pro app</button>:isIOS?<small>iPhone/iPad: tap Share, then “Add to Home Screen” to install.</small>:null
 const [tab,setTab]=useState('home');const [low,setLow]=useState<any[]>([]);const [counts,setCounts]=useState<Record<string,number>>({});const [authKey,setAuthKey]=useState(0);const [ro,setRo]=useState(true)
 const loadProfile=async()=>{try{await loadP()}catch{setProf(null);setReady(true)}};const loadP=async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user){setProf(null);setReady(true);return}
  const {data}=await supabase.from('profiles').select('full_name,role,status').eq('id',user.id).single();setProf(data);setReady(true)}
 useEffect(()=>{loadProfile();const {data:s}=supabase.auth.onAuthStateChange(()=>{loadProfile()});return()=>s.subscription.unsubscribe()},[])
 const isAdmin=prof?.role==='admin',ok=prof?.status==='approved'
 useEffect(()=>{if(!ok)return;MODULES.filter(m=>['clients','jobs','staff','expenses','inventory'].includes(m.key)).forEach(async m=>{
  const {count}=await supabase.from(m.table).select('*',{count:'exact',head:true});setCounts(c=>({...c,[m.key]:count??0}))})
  if(isAdmin){(async()=>{const q=(st:string)=>supabase.from('profiles').select('*',{count:'exact',head:true}).eq('role','supervisor').eq('status',st)
   const [a,b]=await Promise.all([q('approved'),q('pending')]);setCounts(c=>({...c,supervisors:a.count??0,pending:b.count??0}))})()}
  supabase.from('inventory').select('item,quantity,min_level').then(({data})=>setLow((data??[]).filter((r:any)=>+r.quantity<=(+r.min_level>0?+r.min_level:5))))},[ok,isAdmin])
 const logout=async()=>{await supabase.auth.signOut();setF({name:'',phone:'',pw:''});setMsg('');setMode('in');setTab('home');setCounts({});setLow([]);setProf(null);setAuthKey(k=>k+1);setRo(true)}
 const submit=async()=>{setMsg('')
  if(mode==='up'){const {error}=await supabase.auth.signUp({email:phoneToEmail(f.phone),password:f.pw,options:{data:{full_name:f.name,phone:f.phone}}});if(error)setMsg(error.message);else setF({name:'',phone:'',pw:''})}
  else{const {error}=await supabase.auth.signInWithPassword({email:phoneToEmail(f.phone),password:f.pw});if(error)setMsg('Invalid phone or password');else setF({name:'',phone:'',pw:''})}}
 if(!ready)return <p style={{padding:20}}>Loading…</p>
 if(!prof)return <div className="auth card"><img src={logo} alt="Shine Pro" className="logo"/><h1>Shine Pro</h1>{!configured&&<p className="err">Preview mode: Supabase is not connected yet. Put your Supabase URL and anon key in the window.SHINEPRO line at the top of this file.</p>}{installBtn}<h3>{mode==='in'?'Staff sign in':'Supervisor registration'}</h3>
  <form key={authKey} autoComplete="off" onSubmit={e=>{e.preventDefault();submit()}} style={{display:'flex',flexDirection:'column',gap:8}}>
  {mode==='up'&&<input name={`n${authKey}`} autoComplete="off" placeholder="Full name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>}
  <input name={`p${authKey}`} type="tel" autoComplete="off" readOnly={ro} onFocus={()=>setRo(false)} placeholder="Phone number" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/>
  <input name={`w${authKey}`} type="password" autoComplete="new-password" readOnly={ro} onFocus={()=>setRo(false)} placeholder="Password (min 8 chars)" value={f.pw} onChange={e=>setF({...f,pw:e.target.value})}/>
  <button type="submit">{mode==='in'?'Sign in':'Register'}</button></form>{msg&&<p className="err">{msg}</p>}
  <a onClick={()=>setMode(mode==='in'?'up':'in')}>{mode==='in'?'New supervisor? Register':'Have an account? Sign in'}</a></div>
 if(!ok)return <div className="auth card"><img src={logo} alt="Shine Pro" className="logo"/><h1>Shine Pro</h1><p>{prof.status==='rejected'?'Your registration was rejected.':'Your account is pending administrator approval.'}</p><button onClick={logout}>Sign out</button></div>
 const stats:{k:string;label:string;tab:string;sub?:string}[]=[{k:'clients',label:'Clients',tab:'clients'},{k:'jobs',label:'Jobs',tab:'jobs'},{k:'staff',label:'Ground workers',tab:'staff'},
  ...(isAdmin?[{k:'supervisors',label:'Supervisors',tab:'users',sub:counts.pending?`${counts.pending} pending approval`:undefined}]:[]),{k:'expenses',label:'Expenses',tab:'expenses'},{k:'inventory',label:'Inventory items',tab:'inventory'}]
 const mods=MODULES.filter(m=>isAdmin||!m.adminOnly);const cur=mods.find(m=>m.key===tab)
 return <div className="layout"><aside><img src={logo} alt="Shine Pro" className="logo"/><h2>Shine Pro</h2><small>{isAdmin?'Admin':'Supervisor'} · {prof.full_name}</small>{installBtn}
  <a className={tab==='home'?'on':''} onClick={()=>setTab('home')}>Dashboard</a>
  <a className={tab==='reports'?'on':''} onClick={()=>setTab('reports')}>Reports</a>
  {mods.map(m=><a key={m.key} className={tab===m.key?'on':''} onClick={()=>setTab(m.key)}>{m.label}</a>)}
  <a onClick={logout}>Sign out</a></aside>
  <main>{tab==='reports'?<Reports/>:cur?<ModuleView m={cur} isAdmin={isAdmin}/>:<><h2>{isAdmin?'Admin':'Supervisor'} Dashboard</h2><div className="grid">
  {stats.map(t=><div className="card stat click" key={t.tab+t.label} onClick={()=>setTab(t.tab)} title={`Open ${t.label}`}><b>{counts[t.k]??'…'}</b><span>{t.label}</span>{t.sub&&<small>{t.sub}</small>}</div>)}</div>
  {isAdmin&&<RecentActivity goto={()=>setTab('audit')}/>}
  {low.length>0&&<div className="card"><b>⚠ Low stock</b><ul>{low.map((r,i)=><li key={i}><a className="link" onClick={()=>setTab('inventory')}>{r.item}</a>: {r.quantity} left</li>)}</ul></div>}</>}</main></div>}
