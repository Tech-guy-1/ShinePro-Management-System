import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
export function docPdf(r:any,client:string){
 const d=new jsPDF();d.setFillColor(14,165,233);d.rect(0,0,210,32,'F')
 d.setTextColor(255,255,255);d.setFontSize(22);d.text('SHINE PRO',14,20);d.setFontSize(12);d.text(String(r.kind??'').toUpperCase(),196,20,{align:'right'})
 d.setTextColor(12,74,110);d.setFontSize(11)
 d.text(`No: ${r.number??'-'}`,14,45);d.text(`Date: ${String(r.created_at??'').slice(0,10)}`,14,52);d.text(`Client: ${client||'-'}`,14,59);d.text(`Status: ${r.status??''}`,14,66)
 const its:any[]=r.items||[];const body=its.length?its.map(x=>[x.desc,x.qty,Number(x.price||0).toFixed(2),(Number(x.qty||0)*Number(x.price||0)).toFixed(2)]):[[r.details||r.kind,1,Number(r.amount||0).toFixed(2),Number(r.amount||0).toFixed(2)]]
 autoTable(d,{startY:76,head:[['Description','Qty','Unit price','Amount']],body,headStyles:{fillColor:[14,165,233]},columnStyles:{1:{halign:'right'},2:{halign:'right'},3:{halign:'right'}}})
 const y=(d as any).lastAutoTable.finalY+10;d.setFontSize(13);d.text(`Total: ${Number(r.amount||0).toFixed(2)}`,196,y,{align:'right'})
 if(r.details&&its.length){d.setFontSize(10);d.text(String(r.details),14,y+12,{maxWidth:180})}
 if(r.kind==='contract'){d.setFontSize(10);d.text('Client signature: ____________________      Shine Pro: ____________________',14,y+30)}
 d.setFontSize(9);d.setTextColor(14,165,233);d.text('Thank you for choosing Shine Pro.',105,285,{align:'center'});d.save(`${r.kind}-${r.number||r.id}.pdf`)}
