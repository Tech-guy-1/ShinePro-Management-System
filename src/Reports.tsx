import {useEffect,useState} from 'react'
import {supabase} from './supabase'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
type M={month:string;income:number;expenses:number;payroll:number}
export default function Reports(){
 const [data,setData]=useState<M[]>([])
 useEffect(()=>{(async()=>{
  const g=async(t:string)=>(await supabase.from(t).select('*')).data??[]
  const [docs,exp,pay]=await Promise.all([g('documents'),g('expenses'),g('payroll')])
  const map:Record<string,M>={};const row=(k:string)=>map[k]??={month:k,income:0,expenses:0,payroll:0}
  docs.filter((d:any)=>['invoice','receipt'].includes(d.kind)&&d.status==='paid').forEach((d:any)=>row(String(d.created_at).slice(0,7)).income+=Number(d.amount||0))
  exp.forEach((e:any)=>row(String(e.spent_on||e.created_at).slice(0,7)).expenses+=Number(e.amount||0))
  pay.filter((p:any)=>p.paid).forEach((p:any)=>row(String(p.created_at).slice(0,7)).payroll+=Number(p.amount||0))
  setData(Object.values(map).sort((a,b)=>a.month.localeCompare(b.month)))})()},[])
 const sum=(k:keyof M)=>data.reduce((s,r)=>s+(r[k] as number),0)
 const income=sum('income'),cost=sum('expenses')+sum('payroll'),max=Math.max(1,...data.map(r=>Math.max(r.income,r.expenses+r.payroll)))
 const xlsx=()=>{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data),'Summary');XLSX.writeFile(wb,'shinepro-financial-report.xlsx')}
 const pdf=()=>{const d=new jsPDF();d.setTextColor(14,165,233);d.setFontSize(16);d.text('Shine Pro - Financial Report',14,15)
  autoTable(d,{startY:22,head:[['Month','Income','Expenses','Payroll','Profit']],body:data.map(r=>[r.month,r.income,r.expenses,r.payroll,r.income-r.expenses-r.payroll]),foot:[['Total',income,sum('expenses'),sum('payroll'),income-cost]],headStyles:{fillColor:[14,165,233]},footStyles:{fillColor:[224,242,254],textColor:[12,74,110]}});d.save('shinepro-financial-report.pdf')}
 return <div><div className="bar"><h2>Financial Reports</h2><span><button onClick={xlsx}>Excel</button> <button onClick={pdf}>PDF</button></span></div>
 <div className="grid">{[['Income (paid)',income],['Expenses + payroll',cost],['Profit',income-cost]].map(([k,v])=><div className="card stat" key={k as string}><b>{(v as number).toFixed(2)}</b><span>{k}</span></div>)}</div>
 <div className="card"><b>Monthly: income (blue) vs costs (grey)</b><svg width="100%" height="180" style={{marginTop:8}}>
 {data.map((r,i)=>{const w=100/Math.max(data.length,1);return <g key={r.month}>
  <rect x={`${i*w+w*0.1}%`} y={160-r.income/max*140} width={`${w*0.35}%`} height={r.income/max*140} fill="#0ea5e9"/>
  <rect x={`${i*w+w*0.5}%`} y={160-(r.expenses+r.payroll)/max*140} width={`${w*0.35}%`} height={(r.expenses+r.payroll)/max*140} fill="#94a3b8"/>
  <text x={`${i*w+w*0.5}%`} y="176" fontSize="10" textAnchor="middle" fill="#0c4a6e">{r.month}</text></g>})}</svg></div>
 <p><small>Income counts invoices/receipts marked "paid". Payroll counts rows marked paid.</small></p></div>}
