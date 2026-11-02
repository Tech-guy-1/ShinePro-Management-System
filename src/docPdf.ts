import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logo from './logoData'

// Shine Pro document templates (quotation, invoice, receipt, agreement, payslip, payroll register).
// Layout, wording and colours follow the Word templates supplied by the business.
type C=[number,number,number]
const NAVY:C=[18,52,90],SKY:C=[22,135,207],LIGHT:C=[234,245,252],TXT:C=[38,52,69],GREY:C=[120,132,146]
const PHONE='099 045 8378',TAGLINE='A Cleaner Space. A Better Environment.'
export type Client={name?:string;representative?:string;phone?:string;address?:string}

export const money=(n:any)=>'MWK '+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})
const num=(n:any)=>Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})
const dmy=(s:any)=>{const m=String(s??'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:'__ / __ / ____'}
const cap=(s:string)=>s.charAt(0).toUpperCase()+s.slice(1)

const ones=['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen']
const tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety']
const below1000=(n:number):string=>n<20?ones[n]:n<100?tens[Math.floor(n/10)]+(n%10?'-'+ones[n%10]:''):ones[Math.floor(n/100)]+' hundred'+(n%100?' and '+below1000(n%100):'')
export function inWords(amount:number){
 let k=Math.floor(Math.abs(amount)),t=Math.round((Math.abs(amount)-k)*100);if(t===100){k++;t=0}
 if(k===0&&t===0)return 'Zero kwacha only'
 const parts:string[]=[];for(const [v,n] of [[1e9,'billion'],[1e6,'million'],[1e3,'thousand']] as [number,string][]){if(k>=v){parts.push(below1000(Math.floor(k/v))+' '+n);k%=v}}
 if(k>0)parts.push(below1000(k))
 let s=parts.join(', ');if(!s)s='zero'
 return cap(s)+' kwacha'+(t?` and ${below1000(t)} tambala`:'')+' only'}

// Logo (no frame), top-left, reasonably sized, followed by the company name.
export function brandHeader(d:jsPDF,title?:string,sub?:string){
 const W=d.internal.pageSize.getWidth()
 d.addImage(logo,'PNG',14,9,22,22)
 d.setTextColor(...NAVY);d.setFont('helvetica','bold');d.setFontSize(20);d.text('SHINE PRO',40,20)
 d.setTextColor(...SKY);d.setFontSize(8.5);d.text('CLEANING SERVICES',40,26)
 d.setTextColor(...GREY);d.setFont('helvetica','normal');d.setFontSize(8);d.text(`Tel: ${PHONE}`,W-14,18,{align:'right'});d.text(TAGLINE,W-14,23,{align:'right'})
 let y=40
 if(title){d.setTextColor(...NAVY);d.setFont('helvetica','bold');d.setFontSize(15);d.text(title,14,y);y+=7}
 if(sub){d.setTextColor(...TXT);d.setFont('helvetica','normal');d.setFontSize(9);d.text(sub,14,y);y+=6}
 return y}
function footer(d:jsPDF){
 const n=d.getNumberOfPages(),W=d.internal.pageSize.getWidth(),H=d.internal.pageSize.getHeight()
 for(let i=1;i<=n;i++){d.setPage(i);d.setFont('helvetica','normal');d.setFontSize(8);d.setTextColor(...GREY)
  d.text(`SHINE PRO  |  ${PHONE}  |  ${TAGLINE}`,W/2,H-8,{align:'center'});if(n>1)d.text(`Page ${i} of ${n}`,W-14,H-8,{align:'right'})}}
const tableStyle={theme:'grid' as const,styles:{fontSize:9,textColor:TXT,cellPadding:2.2,lineColor:[200,214,228] as C,lineWidth:.2},headStyles:{fillColor:NAVY,textColor:[255,255,255] as C,fontSize:8,halign:'center' as const,fontStyle:'bold' as const},margin:{left:14,right:14}}
const endY=(d:jsPDF)=>(d as any).lastAutoTable.finalY
const ensure=(d:jsPDF,y:number,need:number)=>{if(y+need>278){d.addPage();return 20}return y}
function section(d:jsPDF,y:number,t:string){y=ensure(d,y,16);d.setTextColor(...NAVY);d.setFont('helvetica','bold');d.setFontSize(11.5);d.text(t,14,y);return y+3}
function meta(d:jsPDF,y:number,pairs:[string,string][]){d.setFontSize(8.5);let x=14;pairs.forEach(([k,v])=>{d.setFont('helvetica','bold');d.setTextColor(...NAVY);d.text(k,x,y);const w=d.getTextWidth(k);d.setFont('helvetica','normal');d.setTextColor(...TXT);d.text(' '+v,x+w,y);x+=w+d.getTextWidth(' '+v)+10});return y+7}
function grid(d:jsPDF,y:number,pairs:[string,string][]){autoTable(d,{...tableStyle,startY:y,head:[pairs.map(p=>p[0])],body:[pairs.map(p=>p[1]||'-')]});return endY(d)+5}
function para(d:jsPDF,y:number,text:string,o:{bold?:boolean;size?:number;indent?:number}={}){
 d.setFont('helvetica',o.bold?'bold':'normal');d.setFontSize(o.size??9.5);d.setTextColor(...TXT)
 const x=14+(o.indent??0),lines=d.splitTextToSize(text,182-(o.indent??0)) as string[]
 for(const l of lines){y=ensure(d,y,5);d.text(l,x,y);y+=4.6}
 return y+1.5}
function bullets(d:jsPDF,y:number,list:string[]){for(const b of list){const lines=d.splitTextToSize(b,172) as string[];d.setFont('helvetica','normal');d.setFontSize(9.5);d.setTextColor(...TXT)
 lines.forEach((l,i)=>{y=ensure(d,y,5);if(i===0)d.text('•',17,y);d.text(l,22,y);y+=4.6})};return y+1.5}
function note(d:jsPDF,y:number,text:string){d.setFontSize(8.5);const lines=d.splitTextToSize(text,176) as string[],h=lines.length*4+5;y=ensure(d,y,h)
 d.setFillColor(...LIGHT);d.rect(14,y,182,h,'F');d.setFont('helvetica','normal');d.setTextColor(...TXT);d.text(lines,17,y+5);return y+h+5}
function totalBar(d:jsPDF,y:number,label:string,total:any,subtotal?:any){
 y=ensure(d,y,24);if(subtotal!==undefined){d.setFillColor(...LIGHT);d.rect(110,y,86,8,'F');d.setFont('helvetica','bold');d.setFontSize(8.5);d.setTextColor(...NAVY);d.text('SUBTOTAL (MWK)',113,y+5.3);d.setTextColor(...TXT);d.text(num(subtotal),193,y+5.3,{align:'right'});y+=9}
 d.setFillColor(...NAVY);d.rect(110,y,86,10,'F');d.setFont('helvetica','bold');d.setFontSize(9.5);d.setTextColor(255,255,255);d.text(label,113,y+6.5);d.text(num(total),193,y+6.5,{align:'right'});return y+16}
function sign(d:jsPDF,y:number,labels:string[]){y=ensure(d,y,22);const w=182/labels.length;d.setDrawColor(...GREY);d.setLineWidth(.25);d.setFont('helvetica','normal');d.setFontSize(8.5);d.setTextColor(...GREY)
 labels.forEach((l,i)=>{const x=14+i*w;d.line(x,y+10,x+w-8,y+10);d.text(l,x,y+14.5)});return y+22}
function items(d:jsPDF,y:number,r:any,first:'Date'|'No.'){
 const its:any[]=r.items||[];const sub=its.reduce((s,x)=>s+Number(x.qty||0)*Number(x.price||0),0)
 const d0=dmy(r.created_at)
 const body=its.length?its.map((x,i)=>[first==='No.'?String(i+1):d0,x.desc||'',x.qty??'',num(x.price),num(Number(x.qty||0)*Number(x.price||0))]):[[first==='No.'?'1':d0,r.details||cap(String(r.kind||'Service')),'1',num(r.amount),num(r.amount)]]
 autoTable(d,{...tableStyle,startY:y,head:[[first,'Description','Quantity','Unit rate (MWK)','Amount (MWK)']],body,
  columnStyles:{0:{cellWidth:22,halign:'center'},2:{cellWidth:22,halign:'center'},3:{cellWidth:34,halign:'right'},4:{cellWidth:34,halign:'right'}}})
 return {y:endY(d)+6,sub:its.length?sub:Number(r.amount||0)}}
const save=(d:jsPDF,name:string)=>{footer(d);d.save(name.replace(/[^\w.-]+/g,'_')+'.pdf')}

const CLAUSES:{h:string;p?:string[];b?:string[]}[]=[
 {h:'3. Service schedule and access',p:['Start date: ____________________   Frequency: ____________________   Service days / hours: ____________________','The Client will provide agreed access, water, electricity, parking and site permissions. The Client will identify restricted areas, fragile items, sensitive equipment, alarms and site-specific safety procedures before work begins.']},
 {h:'4. Fees and payment',p:['Billing frequency: ____________________   Deposit, if applicable: MWK ____________________   Balance due: ____________________','Invoices are payable within ______ calendar days of issue unless another written arrangement is stated in the quotation. Any late-payment charge must be expressly agreed in writing and comply with applicable law. Shine Pro will not add undisclosed charges.']},
 {h:'5. Client responsibilities',b:['Provide accurate information about the property, condition and requested cleaning tasks.','Secure cash, valuables, confidential records and fragile items before the service.','Disclose known hazards, hazardous substances, pest problems, damaged surfaces and sensitive equipment.','Ensure the work area is reasonably safe and accessible.','Appoint a contact person to provide access and confirm completion where required.']},
 {h:'6. Shine Pro responsibilities',b:['Provide the agreed cleaning service with reasonable care and skill.','Use suitable cleaning methods and products for the agreed surfaces, based on information available.','Ensure team members follow reasonable site rules and safety instructions communicated in advance.','Notify the Client promptly of access problems, incidents or conditions that prevent safe completion.','Keep client information confidential and use it only for service delivery and administration.']},
 {h:'7. Changes, cancellations and rescheduling',p:["Changes to scope, timing or frequency must be agreed in writing. The Client should give at least ______ hours' notice to cancel or reschedule. Any cancellation fee must be stated here and accepted before booking: ____________________________.",'If Shine Pro cannot attend due to an operational issue, it will notify the Client and propose a reasonable alternative date or other agreed solution.']},
 {h:'8. Quality concerns and re-cleaning',p:['The Client should report any concern about work completed within ______ hours of service completion, with details of the affected area. Where a task within the agreed scope has not been completed to a reasonable standard, Shine Pro will assess the concern and, where appropriate, arrange a reasonable correction or re-clean within an agreed time.']},
 {h:'9. Exclusions and limitations',b:['Shine Pro does not provide repairs, machinery servicing, pest control, specialist restoration or hazardous-waste handling under a standard cleaning booking.','Staff will not operate, dismantle or enter machinery or equipment unless a separate competent and authorised arrangement is made.','High-level work, work at height, biohazards, chemical hazards and heavy construction waste require separate assessment and written agreement, and may be declined.','The Client must disclose pre-existing damage and delicate or incompatible surfaces. Shine Pro may decline work that cannot be performed safely.']},
 {h:'10. Term and termination',p:["This agreement begins on ____________________ and continues until ____________________ / on a rolling basis until terminated. Either party may terminate by giving ______ days' written notice. Either party may terminate immediately where the other commits a serious breach and, where capable of remedy, fails to remedy it within a reasonable written notice period. The Client remains responsible for approved services already delivered and agreed costs properly incurred up to termination."]},
 {h:'11. Complaints and dispute resolution',p:['The parties will first attempt to resolve any dispute through good-faith discussion between their nominated contacts. If unresolved, either party may pursue remedies available under the laws of Malawi.']},
 {h:'12. General',p:['This agreement, its accepted quotation and any written variations form the agreement between the parties for the services described. Any amendment must be in writing and accepted by both parties. If a provision is unenforceable, the remaining provisions continue to apply to the extent permitted by law.']}]

export function docPdf(r:any,c:Client={}){
 const d=new jsPDF();const k=String(r.kind||'invoice');const no=r.number||'-';const cn=c.name||'-'
 const who:[string,string][]=[['Client / business name',cn],['Contact person',c.representative||'-'],['Phone',c.phone||'-']]
 let y:number
 if(k==='quotation'){
  y=brandHeader(d,'CLEANING SERVICE QUOTATION');y=meta(d,y+1,[['QUOTE NO.:',no],['DATE:',dmy(r.created_at)],['VALID UNTIL:',dmy(r.due_date)]])
  y=section(d,y+3,'Prepared for');y=grid(d,y,who)
  y=grid(d,y-1,[['Service address / location',c.address||'-'],['Status',cap(String(r.status||'draft'))],['Valid until',dmy(r.due_date)]])
  y=section(d,y+2,'Scope of work and pricing');const it=items(d,y,r,'No.');y=totalBar(d,it.y,'TOTAL QUOTED (MWK)',r.amount,it.sub)
  if(r.details){y=section(d,y,'Included tasks, assumptions and payment terms');y=para(d,y+5,String(r.details))}
  y=note(d,y,'Quotation notes: This quotation is based on the scope and property information stated above. Any additional work, material change in site condition or variation in scope must be approved and may require a revised quotation. Work will be scheduled after written acceptance and any agreed deposit.')
  y=section(d,y,'Acceptance');y=para(d,y+5,'I accept the scope, price and terms stated in this quotation.');y=sign(d,y,['Client name','Client signature','Date']);y=sign(d,y,['For Shine Pro: authorised name','Signature','Date'])
  para(d,y,`Questions or booking confirmation: Call / WhatsApp ${PHONE}.`)
 }else if(k==='receipt'){
  y=brandHeader(d,'OFFICIAL PAYMENT RECEIPT');y=meta(d,y+1,[['RECEIPT NO.:',no],['DATE RECEIVED:',dmy(r.created_at)]])
  y=section(d,y+3,'Received from');y=grid(d,y,who)
  y=section(d,y+2,'Payment details');y=grid(d,y,[['Amount received (MWK)',num(r.amount)],['Amount in words',inWords(Number(r.amount||0))],['Payment method',r.payment_method||'-']])
  y=grid(d,y-1,[['Payment reference / invoice number',r.reference||'-'],['Status',cap(String(r.status||''))]])
  y=section(d,y+2,'Payment received for:')
  if((r.items||[]).length){const it=items(d,y+3,r,'No.');y=it.y}else y=para(d,y+6,String(r.details||'Cleaning services'))
  y=totalBar(d,y+2,'AMOUNT RECEIVED (MWK)',r.amount)
  y=section(d,y,'Acknowledgement');y=para(d,y+5,'Received by Shine Pro Cleaning Services.');y=sign(d,y,['Received by (name)','Signature','Date'])
  note(d,y+2,'This receipt confirms that the amount stated above has been received. It does not by itself confirm that all services have been completed unless expressly stated.')
 }else if(k==='contract'){
  y=brandHeader(d,'CLEANING SERVICE AGREEMENT');y=meta(d,y+1,[['Agreement reference:',no],['Date:',dmy(r.created_at)]])
  y=para(d,y+2,'This agreement is made between Shine Pro Cleaning Services (the “Service Provider”) and the client identified below (the “Client”). Complete all applicable fields and attach the accepted quotation as a schedule to this agreement.')
  y=section(d,y+2,'1. Parties and service location');y=grid(d,y,[['Client / legal business name',cn],['Contact person',c.representative||'-'],['Client phone',c.phone||'-']])
  y=grid(d,y-1,[['Billing address',c.address||'-'],['Service location',c.address||'-'],['Contract price / rate',money(r.amount)]])
  y=section(d,y+2,'2. Services and scope');y=para(d,y+5,'The exact tasks, areas, frequency, equipment responsibilities and exclusions are those set out in the accepted quotation or attached scope of work. No additional task is included unless agreed in writing.')
  if(r.details)y=para(d,y,String(r.details),{bold:true})
  for(const cl of CLAUSES){y=section(d,y+1,cl.h);y+=5;if(cl.p)for(const p of cl.p)y=para(d,y,p);if(cl.b)y=bullets(d,y,cl.b)}
  y=note(d,y,'This is a practical business template, not a substitute for legal advice. Have a Malawi-qualified legal professional review it before using it for significant or recurring contracts.')
  y=section(d,y,'13. Signatures');y=sign(d,y+4,['For the Client: name and position','Signature','Date']);y=sign(d,y,['For Shine Pro: authorised name and position','Signature','Date'])
  para(d,y,`Shine Pro contact: ${PHONE}`)
 }else{
  y=brandHeader(d,'INVOICE');y=meta(d,y+1,[['INVOICE NO.:',no],['ISSUE DATE:',dmy(r.created_at)],['DUE DATE:',dmy(r.due_date)]])
  y=section(d,y+3,'Bill to');y=grid(d,y,who)
  y=grid(d,y-1,[['Billing address',c.address||'-'],['Status',cap(String(r.status||'draft'))],['Quotation / job reference',r.reference||'-']])
  y=section(d,y+2,'Description of services');const it=items(d,y,r,'Date');y=totalBar(d,it.y,'AMOUNT DUE (MWK)',r.amount,it.sub)
  y=section(d,y,'Payment details');y=para(d,y+6,`Payment method: ${r.payment_method||'____________________'}`);y=para(d,y,`Payment reference: please use ${no}`);if(r.details)y=para(d,y,`Payment terms / notes: ${r.details}`)
  y=note(d,y+1,'Please use the invoice number as your payment reference. This template is not a tax invoice unless Shine Pro is legally entitled and properly registered to issue one. Confirm applicable tax-invoice requirements before use.')
  y=sign(d,y,['Prepared by','Authorised signature']);para(d,y,`Thank you for choosing Shine Pro. Enquiries: ${PHONE}`)}
 save(d,no)}

// One payslip for one payroll row. staff = row from the staff table.
export function payslipPdf(p:any,s:{full_name?:string;position?:string;phone?:string;daily_rate?:number}={}){
 const d=new jsPDF();let y=brandHeader(d,'PAYSLIP');y=meta(d,y+1,[['PAYSLIP NO.:',p.number||'-'],['PERIOD:',String(p.period||'-')],['STATUS:',p.paid?'PAID':'UNPAID']])
 y=section(d,y+3,'Employee');y=grid(d,y,[['Name',s.full_name||'-'],['Position',s.position||'Ground worker'],['Phone',s.phone||'-']])
 y=section(d,y+2,'Earnings');const rate=Number(s.daily_rate||0),days=rate?Math.round(Number(p.amount||0)/rate*100)/100:0
 autoTable(d,{...tableStyle,startY:y,head:[['Description','Days worked','Daily rate (MWK)','Amount (MWK)']],body:[['Attendance pay for period',rate?String(days):'-',rate?num(rate):'-',num(p.amount)]],columnStyles:{1:{halign:'center'},2:{halign:'right'},3:{halign:'right'}}})
 y=totalBar(d,endY(d)+6,'NET PAY (MWK)',p.amount)
 y=sign(d,y+4,['Employee signature','Date']);y=sign(d,y,['Authorised by (Shine Pro)','Date'])
 para(d,y,'Please keep this payslip for your records.');save(d,p.number||'payslip')}

// Payroll register for the rows currently shown.
export function payrollRegisterPdf(rows:any[],names:Record<string,string>){
 const d=new jsPDF({orientation:'landscape'});const W=d.internal.pageSize.getWidth();let y=brandHeader(d,'PAYROLL REGISTER',`Generated ${dmy(new Date().toISOString())}`)
 const total=rows.reduce((s,r)=>s+Number(r.amount||0),0),paid=rows.filter(r=>r.paid).reduce((s,r)=>s+Number(r.amount||0),0)
 autoTable(d,{...tableStyle,startY:y+1,head:[['Payslip no.','Ground worker','Period','Amount (MWK)','Status']],
  body:rows.map(r=>[r.number||'-',names[r.staff_id]||'-',r.period||'-',num(r.amount),r.paid?'Paid':'Unpaid']),
  foot:[['','','Total',num(total),`Paid: ${num(paid)}`]],footStyles:{fillColor:LIGHT,textColor:NAVY,fontStyle:'bold'},columnStyles:{3:{halign:'right'}},margin:{left:14,right:14}})
 sign(d,endY(d)+10,['Prepared by','Approved by (Admin)']);void W;save(d,'Shine-Pro-Payroll-Register')}

// Generic branded list/report export (used by module PDFs and reports).
export function listPdf(title:string,head:string[],body:any[][],file:string,foot?:any[][]){
 const d=new jsPDF({orientation:'landscape'});const y=brandHeader(d,title,`Generated ${dmy(new Date().toISOString())}`)
 autoTable(d,{...tableStyle,startY:y+1,head:[head],body,foot,footStyles:{fillColor:LIGHT,textColor:NAVY,fontStyle:'bold'},styles:{...tableStyle.styles,fontSize:8}});save(d,file)}
