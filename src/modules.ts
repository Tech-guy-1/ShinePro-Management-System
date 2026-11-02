export type Field={name:string;label:string;type?:string;ref?:{table:string;col:string};options?:string[]}
export type Mod={key:string;label:string;table:string;fields:Field[];adminOnly?:boolean;readOnly?:boolean}
const cl:Field={name:'client_id',label:'Client',ref:{table:'clients',col:'name'}}
const st:Field={name:'staff_id',label:'Staff',ref:{table:'staff',col:'full_name'}}
export const MODULES:Mod[]=[
{key:'clients',label:'Clients',table:'clients',fields:[{name:'name',label:'Name'},{name:'phone',label:'Phone'},{name:'address',label:'Address'}]},
{key:'jobs',label:'Jobs & Checklists',table:'jobs',fields:[{name:'title',label:'Title'},cl,{name:'status',label:'Status',options:['scheduled','in progress','done','cancelled']},{name:'scheduled_date',label:'Date',type:'date'},{name:'amount',label:'Amount',type:'number'},{name:'checklist',label:'Checklist (one item per line)'}]},
{key:'staff',label:'Staff',table:'staff',fields:[{name:'full_name',label:'Full name'},{name:'phone',label:'Phone'},{name:'position',label:'Position'},{name:'daily_rate',label:'Daily rate',type:'number'}]},
{key:'attendance',label:'Attendance',table:'attendance',fields:[st,{name:'work_date',label:'Date',type:'date'},{name:'present',label:'Present',options:['true','false']}]},
{key:'expenses',label:'Expenses',table:'expenses',fields:[{name:'description',label:'Description'},{name:'category',label:'Category'},{name:'amount',label:'Amount',type:'number'},{name:'spent_on',label:'Date',type:'date'}]},
{key:'inventory',label:'Supplies & Equipment',table:'inventory',fields:[{name:'item',label:'Item'},{name:'kind',label:'Kind',options:['supply','equipment']},{name:'quantity',label:'Qty',type:'number'},{name:'min_level',label:'Min level',type:'number'}]},
{key:'documents',label:'Quotes, Invoices, Receipts, Contracts',table:'documents',fields:[{name:'kind',label:'Kind',options:['quotation','invoice','receipt','contract']},{name:'number',label:'Number'},cl,{name:'amount',label:'Amount',type:'number'},{name:'status',label:'Status',options:['draft','sent','paid','cancelled']},{name:'details',label:'Details / terms'}]},
{key:'payroll',label:'Payroll',table:'payroll',adminOnly:true,fields:[st,{name:'period',label:'Period'},{name:'amount',label:'Amount',type:'number'}]},
{key:'users',label:'Users & Approvals',table:'profiles',adminOnly:true,readOnly:true,fields:[]},
{key:'audit',label:'Audit Logs',table:'audit_logs',adminOnly:true,readOnly:true,fields:[]}]
