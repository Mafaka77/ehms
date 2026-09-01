import{E as e,G as t,I as n,N as r,O as i,X as a,_t as o,c as s,d as c,h as l,ht as u,i as d,l as f,m as p,p as m,s as h,t as g,u as _,w as v}from"./api-DtA5Tz69.js";import{m as y,n as b,p as x,s as S}from"./index-nIC9GkLM.js";import{t as C}from"./ipdAdmissionStore-Dz22tOwM.js";import{t as w}from"./Invoice-COd8wbZA.js";var T={class:`h-full flex flex-col bg-white`},E={class:`p-5 px-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4`},D={class:`flex items-center gap-3.5`},O={class:`w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm shrink-0`},k={class:`flex items-center gap-2`},A={class:`text-lg font-black text-slate-800 tracking-tight`},j={class:`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200`},M={class:`text-xs font-semibold text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5`},N={class:`text-slate-700 font-mono`},ee={key:0},P={class:`text-slate-700 font-mono`},F={key:1},te={class:`text-indigo-600`},ne={class:`flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end`},re=[`disabled`],ie={key:0,class:`animate-spin h-4 w-4 text-white`,xmlns:`http://www.w3.org/2000/svg`,fill:`none`,viewBox:`0 0 24 24`},ae={key:1,class:`w-4 h-4 text-white`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`},oe=[`disabled`],se={key:0,class:`animate-spin h-4 w-4 text-indigo-600`,xmlns:`http://www.w3.org/2000/svg`,fill:`none`,viewBox:`0 0 24 24`},ce={key:1,class:`w-4 h-4 text-rose-500`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`},le={class:`bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-2xs`},ue={class:`text-xs`},de={class:`font-bold font-mono text-sm text-emerald-900`},fe={class:`flex-1 overflow-y-auto p-6 bg-slate-50/60 space-y-4`},pe={key:0,class:`flex flex-col items-center justify-center py-16 text-slate-400 space-y-2`},me={key:1,class:`text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs`},he={key:2,class:`space-y-4`},ge={class:`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100`},_e={class:`flex items-center gap-2`},ve={class:`font-black font-mono text-indigo-600 text-lg mt-0.5`},ye={class:`text-xs text-slate-400 mt-0.5`},be={class:`flex items-center gap-2 self-end sm:self-center`},xe=[`onClick`,`disabled`],Se=[`onClick`],Ce={class:`grid grid-cols-3 gap-4 pt-4 text-xs`},we={class:`bg-slate-50 p-3 rounded-xl border border-slate-100`},Te={class:`font-mono font-black text-slate-900 text-base`},Ee={class:`bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/80`},De={class:`font-mono font-black text-emerald-700 text-base`},Oe={class:`bg-rose-50/50 p-3 rounded-xl border border-rose-100/80`},ke={class:`font-mono font-black text-rose-700 text-base`},Ae={key:0,class:`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200`},je={class:`bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200`},Me={class:`px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between`},Ne={class:`text-xs text-slate-400 mt-0.5`},Pe={class:`font-mono font-bold text-slate-700`},Fe={class:`p-6 space-y-4 text-xs`},Ie={key:0,class:`p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-2`},Le={class:`flex justify-between items-center text-xs`},Re={class:`text-emerald-700 font-mono font-bold`},ze={class:`relative`},Be={class:`pt-2`},Ve={class:`relative`},He={key:1},Ue={key:2},We={class:`px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3`},Ge=[`disabled`],Ke={key:0,class:`animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full`},I={__name:`View`,props:{admission:{type:Object,required:!0}},emits:[`payment-success`],setup(a,{emit:f}){let v=a,I=f,L=S(),R=C(),z=t(!1),B=t([]),V=t([]),H=h(()=>V.value.reduce((e,t)=>e+t.amount,0)),U=async()=>{if(v.admission?._id){z.value=!0;try{let[e,t]=await Promise.all([R.fetchAdmissionBills(v.admission._id),R.fetchAdmissionAdvances(v.admission._id)]);e.success&&(B.value=e.data),t.success&&(V.value=t.data)}catch(e){console.error(`Error fetching IPD payment details:`,e)}finally{z.value=!1}}};r(()=>v.admission,U,{immediate:!0});let W=t(!1),G=t(!1),K=t(null),q=t({deductDeposit:0,amount:0,paymentMode:`CASH`,transactionNo:``,remarks:``}),J=e=>{K.value=e,q.value={deductDeposit:0,amount:e.balanceAmount,paymentMode:`CASH`,transactionNo:``,remarks:``},W.value=!0},qe=()=>{let e=Number(q.value.deductDeposit)||0,t=H.value,n=K.value?.balanceAmount||0;e>t&&(e=t),e>n&&(e=n),q.value.deductDeposit=e,q.value.amount=Math.max(0,n-e)},Je=async()=>{let e=Number(q.value.deductDeposit)||0,t=Number(q.value.amount)||0;if(e===0&&t<=0){L.show({message:`Please enter a valid payment amount`,type:`error`});return}G.value=!0;try{e>0&&await g.post(`/billing/bills/${K.value._id}/pay`,{amount:e,paymentMode:`ADVANCE_DEPOSIT`,remarks:`Deducted from IPD Advance Deposit`}),t>0&&await g.post(`/billing/bills/${K.value._id}/pay`,{amount:t,paymentMode:q.value.paymentMode,transactionNo:q.value.transactionNo,remarks:q.value.remarks}),L.show({message:`Payment processed successfully`,type:`success`}),W.value=!1,I(`payment-success`),U()}catch(e){console.error(`Error processing payment:`,e),L.show({message:e.response?.data?.message||`Failed to process payment`,type:`error`})}finally{G.value=!1}},Ye=e=>e?new Date(e).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`,hour:`2-digit`,minute:`2-digit`}):`-`,Y=e=>{switch(e){case`MUHCS`:return`MUHCS`;case`MR_STATE`:return`MR (STATE)`;case`MR_CENTRAL`:return`MR (CENTRAL)`;case`HEALTH_INSURANCE`:return`HEALTH INSURANCE`;default:return e||`NORMAL`}},X=e=>{if(e===0||!e)return`Zero Rupees Only`;let t=[``,`One `,`Two `,`Three `,`Four `,`Five `,`Six `,`Seven `,`Eight `,`Nine `,`Ten `,`Eleven `,`Twelve `,`Thirteen `,`Fourteen `,`Fifteen `,`Sixteen `,`Seventeen `,`Eighteen `,`Nineteen `],n=[``,``,`Twenty`,`Thirty`,`Forty`,`Fifty`,`Sixty`,`Seventy`,`Eighty`,`Ninety`],r=e=>{if((e=e.toString()).length>9)return`overflow`;if(e=(`000000000`+e).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/),!e)return``;let r=``;return r+=e[1]==0?``:(t[Number(e[1])]||n[e[1][0]]+` `+t[e[1][1]])+`Crore `,r+=e[2]==0?``:(t[Number(e[2])]||n[e[2][0]]+` `+t[e[2][1]])+`Lakh `,r+=e[3]==0?``:(t[Number(e[3])]||n[e[3][0]]+` `+t[e[3][1]])+`Thousand `,r+=e[4]==0?``:(t[Number(e[4])]||n[e[4][0]]+` `+t[e[4][1]])+`Hundred `,r+=e[5]==0?``:(r==``?``:`and `)+(t[Number(e[5])]||n[e[5][0]]+` `+t[e[5][1]]),r.trim()},i=Math.floor(Math.abs(e)),a=Math.round((Math.abs(e)-i)*100),o=r(i)+` Rupees`;return a>0&&(o+=` and `+r(a)+` Paise`),o+` Only`},Z=t(!1),Q=t(!1),Xe=async e=>{if(e?._id){Z.value=!0;try{let[t,n,r]=await Promise.all([g.get(`/billing/bills/${e._id}`),R.fetchChargeCategories(),R.fetchAdmissionCharges(v.admission._id)]),i=t.data.data,a=n.success?n.data:[],o=r.success?r.data:[],s=v.admission.patientId||i.patientId||{},c=v.admission||{},l=e=>{let t=e.chargeCategoryId;if(t&&typeof t==`object`&&t.name)return{id:String(t._id||t.code||t.name),name:t.name,code:(t.code||``).toUpperCase()};if(t){let e=a.find(e=>String(e._id)===String(t));if(e)return{id:String(e._id),name:e.name,code:(e.code||``).toUpperCase()}}let n=(e.chargeType||e.itemType||``).toUpperCase();if(n){let e=a.find(e=>(e.code||``).toUpperCase()===n||e.name.toLowerCase()===n.toLowerCase());return e?{id:String(e._id),name:e.name,code:(e.code||``).toUpperCase()}:n===`ROOM`||n===`ROOM_RENT`||n===`BED`?{id:`ROOM`,name:`Room Rent`,code:`ROOM`}:n===`DOCTOR_VISIT`||n===`CONSULTATION`||n===`DOCTOR`?{id:`DOCTOR`,name:`Doctor Visit`,code:`DOCTOR`}:n===`PHARMACY`||n===`MEDICINE`?{id:`PHARMACY`,name:`Pharmacy`,code:`PHARMACY`}:n===`LAB`||n===`LABORATORY`?{id:`LAB`,name:`Laboratory`,code:`LAB`}:n===`RADIOLOGY`?{id:`RADIOLOGY`,name:`Radiology`,code:`RADIOLOGY`}:n===`NURSING`?{id:`NURSING`,name:`Nursing Charges`,code:`NURSING`}:n===`OT`||n===`SURGERY`||n===`OPERATION`?{id:`OT`,name:`Operation Theatre`,code:`OT`}:n===`PROCEDURE`?{id:`PROCEDURE`,name:`Procedures`,code:`PROCEDURE`}:{id:n,name:n.replace(/_/g,` `).replace(/\b\w/g,e=>e.toUpperCase()),code:n}}return{id:`OTHER`,name:`Other Medications/Test`,code:`OTHER`}},u=new Map;(i.items||[]).forEach(e=>{let t=l(o.find(t=>String(t._id)===String(e.patientChargeId||e._id))||e);u.has(t.id)||u.set(t.id,{id:t.id,code:t.code,name:t.name,items:[],totalAmount:0,totalQty:0});let n=u.get(t.id);n.items.push(e),n.totalAmount+=e.amount||0,n.totalQty+=e.quantity||1});let d=[],f=1;u.forEach(e=>{let t=e.code,n=e.name.toLowerCase(),r=t===`PHARMACY`||n.includes(`pharmacy`)||n.includes(`medicine`)||n.includes(`drug`),i=t===`ROOM`||t===`ROOM_RENT`||t===`BED`||n.includes(`room`)||n.includes(`bed`),a=t===`DOCTOR`||t===`DOCTOR_VISIT`||n.includes(`doctor`)||n.includes(`consult`),o=t===`LAB`||t===`LABORATORY`||n.includes(`lab`),s=t===`RADIOLOGY`||n.includes(`radiology`)||n.includes(`x-ray`)||n.includes(`usg`)||n.includes(`scan`),c=t===`OT`||n.includes(`operation`)||n.includes(`surgery`)||n.includes(`theatre`),l=t===`NURSING`||n.includes(`nursing`),u=`Items`;i?u=e.totalQty===1?`Day`:`Days`:a?u=e.totalQty===1?`Visit`:`Visits`:r?u=e.totalQty===1?`Item`:`Items`:o?u=e.totalQty===1?`Test`:`Tests`:s?u=e.totalQty===1?`Scan`:`Scans`:c?u=e.totalQty===1?`Proc`:`Procedures`:l&&(u=e.totalQty===1?`Item`:`Items`),d.push({sn:f++,categoryName:e.name,qty:`${e.totalQty} ${u}`,amount:e.totalAmount})});let p=i.netAmount??i.totalAmount??d.reduce((e,t)=>e+t.amount,0),m=(i.status||`DUE`).toUpperCase(),h=`status-due`;m===`PAID`?h=`status-paid`:m===`PARTIALLY_PAID`?(m=`PARTIALLY PAID`,h=`status-partial`):(m===`DRAFT`||m===`UNPAID`)&&(m=`DUE`,h=`status-due`);let _=`
      <!DOCTYPE html>
      <html>
        <head>
          <title>IPD Invoice - ${i.billNo||`Bill`}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm 15mm; }
            body { font-family: ui-mono, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace, 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 11px; line-height: 1.4; }
            .receipt-header { text-align: center; margin-bottom: 12px; }
            .receipt-divider { border: 0; border-top: 1px dashed #cbd5e1; margin: 8px 0; }
            .receipt-header h2 { font-size: 12px; font-weight: bold; letter-spacing: 0.05em; color: #1e293b; margin: 4px 0 0 0; }
            
            .status-due { background: #fef2f2; color: #dc2626; border: 1.5px solid #f87171; font-weight: 900; font-size: 10.5px; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase; }
            .status-paid { background: #dcfce7; color: #15803d; border: 1.5px solid #22c55e; font-weight: 900; font-size: 10.5px; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase; }
            .status-partial { background: #fef3c7; color: #b45309; border: 1.5px solid #f59e0b; font-weight: 900; font-size: 10.5px; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase; }
            
            .demo-grid { width: 100%; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; padding: 8px 10px; margin-bottom: 14px; font-size: 10.5px; border-collapse: collapse; }
            .demo-grid td { padding: 4px 6px; vertical-align: top; }
            .label { font-weight: 700; color: #475569; text-transform: uppercase; font-size: 9px; }
            .val { font-weight: 600; color: #0f172a; }
            .font-mono { font-family: monospace; font-weight: bold; }

            table.bill-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 11px; }
            table.bill-table th { background: #1e3a8a; color: #ffffff; text-align: left; padding: 7px 10px; font-weight: 700; text-transform: uppercase; font-size: 10px; }
            table.bill-table td { border-bottom: 1px solid #e2e8f0; padding: 7px 10px; color: #1e293b; }
            table.bill-table tr:nth-child(even) { background-color: #f8fafc; }
            table.bill-table tr.grand-total-row td { background: #f1f5f9; padding: 8px 10px; border-top: 2px solid #1e3a8a; border-bottom: 2px solid #1e3a8a; font-weight: 800; }
            
            .text-right { text-align: right; }
            .text-center { text-align: center; }

            .in-words-box { background: #f8fafc; border: 1px dashed #cbd5e1; padding: 8px 12px; border-radius: 6px; font-size: 11px; margin-bottom: 14px; }

            .footer { margin-top: 40px; display: flex; justify-content: flex-end; align-items: flex-end; font-size: 10.5px; color: #475569; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 200px; }
            .sig-line { border-top: 1.5px solid #334155; margin-top: 45px; padding-top: 5px; font-weight: 700; color: #0f172a; }
          </style>
        </head>
        <body>
          <!-- Header Brand (From Invoice.vue) -->
          <div class="receipt-header">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <img src="${b}" alt="Logo" style="height: 60px; width: auto; object-fit: contain;" />
              <div style="text-align: right; font-size: 10.5px; color: #64748b; line-height: 1.35;">
                <p style="margin: 0; font-weight: 800; color: #0f172a; font-size: 11.5px; letter-spacing: 0.2px;">EMMANUEL HOSPITAL</p>
                <p style="margin: 0;">Y-67, Luangmual, Aizawl, Mizoram - 796009</p>
                <p style="margin: 0;">Phone: 0389-2913340 / 8974326872</p>
              </div>
            </div>
            <hr class="receipt-divider" />
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; margin-bottom: 4px;">
              <h2 style="font-size: 12px; font-weight: 800; letter-spacing: 0.05em; color: #1e293b; margin: 0; text-transform: uppercase;">
                IPD BILL / INVOICE
              </h2>
              <div style="font-size: 10px; color: #64748b;">
                Date: <strong>${new Date(i.generatedAt||i.createdAt||Date.now()).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`})}</strong>
                <span class="${h}" style="margin-left: 8px;">${m}</span>
              </div>
            </div>
          </div>

          <table class="demo-grid">
            <tr>
              <td style="width: 25%;">
                <span class="label">Patient Name</span><br>
                <span class="val" style="font-size: 12px; color: #1e3a8a;">${s.fullName||`-`}</span>
              </td>
              <td style="width: 25%;">
                <span class="label">MRN / Patient ID</span><br>
                <span class="val font-mono">${s.mrn||s.patientCode||`-`}</span>
              </td>
              <td style="width: 25%;">
                <span class="label">IPD Admission No</span><br>
                <span class="val font-mono">${c.admissionNo||`-`}</span>
              </td>
              <td style="width: 25%;">
                <span class="label">Payer Type</span><br>
                <span class="val font-mono" style="font-weight: 800; color: #1e3a8a;">${Y(c.payerType)}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="label">Age / Gender / Mobile</span><br>
                <span class="val">${s.age||`-`} Yrs / ${s.gender||`-`} / ${s.mobileNo||`-`}</span>
              </td>
              <td>
                <span class="label">Bed / Ward Location</span><br>
                <span class="val">${c.bedId?.bedNo||c.bedId?.bedNumber?`Bed `+(c.bedId.bedNo||c.bedId.bedNumber)+` (`+(c.bedId.wardId?.name||`Ward`)+`)`:`-`}</span>
              </td>
              <td>
                <span class="label">Consultant Doctor</span><br>
                <span class="val">${c.consultantDoctorId?.fullName||c.doctorId?.fullName||`-`}</span>
              </td>
              <td>
                <span class="label">Invoice / Bill No</span><br>
                <span class="val font-mono" style="color: #4338ca; font-weight: 700;">${i.billNo||`-`}</span>
              </td>
            </tr>
          </table>

          <!-- Category Summary Table -->
          <table class="bill-table">
            <thead>
              <tr>
                <th style="width: 8%; text-align: center;">#</th>
                <th style="width: 54%;">Charge Category</th>
                <th style="width: 18%; text-align: center;">Quantity / Duration</th>
                <th style="width: 20%; text-align: right;">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${d.length===0?`<tr><td colspan="4" class="text-center" style="padding: 15px;">No items recorded in this bill.</td></tr>`:d.map(e=>`
                  <tr>
                    <td class="text-center font-mono" style="color: #64748b;">${e.sn}</td>
                    <td style="padding-left: 12px; font-weight: 700; color: #0f172a; font-size: 11.5px;">${e.categoryName}</td>
                    <td class="text-center font-mono">${e.qty}</td>
                    <td class="text-right font-mono" style="font-weight: 800; font-size: 11.5px;">₹${e.amount.toFixed(2)}</td>
                  </tr>
                `).join(``)}
              <tr class="grand-total-row">
                <td colspan="3" class="text-right" style="text-transform: uppercase; font-weight: 800; font-size: 11px;">Total Bill${m===`DUE`?` (Total Due)`:``}:</td>
                <td class="text-right font-mono" style="font-size: 13px; color: #1e3a8a; font-weight: 900;">₹${p.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="in-words-box" style="margin-top: 14px;">
            <strong>Total Amount in Words:</strong> ${X(p)}
          </div>

          <div class="footer">
            <div class="sig-box">
              <div class="sig-line">Authorized Signatory</div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          <\/script>
        </body>
      </html>
    `,y=window.open(``,`_blank`);y.document.write(_),y.document.close()}catch(e){console.error(`Error printing invoice:`,e),L.show({message:`Failed to generate invoice print`,type:`error`})}finally{Z.value=!1}}},Ze=async()=>{if(v.admission?._id){Q.value=!0;try{let[e,t,n]=await Promise.all([R.fetchAdmissionCharges(v.admission._id),R.fetchAdmissionAdvances(v.admission._id),R.fetchAdmissionBills(v.admission._id)]),r=e.success?e.data:[],i=t.success?t.data:[],a=n.success?n.data:[],o=await Promise.all(a.map(async e=>{try{return(await g.get(`/billing/bills/${e._id}`)).data.data||e}catch{return e}})),s=r.reduce((e,t)=>{let n=t.amount||0,r=(t.addons||[]).reduce((e,t)=>e+(t.amount||0),0);return e+n+r},0),c=i.reduce((e,t)=>e+(t.amount||0),0),l=o.reduce((e,t)=>e+(t.netAmount||0),0),u=o.reduce((e,t)=>e+(t.paidAmount||0),0),d=o.reduce((e,t)=>e+(t.balanceAmount||0),0),f=v.admission.patientId||{},p=v.admission||{},m=`
      <!DOCTYPE html>
      <html>
        <head>
          <title>IPD Detailed Statement - ${f.fullName||`Patient`}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 15px; font-size: 11px; line-height: 1.4; }
            .header-table { width: 100%; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; margin-bottom: 12px; }
            .hospital-title { font-size: 20px; font-weight: 800; color: #4338ca; text-transform: uppercase; letter-spacing: 0.5px; }
            .sub-title { font-size: 11px; color: #64748b; font-weight: 600; }
            
            .demo-grid { width: 100%; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; padding: 10px; margin-bottom: 15px; font-size: 11px; }
            .demo-grid td { padding: 4px 8px; vertical-align: top; }
            .label { font-weight: 700; color: #475569; text-transform: uppercase; font-size: 9px; }
            .val { font-weight: 600; color: #0f172a; }

            .summary-box { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 15px; }
            .card { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 10px; border-radius: 6px; text-align: center; }
            .card-title { font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; }
            .card-val { font-size: 13px; font-weight: 800; color: #3730a3; margin-top: 2px; }

            .section-header { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #1e1b4b; background: #e0e7ff; padding: 6px 10px; border-radius: 6px; margin: 15px 0 8px 0; letter-spacing: 0.5px; }

            table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
            table.data-table th { background: #3730a3; color: #ffffff; text-align: left; padding: 6px 8px; font-weight: 700; text-transform: uppercase; font-size: 9px; }
            table.data-table td { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; color: #1e293b; }
            table.data-table tr:nth-child(even) { background-color: #f8fafc; }
            
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-mono { font-family: monospace; font-weight: bold; }
            .addon-tag { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 1px 5px; border-radius: 3px; font-size: 8.5px; font-weight: 600; margin-top: 2px; }
            .ot-tag { display: block; background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; padding: 3px 6px; border-radius: 4px; font-size: 8.5px; margin-top: 3px; }

            .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 170px; }
            .sig-line { border-top: 1px solid #475569; margin-top: 40px; padding-top: 4px; font-weight: 700; color: #0f172a; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="hospital-title">EMMANUEL HOSPITAL</div>
                <div class="sub-title">Detailed IPD Charges & Invoicing Statement</div>
              </td>
              <td class="text-right" style="font-size: 10px; color: #64748b;">
                Generated On: ${new Date().toLocaleString(`en-IN`)}<br>
                Status: <strong>${p.status||`ACTIVE`}</strong>
              </td>
            </tr>
          </table>

          <table class="demo-grid">
            <tr>
              <td style="width: 25%;">
                <span class="label">Patient Name</span><br>
                <span class="val" style="font-size: 12px; color: #4338ca;">${f.fullName||`-`}</span>
              </td>
              <td style="width: 25%;">
                <span class="label">MRN / Patient Code</span><br>
                <span class="val font-mono">${f.mrn||f.patientCode||`-`}</span>
              </td>
              <td style="width: 25%;">
                <span class="label">IPD Admission No</span><br>
                <span class="val font-mono">${p.admissionNo||`-`}</span>
              </td>
              <td style="width: 25%;">
                <span class="label">Age / Gender / Contact</span><br>
                <span class="val">${f.age||`-`} Yrs / ${f.gender||`-`} / ${f.mobileNo||`-`}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="label">Bed / Ward Location</span><br>
                <span class="val">${p.bedId?.bedNumber?`Bed `+p.bedId.bedNumber+` (`+(p.bedId.wardId?.name||`Ward`)+`)`:`-`}</span>
              </td>
              <td>
                <span class="label">Admitting Doctor</span><br>
                <span class="val">${p.doctorId?.fullName||`-`}</span>
              </td>
              <td>
                <span class="label">Admission Date</span><br>
                <span class="val">${p.admissionDate?new Date(p.admissionDate).toLocaleDateString(`en-IN`):`-`}</span>
              </td>
              <td>
                <span class="label">Discharge Date</span><br>
                <span class="val">${p.dischargeDate?new Date(p.dischargeDate).toLocaleDateString(`en-IN`):`Active Admission`}</span>
              </td>
            </tr>
          </table>

          <div class="summary-box">
            <div class="card">
              <div class="card-title">Accumulated Charges</div>
              <div class="card-val">₹${s.toFixed(2)}</div>
            </div>
            <div class="card">
              <div class="card-title">Advance Deposits</div>
              <div class="card-val" style="color: #047857;">₹${c.toFixed(2)}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Billed</div>
              <div class="card-val" style="color: #4338ca;">₹${l.toFixed(2)}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Paid</div>
              <div class="card-val" style="color: #059669;">₹${u.toFixed(2)}</div>
            </div>
            <div class="card">
              <div class="card-title">Balance Due</div>
              <div class="card-val" style="color: #e11d48;">₹${d.toFixed(2)}</div>
            </div>
          </div>

          <!-- Section 1: Detailed Patient Charges Register -->
          <div class="section-header">1. Complete Itemized Patient Charges Register</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 4%;">#</th>
                <th style="width: 14%;">Date & Time</th>
                <th style="width: 14%;">Category</th>
                <th style="width: 38%;">Description & Breakdown</th>
                <th style="width: 10%; text-align: right;">Unit Rate</th>
                <th style="width: 5%; text-align: center;">Qty</th>
                <th style="width: 15%; text-align: right;">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${r.length===0?`<tr><td colspan="7" class="text-center">No patient charges logged.</td></tr>`:r.map((e,t)=>{let n=e.createdAt?new Date(e.createdAt).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`,hour:`2-digit`,minute:`2-digit`}):`-`,r=e.chargeCategoryId?.name||e.chargeType||`Other`,i=e.amount||0,a=e.addons||[],o=i+a.reduce((e,t)=>e+(t.amount||0),0),s=`<strong>${e.description}</strong>`;return e.ot_description&&(s+=`<div class="ot-tag"><strong>OT Notes:</strong> ${e.ot_description}</div>`),a.length>0&&(s+=`<div style="margin-top: 3px;">`,a.forEach(e=>{s+=`<span class="addon-tag">+ ${e.itemName} (₹${(e.amount||0).toLocaleString()})</span> `}),s+=`</div>`),`
                    <tr>
                      <td>${t+1}</td>
                      <td>${n}</td>
                      <td><span style="font-weight: 700; color: #475569;">${r}</span></td>
                      <td>${s}</td>
                      <td class="text-right font-mono">₹${(e.rate||0).toFixed(2)}</td>
                      <td class="text-center font-mono">${e.quantity||1}</td>
                      <td class="text-right font-mono" style="font-weight: 800;">₹${o.toFixed(2)}</td>
                    </tr>
                  `}).join(``)}
              <tr style="background: #f1f5f9; font-weight: bold;">
                <td colspan="6" class="text-right" style="text-transform: uppercase;">Total Accumulated Charges:</td>
                <td class="text-right font-mono" style="font-size: 12px; color: #4338ca;">₹${s.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Section 2: Generated Bills Summary -->
          <div class="section-header">2. Invoices & Billing Summary</div>
          ${o.length===0?`<p style="color: #64748b; margin-left: 5px;">No bills generated for this admission.</p>`:o.map(e=>`
              <div style="border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 10px; overflow: hidden;">
                <div style="background: #f8fafc; padding: 6px 10px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-weight: 800; color: #4338ca;" class="font-mono">${e.billNo}</span>
                    <span style="font-size: 9px; color: #64748b; margin-left: 8px;">Date: ${e.generatedAt?new Date(e.generatedAt).toLocaleDateString(`en-IN`):`-`}</span>
                  </div>
                  <div>
                    <span style="font-weight: 700; font-size: 9px; padding: 2px 6px; border-radius: 4px; background: #e0e7ff; color: #3730a3;">${e.status}</span>
                  </div>
                </div>
                <table class="data-table" style="margin-bottom: 0;">
                  <thead>
                    <tr style="background: #f1f5f9; color: #475569;">
                      <th style="width: 50%;">Item Description</th>
                      <th style="width: 15%; text-align: right;">Rate</th>
                      <th style="width: 10%; text-align: center;">Qty</th>
                      <th style="width: 25%; text-align: right;">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(e.items||[]).map(e=>`
                      <tr>
                        <td>${e.description}</td>
                        <td class="text-right font-mono">₹${(e.rate||0).toFixed(2)}</td>
                        <td class="text-center font-mono">${e.quantity||1}</td>
                        <td class="text-right font-mono">₹${(e.amount||0).toFixed(2)}</td>
                      </tr>
                    `).join(``)}
                    <tr style="background: #fafafa; font-weight: bold;">
                      <td colspan="3" class="text-right">Bill Net Amount:</td>
                      <td class="text-right font-mono" style="color: #4338ca;">₹${(e.netAmount||0).toFixed(2)}</td>
                    </tr>
                    <tr style="background: #fafafa;">
                      <td colspan="3" class="text-right" style="color: #047857; font-weight: 700;">Paid Amount:</td>
                      <td class="text-right font-mono" style="color: #047857; font-weight: 700;">₹${(e.paidAmount||0).toFixed(2)}</td>
                    </tr>
                    <tr style="background: #fafafa;">
                      <td colspan="3" class="text-right" style="color: #e11d48; font-weight: 700;">Balance Due:</td>
                      <td class="text-right font-mono" style="color: #e11d48; font-weight: 700;">₹${(e.balanceAmount||0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `).join(``)}

          <!-- Section 3: Advance Deposits & Payments Register -->
          <div class="section-header">3. Advance Deposits & Payment Transactions</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 20%;">Date & Time</th>
                <th style="width: 20%;">Payment Mode</th>
                <th style="width: 35%;">Receipt / Remarks</th>
                <th style="width: 20%; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${i.length===0?`<tr><td colspan="5" class="text-center">No advance deposits recorded.</td></tr>`:i.map((e,t)=>`
                  <tr>
                    <td>${t+1}</td>
                    <td>${e.createdAt?new Date(e.createdAt).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`,hour:`2-digit`,minute:`2-digit`}):`-`}</td>
                    <td><span style="font-weight: 700;" class="font-mono">${e.paymentMode||`CASH`}</span></td>
                    <td>${e.receiptNo?`Receipt: `+e.receiptNo:``} ${e.remarks||``}</td>
                    <td class="text-right font-mono" style="font-weight: 700; color: #047857;">₹${(e.amount||0).toFixed(2)}</td>
                  </tr>
                `).join(``)}
              <tr style="background: #f1f5f9; font-weight: bold;">
                <td colspan="4" class="text-right" style="text-transform: uppercase;">Total Advance Deposits:</td>
                <td class="text-right font-mono" style="font-size: 11px; color: #047857;">₹${c.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <div class="sig-box">
              <div class="sig-line">Patient / Relative Signature</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">Authorized Accounts Officer</div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          <\/script>
        </body>
      </html>
    `,h=window.open(``,`_blank`);h.document.write(m),h.document.close()}catch(e){console.error(`Error exporting detailed statement:`,e),L.show({message:`Failed to export detailed bills and charges statement`,type:`error`})}finally{Q.value=!1}}},$=t(!1),Qe=async()=>{if(v.admission?._id){$.value=!0;try{let[e,t,n,r]=await Promise.all([R.fetchAdmissionCharges(v.admission._id),R.fetchAdmissionAdvances(v.admission._id),R.fetchAdmissionBills(v.admission._id),R.fetchChargeCategories()]),i=e.success?e.data:[],a=t.success?t.data:[],o=r.success?r.data:[],s=e=>(e.amount||0)+(e.addons||[]).reduce((e,t)=>e+(t.amount||0),0),c=e=>{if(e.chargeCategoryId&&typeof e.chargeCategoryId==`object`&&e.chargeCategoryId.name)return{id:String(e.chargeCategoryId._id||e.chargeCategoryId.code||e.chargeCategoryId.name),name:e.chargeCategoryId.name,code:(e.chargeCategoryId.code||``).toUpperCase()};if(e.chargeCategoryId){let t=o.find(t=>String(t._id)===String(e.chargeCategoryId));if(t)return{id:String(t._id),name:t.name,code:(t.code||``).toUpperCase()}}if(e.chargeType){let t=o.find(t=>t.code===e.chargeType||t.name.toLowerCase()===e.chargeType.toLowerCase());return t?{id:String(t._id),name:t.name,code:(t.code||``).toUpperCase()}:{id:e.chargeType,name:e.chargeType.replace(/_/g,` `).replace(/\b\w/g,e=>e.toUpperCase()),code:e.chargeType.toUpperCase()}}return{id:`OTHER`,name:`Other Medications/Test`,code:`OTHER`}},l=new Map;i.forEach(e=>{let t=c(e);l.has(t.id)||l.set(t.id,{id:t.id,code:t.code,name:t.name,charges:[]}),l.get(t.id).charges.push(e)});let u=[],d=1;l.forEach(e=>{let t=e.code,n=e.name.toLowerCase(),r=t===`PHARMACY`||n.includes(`pharmacy`)||n.includes(`medicine`)||n.includes(`drug`),i=t===`ROOM`||t===`ROOM_RENT`||t===`BED`||n.includes(`room`)||n.includes(`bed`),a=t===`DOCTOR`||t===`DOCTOR_VISIT`||n.includes(`doctor`)||n.includes(`consult`),o=t===`LAB`||t===`LABORATORY`||n.includes(`lab`),c=t===`RADIOLOGY`||n.includes(`radiology`)||n.includes(`x-ray`)||n.includes(`usg`)||n.includes(`scan`),l=t===`OT`||n.includes(`operation`)||n.includes(`surgery`)||n.includes(`theatre`),f=t===`NURSING`||n.includes(`nursing`),p=e.charges.reduce((e,t)=>e+s(t),0),m=e.charges.reduce((e,t)=>e+(t.quantity||1),0),h=`Qty`;i?h=m===1?`Day`:`Days`:a?h=m===1?`Visit`:`Visits`:r?h=m===1?`Item`:`Items`:o?h=m===1?`Test`:`Tests`:c?h=m===1?`Scan`:`Scans`:l?h=m===1?`Proc`:`Procedures`:f&&(h=m===1?`Item`:`Items`),u.push({sn:d++,categoryName:e.name,qty:`${m} ${h}`,amount:p})});let f=u.reduce((e,t)=>e+t.amount,0);f-a.reduce((e,t)=>e+(t.amount||0),0);let p=v.admission.patientId||{},m=v.admission||{},h=`
      <!DOCTYPE html>
      <html>
        <head>
          <title>IPD Final Bill - ${p.fullName||`Patient`}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm 15mm; }
            body { font-family: ui-mono, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace, 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 11px; line-height: 1.4; }
            .receipt-header { text-align: center; margin-bottom: 12px; }
            .receipt-divider { border: 0; border-top: 1px dashed #cbd5e1; margin: 8px 0; }
            .receipt-header h2 { font-size: 12px; font-weight: bold; letter-spacing: 0.05em; color: #1e293b; margin: 4px 0 0 0; }
            .status-badge { background: #fef2f2; color: #dc2626; border: 1.5px solid #f87171; font-weight: 900; font-size: 10.5px; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase; }
            
            .demo-grid { width: 100%; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; padding: 8px 10px; margin-bottom: 14px; font-size: 10.5px; border-collapse: collapse; }
            .demo-grid td { padding: 4px 6px; vertical-align: top; }
            .label { font-weight: 700; color: #475569; text-transform: uppercase; font-size: 9px; }
            .val { font-weight: 600; color: #0f172a; }
            .font-mono { font-family: monospace; font-weight: bold; }

            table.bill-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 11px; }
            table.bill-table th { background: #1e3a8a; color: #ffffff; text-align: left; padding: 7px 10px; font-weight: 700; text-transform: uppercase; font-size: 10px; }
            table.bill-table td { border-bottom: 1px solid #e2e8f0; padding: 7px 10px; color: #1e293b; }
            table.bill-table tr:nth-child(even) { background-color: #f8fafc; }
            table.bill-table tr.grand-total-row td { background: #f1f5f9; padding: 8px 10px; border-top: 2px solid #1e3a8a; border-bottom: 2px solid #1e3a8a; font-weight: 800; }
            
            .text-right { text-align: right; }
            .text-center { text-align: center; }

            .in-words-box { background: #f8fafc; border: 1px dashed #cbd5e1; padding: 8px 12px; border-radius: 6px; font-size: 11px; margin-bottom: 14px; }

            .footer { margin-top: 40px; display: flex; justify-content: flex-end; align-items: flex-end; font-size: 10.5px; color: #475569; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 200px; }
            .sig-line { border-top: 1.5px solid #334155; margin-top: 45px; padding-top: 5px; font-weight: 700; color: #0f172a; }
          </style>
        </head>
        <body>
          <!-- Header Brand (From Invoice.vue) -->
          <div class="receipt-header">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <img src="${b}" alt="Logo" style="height: 60px; width: auto; object-fit: contain;" />
              <div style="text-align: right; font-size: 10.5px; color: #64748b; line-height: 1.35;">
                <p style="margin: 0; font-weight: 800; color: #0f172a; font-size: 11.5px; letter-spacing: 0.2px;">EMMANUEL HOSPITAL</p>
                <p style="margin: 0;">Y-67, Luangmual, Aizawl, Mizoram - 796009</p>
                <p style="margin: 0;">Phone: 0389-2913340 / 8974326872</p>
              </div>
            </div>
            <hr class="receipt-divider" />
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; margin-bottom: 4px;">
              <h2 style="font-size: 12px; font-weight: 800; letter-spacing: 0.05em; color: #1e293b; margin: 0; text-transform: uppercase;">
                IPD FINAL BILL
              </h2>
              <div style="font-size: 10px; color: #64748b;">
                Date: <strong>${m.dischargeDate?new Date(m.dischargeDate).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`}):new Date().toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`})}</strong>
              </div>
            </div>
          </div>

          <table class="demo-grid">
            <tr>
              <td style="width: 25%;">
                <span class="label">Patient Name</span><br>
                <span class="val" style="font-size: 12px; color: #1e3a8a;">${p.fullName||`-`}</span>
              </td>
              <td style="width: 25%;">
                <span class="label">MRN / Patient ID</span><br>
                <span class="val font-mono">${p.mrn||p.patientCode||`-`}</span>
              </td>
              <td style="width: 25%;">
                <span class="label">IPD Admission No</span><br>
                <span class="val font-mono">${m.admissionNo||`-`}</span>
              </td>
              <td style="width: 25%;">
                <span class="label">Payer Type</span><br>
                <span class="val font-mono" style="font-weight: 800; color: #1e3a8a;">${Y(m.payerType)}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="label">Age / Gender / Mobile</span><br>
                <span class="val">${p.age||`-`} Yrs / ${p.gender||`-`} / ${p.mobileNo||`-`}</span>
              </td>
              <td>
                <span class="label">Bed / Ward Location</span><br>
                <span class="val">${m.bedId?.bedNo||m.bedId?.bedNumber?`Bed `+(m.bedId.bedNo||m.bedId.bedNumber)+` (`+(m.bedId.wardId?.name||`Ward`)+`)`:`-`}</span>
              </td>
              <td>
                <span class="label">Consultant Doctor</span><br>
                <span class="val">${m.consultantDoctorId?.fullName||m.doctorId?.fullName||`-`}</span>
              </td>
              <td>
                <span class="label">Admission / Discharge Date</span><br>
                <span class="val">${m.admissionDate?new Date(m.admissionDate).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`}):`-`} to ${m.dischargeDate?new Date(m.dischargeDate).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`}):new Date().toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`})}</span>
              </td>
            </tr>
          </table>

          <!-- Category Summary Table -->
          <table class="bill-table">
            <thead>
              <tr>
                <th style="width: 8%; text-align: center;">#</th>
                <th style="width: 54%;">Charge Category</th>
                <th style="width: 18%; text-align: center;">Quantity / Duration</th>
                <th style="width: 20%; text-align: right;">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${u.length===0?`<tr><td colspan="4" class="text-center" style="padding: 15px;">No charges recorded for this admission.</td></tr>`:u.map(e=>`
                  <tr>
                    <td class="text-center font-mono" style="color: #64748b;">${e.sn}</td>
                    <td style="padding-left: 12px; font-weight: 700; color: #0f172a; font-size: 11.5px;">${e.categoryName}</td>
                    <td class="text-center font-mono">${e.qty}</td>
                    <td class="text-right font-mono" style="font-weight: 800; font-size: 11.5px;">₹${e.amount.toFixed(2)}</td>
                  </tr>
                `).join(``)}
              <tr class="grand-total-row">
                <td colspan="3" class="text-right" style="text-transform: uppercase; font-weight: 800; font-size: 11px;">Total Bill:</td>
                <td class="text-right font-mono" style="font-size: 13px; color: #1e3a8a; font-weight: 900;">₹${f.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="in-words-box" style="margin-top: 14px;">
            <strong>Total Amount in Words:</strong> ${X(f)}
          </div>

          <div class="footer">
            <div class="sig-box">
              <div class="sig-line">Authorized Signatory</div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          <\/script>
        </body>
      </html>
    `,g=window.open(``,`_blank`);g.document.write(h),g.document.close()}catch(e){console.error(`Error printing final bill:`,e),L.show({message:`Failed to generate final bill`,type:`error`})}finally{$.value=!1}}};return(t,r)=>(e(),c(`div`,T,[s(`div`,E,[s(`div`,D,[s(`div`,O,o((a.admission.patientId?.fullName||`P`)[0]),1),s(`div`,null,[s(`div`,k,[s(`h2`,A,o(a.admission.patientId?.fullName||`Unknown Patient`),1),s(`span`,j,o(a.admission.status||`ADMITTED`),1)]),s(`div`,M,[s(`span`,null,[r[8]||=p(`MRN: `,-1),s(`strong`,N,o(a.admission.patientId?.mrn||a.admission.patientId?.patientCode||`-`),1)]),r[11]||=s(`span`,null,`•`,-1),a.admission.bedId?(e(),c(`span`,ee,[r[9]||=p(`Bed: `,-1),s(`strong`,P,o(a.admission.bedId?.bedNo||`-`),1),p(` `+o(a.admission.bedId?.wardId?.name?`(${a.admission.bedId.wardId.name})`:``),1)])):_(``,!0),a.admission.consultantDoctorId?.fullName?(e(),c(`span`,F,[r[10]||=p(`• Doctor: `,-1),s(`strong`,te,`Dr. `+o(a.admission.consultantDoctorId.fullName.replace(/^Dr\.\s*/i,``)),1)])):_(``,!0)])])]),s(`div`,ne,[s(`button`,{onClick:Qe,disabled:$.value,class:`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50`},[$.value?(e(),c(`svg`,ie,[...r[12]||=[s(`circle`,{class:`opacity-25`,cx:`12`,cy:`12`,r:`10`,stroke:`currentColor`,"stroke-width":`4`},null,-1),s(`path`,{class:`opacity-75`,fill:`currentColor`,d:`M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z`},null,-1)]])):(e(),c(`svg`,ae,[...r[13]||=[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2`,d:`M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z`},null,-1)]])),r[14]||=p(` Print Final Bill `,-1)],8,re),s(`button`,{onClick:Ze,disabled:Q.value,class:`px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50`},[Q.value?(e(),c(`svg`,se,[...r[15]||=[s(`circle`,{class:`opacity-25`,cx:`12`,cy:`12`,r:`10`,stroke:`currentColor`,"stroke-width":`4`},null,-1),s(`path`,{class:`opacity-75`,fill:`currentColor`,d:`M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z`},null,-1)]])):(e(),c(`svg`,ce,[...r[16]||=[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2`,d:`M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z`},null,-1)]])),r[17]||=p(` Export Detailed Statement `,-1)],8,oe),s(`div`,le,[r[19]||=s(`svg`,{class:`w-4.5 h-4.5 text-emerald-500`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z`})],-1),s(`div`,ue,[r[18]||=s(`span`,{class:`text-emerald-700/80 font-bold mr-1 uppercase text-[10px] tracking-wide`},`Available Deposit:`,-1),s(`strong`,de,`₹`+o(H.value.toFixed(2)),1)])])])]),s(`div`,fe,[z.value?(e(),c(`div`,pe,[...r[20]||=[s(`svg`,{class:`animate-spin h-8 w-8 text-indigo-600`,xmlns:`http://www.w3.org/2000/svg`,fill:`none`,viewBox:`0 0 24 24`},[s(`circle`,{class:`opacity-25`,cx:`12`,cy:`12`,r:`10`,stroke:`currentColor`,"stroke-width":`4`}),s(`path`,{class:`opacity-75`,fill:`currentColor`,d:`M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z`})],-1),s(`span`,{class:`text-xs font-semibold`},`Fetching IPD bills and invoices...`,-1)]])):B.value.length===0?(e(),c(`div`,me,[...r[21]||=[m(`<div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><p class="text-sm font-bold text-slate-700">No Bills Generated</p><p class="text-xs text-slate-400 mt-0.5">There are no generated invoices for this admission record yet.</p>`,3)]])):(e(),c(`div`,he,[(e(!0),c(d,null,i(B.value,t=>(e(),c(`div`,{key:t._id,class:`bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md`},[s(`div`,ge,[s(`div`,null,[s(`div`,_e,[r[22]||=s(`span`,{class:`text-[10px] font-bold text-slate-400 uppercase tracking-wider`},`Invoice / Bill No`,-1),s(`span`,{class:u([`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border tracking-wider`,{"bg-emerald-50 text-emerald-700 border-emerald-200":t.status===`PAID`,"bg-amber-50 text-amber-700 border-amber-200":t.status===`PARTIALLY_PAID`,"bg-rose-50 text-rose-700 border-rose-200":t.status===`DRAFT`||t.status===`UNPAID`}])},o(t.status),3)]),s(`h4`,ve,o(t.billNo),1),s(`p`,ye,`Generated: `+o(Ye(t.generatedAt||t.createdAt)),1)]),s(`div`,be,[s(`button`,{onClick:e=>Xe(t),disabled:Z.value,class:`px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs`},[...r[23]||=[s(`svg`,{class:`w-4 h-4 text-slate-500`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2`,d:`M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z`})],-1),p(` Print Invoice `,-1)]],8,xe),t.status===`PAID`?_(``,!0):(e(),c(`button`,{key:0,onClick:e=>J(t),class:`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer`},[...r[24]||=[s(`svg`,{class:`w-4 h-4`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z`})],-1),p(` Pay Now `,-1)]],8,Se))])]),s(`div`,Ce,[s(`div`,we,[r[25]||=s(`span`,{class:`text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5`},`Net Billed Amount`,-1),s(`div`,Te,`₹`+o(t.netAmount?.toFixed(2)),1)]),s(`div`,Ee,[r[26]||=s(`span`,{class:`text-[10px] font-bold text-emerald-600/80 uppercase tracking-wider block mb-0.5`},`Total Paid`,-1),s(`div`,De,`₹`+o(t.paidAmount?.toFixed(2)),1)]),s(`div`,Oe,[r[27]||=s(`span`,{class:`text-[10px] font-bold text-rose-600/80 uppercase tracking-wider block mb-0.5`},`Balance Due`,-1),s(`div`,ke,`₹`+o(t.balanceAmount?.toFixed(2)),1)])])]))),128))]))]),W.value?(e(),c(`div`,Ae,[s(`div`,je,[s(`div`,Me,[s(`div`,null,[r[29]||=s(`h3`,{class:`font-bold text-slate-800 text-base`},`Process IPD Bill Payment`,-1),s(`p`,Ne,[r[28]||=p(`Bill No: `,-1),s(`span`,Pe,o(K.value?.billNo),1)])]),s(`button`,{onClick:r[0]||=e=>W.value=!1,class:`text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer`},[...r[30]||=[s(`svg`,{class:`w-5 h-5`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2.5`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M6 18L18 6M6 6l12 12`})],-1)]])]),s(`div`,Fe,[H.value>0?(e(),c(`div`,Ie,[s(`div`,Le,[r[31]||=s(`span`,{class:`font-bold text-emerald-900 uppercase tracking-wide text-[10px]`},`Deduct from Advance Deposit`,-1),s(`span`,Re,`Max: ₹`+o(H.value.toFixed(2)),1)]),s(`div`,ze,[r[32]||=s(`span`,{class:`absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 font-bold`},`₹`,-1),n(s(`input`,{type:`number`,"onUpdate:modelValue":r[1]||=e=>q.value.deductDeposit=e,onInput:qe,class:`w-full pl-8 pr-4 py-2 bg-white border border-emerald-300 rounded-xl text-emerald-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono font-bold text-sm outline-none`,placeholder:`0.00`},null,544),[[y,q.value.deductDeposit]])])])):_(``,!0),s(`div`,Be,[r[34]||=s(`label`,{class:`block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1`},`Remaining Balance to Pay`,-1),s(`div`,Ve,[r[33]||=s(`span`,{class:`absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm`},`₹`,-1),n(s(`input`,{type:`number`,"onUpdate:modelValue":r[2]||=e=>q.value.amount=e,readonly:``,class:`w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-lg text-slate-900 focus:outline-none`},null,512),[[y,q.value.amount]])])]),q.value.amount>0?(e(),c(`div`,He,[r[36]||=s(`label`,{class:`block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1`},`Payment Mode`,-1),n(s(`select`,{"onUpdate:modelValue":r[3]||=e=>q.value.paymentMode=e,class:`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 outline-none`},[...r[35]||=[s(`option`,{value:`CASH`},`Cash`,-1),s(`option`,{value:`UPI`},`UPI`,-1),s(`option`,{value:`CARD`},`Card`,-1),s(`option`,{value:`BANK_TRANSFER`},`Bank Transfer`,-1)]],512),[[x,q.value.paymentMode]])])):_(``,!0),q.value.amount>0&&[`UPI`,`CARD`,`BANK_TRANSFER`].includes(q.value.paymentMode)?(e(),c(`div`,Ue,[r[37]||=s(`label`,{class:`block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1`},`Transaction / Ref No.`,-1),n(s(`input`,{type:`text`,"onUpdate:modelValue":r[4]||=e=>q.value.transactionNo=e,class:`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 outline-none`,placeholder:`Enter transaction reference number`},null,512),[[y,q.value.transactionNo]])])):_(``,!0),s(`div`,null,[r[38]||=s(`label`,{class:`block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1`},`Remarks (Optional)`,-1),n(s(`input`,{type:`text`,"onUpdate:modelValue":r[5]||=e=>q.value.remarks=e,class:`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 outline-none`,placeholder:`Add payment notes or comments...`},null,512),[[y,q.value.remarks]])])]),s(`div`,We,[s(`button`,{onClick:r[6]||=e=>W.value=!1,class:`px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer`},`Cancel`),s(`button`,{onClick:Je,disabled:G.value,class:`px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50`},[G.value?(e(),c(`span`,Ke)):_(``,!0),s(`span`,null,o(G.value?`Processing...`:`Confirm Payment`),1)],8,Ge)])])])):_(``,!0),l(w,{show:t.showInvoice,admission:a.admission,billDetails:t.invoiceBillDetails,onClose:r[7]||=e=>t.showInvoice=!1},null,8,[`show`,`admission`,`billDetails`])]))}},L={class:`space-y-6 max-w-7xl mx-auto p-4 sm:p-6 min-h-[calc(100vh-4rem)] flex flex-col`},R={class:`flex flex-col lg:flex-row lg:items-center justify-between gap-4`},z={class:`grid grid-cols-3 gap-3 shrink-0`},B={class:`bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-xs flex items-center gap-3`},V={class:`text-base font-black text-slate-900 font-mono`},H={class:`bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-xs flex items-center gap-3`},U={class:`text-base font-black text-slate-900 font-mono`},W={class:`bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-xs flex items-center gap-3`},G={class:`text-base font-black text-slate-900 font-mono`},K={class:`flex-1 min-h-[620px] flex flex-col lg:flex-row gap-6`},q={class:`w-full lg:w-[420px] flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden shrink-0`},J={class:`p-4 border-b border-slate-100 space-y-3 bg-slate-50/40`},qe={class:`relative`},Je={class:`flex items-center justify-between gap-2`},Ye={class:`flex bg-slate-100/80 p-0.5 rounded-xl text-xs font-bold w-full`},Y={class:`flex-1 overflow-y-auto p-3 space-y-2.5`},X={key:0,class:`flex flex-col items-center justify-center py-16 text-slate-400 space-y-2`},Z={key:1,class:`text-center py-16 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 my-2`},Q={key:2,class:`space-y-2`},Xe=[`onClick`],Ze={key:0,class:`absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 rounded-r`},$={class:`flex items-center justify-between gap-2 mb-1.5`},Qe={class:`flex items-center gap-1.5 overflow-hidden`},$e={class:`text-[10px] font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/80 shrink-0`},et={key:0,class:`text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate`},tt={class:`font-bold text-slate-800 text-sm leading-snug group-hover:text-indigo-600 transition-colors`},nt={class:`text-[11px] text-slate-500 space-y-0.5 mt-1.5 pt-1.5 border-t border-slate-100/70 flex items-center justify-between`},rt={class:`flex items-center gap-1 text-slate-400 font-medium`},it={key:0,class:`text-indigo-600 font-semibold truncate max-w-[120px]`},at={class:`p-3 px-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs`},ot={class:`text-slate-500 font-semibold`},st={class:`text-slate-800`},ct={class:`text-slate-800`},lt={class:`flex gap-1.5`},ut=[`disabled`],dt=[`disabled`],ft={class:`flex-1 bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden flex flex-col`},pt={key:0,class:`flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30`},mt={__name:`Index`,setup(l){let g=S(),b=C(),x=t(null),w=t(``),T=t(`ADMITTED`),E=t(1),D=t(10),O=t(1),k=t(0),A=async()=>{try{await b.fetchAdmissions({page:E.value,limit:D.value,search:w.value,status:T.value});let e=b.pagination;e?(O.value=e.pages||1,k.value=e.total||b.admissions.length):(O.value=1,k.value=b.admissions.length)}catch(e){console.error(`Error fetching admissions:`,e),g.show({message:b.error||`Failed to fetch admissions`,type:`error`})}},j=e=>{x.value=e},M=null;r(w,()=>{M&&clearTimeout(M),M=setTimeout(()=>{E.value=1,A()},350)}),r(T,()=>{E.value=1,A()}),v(()=>{A()});let N=()=>{w.value=``,E.value=1,A()},ee=e=>e?new Date(e).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`,hour:`2-digit`,minute:`2-digit`}):`-`,P=e=>{switch(e){case`ADMITTED`:return`bg-emerald-50 text-emerald-700 border-emerald-200`;case`DISCHARGED`:return`bg-slate-100 text-slate-600 border-slate-200`;default:return`bg-amber-50 text-amber-700 border-amber-200`}},F=h(()=>{let e=k.value,t=b.admissions||[];return{total:e,admitted:t.filter(e=>e.status===`ADMITTED`).length,discharged:t.filter(e=>e.status===`DISCHARGED`).length}});return(t,r)=>(e(),c(`div`,L,[s(`div`,R,[r[12]||=m(`<div><div class="flex items-center gap-2"><span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80 shadow-xs"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span><div><h1 class="text-2xl font-black text-slate-900 tracking-tight">IPD Billing &amp; Payment Desk</h1><p class="text-xs font-semibold text-slate-500 mt-0.5">Manage inpatient billing, advance deposits, daily bed charges, and final discharge billing settlement.</p></div></div></div>`,1),s(`div`,z,[s(`div`,B,[r[7]||=s(`div`,{class:`w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0`},[s(`svg`,{class:`w-5 h-5`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4`})])],-1),s(`div`,null,[r[6]||=s(`span`,{class:`text-[10px] font-bold text-slate-400 uppercase tracking-wider block`},`Active Admitted`,-1),s(`span`,V,o(F.value.admitted),1)])]),s(`div`,H,[r[9]||=s(`div`,{class:`w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0`},[s(`svg`,{class:`w-5 h-5`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z`})])],-1),s(`div`,null,[r[8]||=s(`span`,{class:`text-[10px] font-bold text-slate-400 uppercase tracking-wider block`},`Discharged`,-1),s(`span`,U,o(F.value.discharged),1)])]),s(`div`,W,[r[11]||=s(`div`,{class:`w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold shrink-0`},[s(`svg`,{class:`w-5 h-5`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z`})])],-1),s(`div`,null,[r[10]||=s(`span`,{class:`text-[10px] font-bold text-slate-400 uppercase tracking-wider block`},`Total Listed`,-1),s(`span`,G,o(k.value),1)])])])]),s(`div`,K,[s(`div`,q,[s(`div`,J,[s(`div`,qe,[n(s(`input`,{type:`text`,"onUpdate:modelValue":r[0]||=e=>w.value=e,placeholder:`Search by Patient Name, MRN or Code...`,class:`w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner`},null,512),[[y,w.value]]),r[14]||=s(`svg`,{class:`w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2.5`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z`})],-1),w.value?(e(),c(`button`,{key:0,onClick:N,class:`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100`},[...r[13]||=[s(`svg`,{class:`w-3.5 h-3.5`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2.5`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M6 18L18 6M6 6l12 12`})],-1)]])):_(``,!0)]),s(`div`,Je,[s(`div`,Ye,[s(`button`,{onClick:r[1]||=e=>T.value=`ADMITTED`,class:u([`flex-1 py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer`,T.value===`ADMITTED`?`bg-white text-indigo-600 shadow-xs`:`text-slate-500 hover:text-slate-800`])},` Admitted `,2),s(`button`,{onClick:r[2]||=e=>T.value=`DISCHARGED`,class:u([`flex-1 py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer`,T.value===`DISCHARGED`?`bg-white text-indigo-600 shadow-xs`:`text-slate-500 hover:text-slate-800`])},` Discharged `,2),s(`button`,{onClick:r[3]||=e=>T.value=``,class:u([`flex-1 py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer`,T.value===``?`bg-white text-indigo-600 shadow-xs`:`text-slate-500 hover:text-slate-800`])},` All `,2)])])]),s(`div`,Y,[a(b).loading?(e(),c(`div`,X,[...r[15]||=[s(`svg`,{class:`animate-spin h-7 w-7 text-indigo-600`,xmlns:`http://www.w3.org/2000/svg`,fill:`none`,viewBox:`0 0 24 24`},[s(`circle`,{class:`opacity-25`,cx:`12`,cy:`12`,r:`10`,stroke:`currentColor`,"stroke-width":`4`}),s(`path`,{class:`opacity-75`,fill:`currentColor`,d:`M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z`})],-1),s(`span`,{class:`text-xs font-semibold`},`Loading IPD admissions...`,-1)]])):a(b).admissions.length===0?(e(),c(`div`,Z,[...r[16]||=[m(`<div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div><p class="text-xs font-bold text-slate-700">No Admissions Found</p><p class="text-[11px] text-slate-400 mt-0.5">Try modifying your search or filter settings.</p>`,3)]])):(e(),c(`div`,Q,[(e(!0),c(d,null,i(a(b).admissions,t=>(e(),c(`button`,{key:t._id,onClick:e=>j(t),class:u([`w-full text-left p-3.5 rounded-xl border transition-all duration-200 group relative overflow-hidden cursor-pointer`,x.value?._id===t._id?`bg-gradient-to-r from-indigo-50/90 to-indigo-50/30 border-indigo-200 shadow-sm ring-1 ring-indigo-200/50`:`bg-white border-slate-100 hover:border-indigo-150 hover:bg-slate-50/80`])},[x.value?._id===t._id?(e(),c(`div`,Ze)):_(``,!0),s(`div`,$,[s(`div`,Qe,[s(`span`,$e,o(t.patientId?.mrn||t.patientId?.patientCode||`N/A`),1),t.bedId?(e(),c(`span`,et,` Bed `+o(t.bedId?.bedNo||``)+` `+o(t.bedId?.wardId?.name?`(${t.bedId.wardId.name})`:``),1)):_(``,!0)]),s(`span`,{class:u([`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0`,P(t.status)])},o(t.status),3)]),s(`h3`,tt,o(t.patientId?.fullName||`Unknown Patient`),1),s(`div`,nt,[s(`span`,rt,[r[17]||=s(`svg`,{class:`w-3.5 h-3.5 text-slate-400`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z`})],-1),p(` Admitted: `+o(ee(t.admissionDate)),1)]),t.consultantDoctorId?.fullName?(e(),c(`span`,it,` Dr. `+o(t.consultantDoctorId.fullName.replace(/^Dr\.\s*/i,``)),1)):_(``,!0)])],10,Xe))),128))]))]),s(`div`,at,[s(`span`,ot,[r[18]||=p(` Page `,-1),s(`strong`,st,o(E.value),1),r[19]||=p(` of `,-1),s(`strong`,ct,o(O.value),1)]),s(`div`,lt,[s(`button`,{onClick:r[4]||=e=>E.value>1&&(E.value--,A()),disabled:E.value===1,class:`px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed bg-white shadow-2xs font-bold text-xs cursor-pointer transition-all`},` Prev `,8,ut),s(`button`,{onClick:r[5]||=e=>E.value<O.value&&(E.value++,A()),disabled:E.value===O.value,class:`px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed bg-white shadow-2xs font-bold text-xs cursor-pointer transition-all`},` Next `,8,dt)])])]),s(`div`,ft,[x.value?(e(),f(I,{key:1,admission:x.value,onPaymentSuccess:A},null,8,[`admission`])):(e(),c(`div`,pt,[...r[20]||=[m(`<div class="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100/80 shadow-xs"><svg class="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></div><h3 class="text-lg font-bold text-slate-800">No Patient Selected</h3><p class="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed"> Select an active or discharged inpatient from the list on the left to review billing details, process advance deposit deductions, and complete settlement. </p>`,3)]]))])])]))}};export{mt as default};