export type Field={name:string;label:string;type?:string;ref?:{table:string;col:string};options?:string[]}
export type Mod={key:string;label:string;table:string;fields:Field[];cols?:string[];adminOnly?:boolean;readOnly?:boolean}
const cl:Field={name:'client_id',label:'Client',ref:{table:'clients',col:'name'}}
const st:Field={name:'staff_id',label:'Ground worker',ref:{table:'staff',col:'full_name'}}
export const CATEGORIES=[{v:'detergents',l:'Detergents'},{v:'uniforms',l:'Uniforms'},{v:'materials',l:'Materials'}]
// Suggested item names per category (shown as typing suggestions in the inventory form)
export const SUGGEST:Record<string,string[]>={
 detergents:['All-purpose cleaner','Floor cleaner','Glass cleaner','Bleach','Toilet bowl cleaner','Disinfectant','Dishwashing liquid','Laundry powder','Fabric softener','Carpet shampoo','Degreaser','Air freshener'],
 uniforms:['Shine Pro overalls','Shine Pro branded T-shirt','Work boots','Rubber gloves','Apron','Cap','Face mask','Safety goggles','Raincoat'],
 materials:['Bucket','Mop','Mop head (refill)','Broom','Dustpan & brush','Microfibre cloths','Squeegee','Scrubbing brush','Spray bottle','Sponges','Vacuum cleaner','Toilet brush','Refuse bags','Wet floor sign','Extension pole']}
export const MODULES:Mod[]=[
{key:'clients',label:'Clients',table:'clients',cols:['name','representative','phone','address','created_at'],fields:[{name:'name',label:'Name'},{name:'representative',label:'Representative'},{name:'phone',label:'Phone'},{name:'address',label:'Address'}]},
{key:'jobs',label:'Jobs & Checklists',table:'jobs',fields:[{name:'title',label:'Title'},cl,{name:'status',label:'Status',options:['scheduled','in progress','done','cancelled']},{name:'scheduled_date',label:'Date',type:'date'},{name:'amount',label:'Amount',type:'number'},{name:'checklist',label:'Checklist (one item per line)'}]},
{key:'staff',label:'Ground Workers',table:'staff',fields:[{name:'full_name',label:'Full name'},{name:'phone',label:'Phone'},{name:'position',label:'Position'},{name:'daily_rate',label:'Daily rate',type:'number'}]},
{key:'attendance',label:'Attendance',table:'attendance',fields:[st,{name:'work_date',label:'Date',type:'date'},{name:'present',label:'Present',options:['true','false']}]},
{key:'expenses',label:'Expenses',table:'expenses',fields:[{name:'description',label:'Description'},{name:'category',label:'Category'},{name:'amount',label:'Amount',type:'number'},{name:'spent_on',label:'Date',type:'date'}]},
{key:'inventory',label:'Inventory',table:'inventory',cols:['item','category','quantity','created_at'],fields:[{name:'item',label:'Name'},{name:'category',label:'Category',options:CATEGORIES.map(c=>c.v)},{name:'quantity',label:'Quantity',type:'number'}]},
{key:'documents',label:'Quotes, Invoices, Receipts, Contracts',table:'documents',cols:['number','kind','client_id','amount','status','due_date','created_at'],fields:[{name:'kind',label:'Kind',options:['quotation','invoice','receipt','contract']},cl,{name:'amount',label:'Amount',type:'number'},{name:'status',label:'Status',options:['draft','sent','paid','cancelled']},{name:'due_date',label:'Due / valid until',type:'date'},{name:'payment_method',label:'Payment method',options:['Cash','Mobile money','Bank transfer','Cheque']},{name:'reference',label:'Payment ref / invoice no.'},{name:'details',label:'Details / terms'}]},
{key:'payroll',label:'Payroll',table:'payroll',adminOnly:true,cols:['number','staff_id','period','amount','paid','created_at'],fields:[st,{name:'period',label:'Period'},{name:'amount',label:'Amount',type:'number'}]},
{key:'users',label:'Users & Approvals',table:'profiles',adminOnly:true,readOnly:true,cols:['full_name','phone','role','status','created_at'],fields:[]},
{key:'audit',label:'Audit Logs',table:'audit_logs',adminOnly:true,readOnly:true,fields:[]}]
