import {useEffect,useState} from 'react'
import {supabase,phoneToEmail,configured} from './supabase'
import {MODULES} from './modules'
import ModuleView from './ModuleView'
import Reports from './Reports'
import logo from './logo.png'
type Profile={full_name:string;role:string;status:string}
export default function App(){
 const [prof,setProf]=useState<Profile|null>(null);const [ready,setReady]=useState(false)
 const [mode,setMode]=useState<'in'|'up'>('in');const [f,setF]=useState({name:'',phone:'',pw:''});const [msg,setMsg]=useState('')
 const [inst,setInst]=useState<any>(null)
 useEffect(()=>{const h=(e:any)=>{e.preventDefault();setInst(e)};addEventListener('beforeinstallprompt',h);return()=>removeEventListener('beforeinstallprompt',h)},[])
 const standalone=matchMedia('(display-mode: standalone)').matches||(navigator as any).standalone
 const isIOS=/iphone|ipad/i.test(navigator.userAgent)
 const installBtn=standalone?null:inst?<button onClick={()=>{inst.prompt();setInst(null)}}>⬇ Install Shine Pro app</button>:isIOS?<small>iPhone/iPad: tap Share, then “Add to Home Screen” to install.</small>:null
 const [tab,setTab]=useState('home');const [low,setLow]=useState<any[]>([]);const [counts,setCounts]=useState<Record<string,number>>({})
 const loadProfile=async()=>{try{await loadP()}catch{setProf(null);setReady(true)}};const loadP=async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user){setProf(null);setReady(true);return}
  const {data}=await supabase.from('profiles').select('full_name,role,status').eq('id',user.id).single();setProf(data);setReady(true)}
 useEffect(()=>{loadProfile();const {data:s}=supabase.auth.onAuthStateChange(()=>{loadProfile()});return()=>s.subscription.unsubscribe()},[])
 const isAdmin=prof?.role==='admin',ok=prof?.status==='approved'
 useEffect(()=>{if(!ok)return;MODULES.filter(m=>['clients','jobs','staff','expenses','inventory'].includes(m.key)).forEach(async m=>{
  const {count}=await supabase.from(m.table).select('*',{count:'exact',head:true});setCounts(c=>({...c,[m.key]:count??0}))})
 supabase.from('inventory').select('item,quantity,min_level').then(({data})=>setLow((data??[]).filter((r:any)=>+r.quantity<=+r.min_level)))},[ok])
 const submit=async()=>{setMsg('')
  if(mode==='up'){const {error}=await supabase.auth.signUp({email:phoneToEmail(f.phone),password:f.pw,options:{data:{full_name:f.name,phone:f.phone}}});if(error)setMsg(error.message)}
  else{const {error}=await supabase.auth.signInWithPassword({email:phoneToEmail(f.phone),password:f.pw});if(error)setMsg('Invalid phone or password')}}
 if(!ready)return <p style={{padding:20}}>Loading…</p>
 if(!prof)return <div className="auth card"><img src={logo} alt="Shine Pro" className="logo"/><h1>Shine Pro</h1>{!configured&&<p className="err">Preview mode: Supabase is not connected yet. Put your Supabase URL and anon key in the window.SHINEPRO line at the top of this file.</p>}{installBtn}<h3>{mode==='in'?'Staff sign in':'Supervisor registration'}</h3>
  {mode==='up'&&<input placeholder="Full name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>}
  <input placeholder="Phone number" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/>
  <input type="password" placeholder="Password (min 8 chars)" value={f.pw} onChange={e=>setF({...f,pw:e.target.value})}/>
  <button onClick={submit}>{mode==='in'?'Sign in':'Register'}</button>{msg&&<p className="err">{msg}</p>}
  <a onClick={()=>setMode(mode==='in'?'up':'in')}>{mode==='in'?'New supervisor? Register':'Have an account? Sign in'}</a></div>
 if(!ok)return <div className="auth card"><img src={logo} alt="Shine Pro" className="logo"/><h1>Shine Pro</h1><p>{prof.status==='rejected'?'Your registration was rejected.':'Your account is pending administrator approval.'}</p><button onClick={()=>supabase.auth.signOut()}>Sign out</button></div>
 const mods=MODULES.filter(m=>isAdmin||!m.adminOnly);const cur=mods.find(m=>m.key===tab)
 return <div className="layout"><aside><img src={logo} alt="Shine Pro" className="logo"/><h2>Shine Pro</h2><small>{isAdmin?'Admin':'Supervisor'} · {prof.full_name}</small>{installBtn}
  <a className={tab==='home'?'on':''} onClick={()=>setTab('home')}>Dashboard</a>
  <a className={tab==='reports'?'on':''} onClick={()=>setTab('reports')}>Reports</a>
  {mods.map(m=><a key={m.key} className={tab===m.key?'on':''} onClick={()=>setTab(m.key)}>{m.label}</a>)}
  <a onClick={()=>supabase.auth.signOut()}>Sign out</a></aside>
  <main>{tab==='reports'?<Reports/>:cur?<ModuleView m={cur} isAdmin={isAdmin}/>:<><h2>{isAdmin?'Admin':'Supervisor'} Dashboard</h2><div className="grid">
  {Object.entries(counts).map(([k,v])=><div className="card stat" key={k}><b>{v}</b><span>{k}</span></div>)}</div>{low.length>0&&<div className="card"><b>⚠ Low stock</b><ul>{low.map((r,i)=><li key={i}>{r.item}: {r.quantity} left (min {r.min_level})</li>)}</ul></div>}</>}</main></div>}
