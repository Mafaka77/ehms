import{E as e,G as t,I as n,N as r,O as i,X as a,_t as o,c as s,d as c,h as l,ht as u,i as d,l as f,m as p,p as m,s as h,t as g,u as _,w as v}from"./api-DtA5Tz69.js";import{g as y,m as b,p as x,s as S}from"./index-CYPOGnj3.js";import{t as C}from"./ipdAdmissionStore-DyT-ADfF.js";import{t as w}from"./Invoice-u10VPCuU.js";var T={class:`h-full flex flex-col bg-white`},E={class:`p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`},D={class:`flex items-center gap-4`},O={class:`text-xl font-bold text-slate-800`},k={class:`text-sm font-medium text-slate-500 flex gap-3 mt-1`},A={class:`text-slate-700 font-mono`},j={class:`flex items-center gap-3`},M=[`disabled`],N={key:0,class:`animate-spin h-4 w-4 text-indigo-600`,xmlns:`http://www.w3.org/2000/svg`,fill:`none`,viewBox:`0 0 24 24`},ee={key:1,class:`w-4 h-4 text-rose-500`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`},te={class:`bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2`},ne={class:`text-sm`},re={class:`font-bold font-mono text-base`},ie={class:`flex-1 overflow-y-auto p-6 bg-slate-50`},ae={key:0,class:`flex items-center justify-center py-12`},oe={key:1,class:`text-center py-12 bg-white rounded-xl border border-dashed border-slate-200`},se={key:2,class:`space-y-4`},ce={class:`flex justify-between items-start mb-4`},le={class:`font-bold font-mono text-indigo-600 text-lg`},ue={class:`text-xs text-slate-500 mt-1`},de={class:`flex flex-col items-end gap-2`},fe={class:`flex items-center gap-2`},pe=[`onClick`],me=[`onClick`],he={class:`grid grid-cols-3 gap-4 border-t border-slate-100 pt-4`},ge={class:`font-mono font-bold text-slate-800`},_e={class:`font-mono font-bold text-emerald-600`},ve={class:`font-mono font-bold text-rose-600`},ye={key:0,class:`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm`},be={class:`bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col`},xe={class:`px-6 py-4 border-b border-slate-100 flex items-center justify-between`},Se={class:`p-6 space-y-4`},Ce={key:0,class:`p-4 bg-emerald-50 rounded-xl border border-emerald-100`},we={class:`flex justify-between text-sm mb-2`},Te={class:`text-emerald-600 font-mono`},Ee={class:`relative`},De={class:`border-t border-slate-100 pt-4`},Oe={class:`relative`},ke={key:1},Ae={key:2},je={class:`px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3`},Me=[`disabled`],Ne={key:0},Pe={key:1},P={__name:`View`,props:{admission:{type:Object,required:!0}},emits:[`payment-success`],setup(a,{emit:f}){let m=a,v=f,y=S(),P=C(),F=t(!1),I=t([]),L=t([]),R=h(()=>L.value.reduce((e,t)=>e+t.amount,0)),z=async()=>{if(m.admission?._id){F.value=!0;try{let[e,t]=await Promise.all([P.fetchAdmissionBills(m.admission._id),P.fetchAdmissionAdvances(m.admission._id)]);e.success&&(I.value=e.data),t.success&&(L.value=t.data)}catch(e){console.error(`Error fetching IPD payment details:`,e)}finally{F.value=!1}}};r(()=>m.admission,z,{immediate:!0});let B=t(!1),V=t(!1),H=t(null),U=t({deductDeposit:0,amount:0,paymentMode:`CASH`,transactionNo:``,remarks:``}),W=e=>{H.value=e,U.value={deductDeposit:0,amount:e.balanceAmount,paymentMode:`CASH`,transactionNo:``,remarks:``},B.value=!0},G=()=>{let e=Number(U.value.deductDeposit)||0,t=R.value,n=H.value?.balanceAmount||0;e>t&&(e=t),e>n&&(e=n),U.value.deductDeposit=e,U.value.amount=Math.max(0,n-e)},K=async()=>{let e=Number(U.value.deductDeposit)||0,t=Number(U.value.amount)||0;if(e===0&&t<=0){y.show({message:`Please enter a valid payment amount`,type:`error`});return}V.value=!0;try{e>0&&await g.post(`/billing/bills/${H.value._id}/pay`,{amount:e,paymentMode:`ADVANCE_DEPOSIT`,remarks:`Deducted from IPD Advance Deposit`}),t>0&&await g.post(`/billing/bills/${H.value._id}/pay`,{amount:t,paymentMode:U.value.paymentMode,transactionNo:U.value.transactionNo,remarks:U.value.remarks}),y.show({message:`Payment processed successfully`,type:`success`}),B.value=!1,v(`payment-success`),z()}catch(e){console.error(`Error processing payment:`,e),y.show({message:e.response?.data?.message||`Failed to process payment`,type:`error`})}finally{V.value=!1}},q=e=>e?new Date(e).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`,hour:`2-digit`,minute:`2-digit`}):`-`,J=t(!1),Y=t(null),X=t(!1),Z=t(!1),Q=async e=>{X.value=!0;try{Y.value=(await g.get(`/billing/bills/${e._id}`)).data.data,J.value=!0}catch(e){console.error(`Error fetching bill details for print:`,e),y.show({message:`Failed to load bill details for printing`,type:`error`})}finally{X.value=!1}},$=async()=>{if(m.admission?._id){Z.value=!0;try{let[e,t,n]=await Promise.all([P.fetchAdmissionCharges(m.admission._id),P.fetchAdmissionAdvances(m.admission._id),P.fetchAdmissionBills(m.admission._id)]),r=e.success?e.data:[],i=t.success?t.data:[],a=n.success?n.data:[],o=await Promise.all(a.map(async e=>{try{return(await g.get(`/billing/bills/${e._id}`)).data.data||e}catch{return e}})),s=r.reduce((e,t)=>{let n=t.amount||0,r=(t.addons||[]).reduce((e,t)=>e+(t.amount||0),0);return e+n+r},0),c=i.reduce((e,t)=>e+(t.amount||0),0),l=o.reduce((e,t)=>e+(t.netAmount||0),0),u=o.reduce((e,t)=>e+(t.paidAmount||0),0),d=o.reduce((e,t)=>e+(t.balanceAmount||0),0),f=m.admission.patientId||{},p=m.admission||{},h=`
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
                <div class="hospital-title">EMMANUEL HOSPITAL & RESEARCH CENTRE</div>
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
    `,_=window.open(``,`_blank`);_.document.write(h),_.document.close()}catch(e){console.error(`Error exporting detailed statement:`,e),y.show({message:`Failed to export detailed bills and charges statement`,type:`error`})}finally{Z.value=!1}}};return(t,r)=>(e(),c(`div`,T,[s(`div`,E,[s(`div`,D,[r[9]||=s(`div`,{class:`w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100`},[s(`svg`,{class:`w-6 h-6 text-indigo-500`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2`,d:`M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z`})])],-1),s(`div`,null,[s(`h2`,O,o(a.admission.patientId?.fullName),1),s(`div`,k,[s(`span`,null,[r[8]||=p(`MRN: `,-1),s(`strong`,A,o(a.admission.patientId?.mrn||a.admission.patientId?.patientCode),1)])])])]),s(`div`,j,[s(`button`,{onClick:$,disabled:Z.value,class:`px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50`},[Z.value?(e(),c(`svg`,N,[...r[10]||=[s(`circle`,{class:`opacity-25`,cx:`12`,cy:`12`,r:`10`,stroke:`currentColor`,"stroke-width":`4`},null,-1),s(`path`,{class:`opacity-75`,fill:`currentColor`,d:`M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z`},null,-1)]])):(e(),c(`svg`,ee,[...r[11]||=[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2`,d:`M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z`},null,-1)]])),r[12]||=p(` Export Detailed Statement `,-1)],8,M),s(`div`,te,[r[14]||=s(`svg`,{class:`w-5 h-5 text-emerald-500`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z`})],-1),s(`div`,ne,[r[13]||=s(`span`,{class:`text-emerald-600/80 font-semibold mr-1`},`Available Deposit:`,-1),s(`strong`,re,`₹`+o(R.value.toFixed(2)),1)])])])]),s(`div`,ie,[F.value?(e(),c(`div`,ae,[...r[15]||=[s(`div`,{class:`animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600`},null,-1)]])):I.value.length===0?(e(),c(`div`,oe,[...r[16]||=[s(`p`,{class:`text-slate-500`},`No bills generated for this admission.`,-1)]])):(e(),c(`div`,se,[(e(!0),c(d,null,i(I.value,t=>(e(),c(`div`,{key:t._id,class:`bg-white border border-slate-200 rounded-xl p-5 shadow-sm`},[s(`div`,ce,[s(`div`,null,[r[17]||=s(`span`,{class:`text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1`},`Bill Number`,-1),s(`h4`,le,o(t.billNo),1),s(`p`,ue,`Generated: `+o(q(t.generatedAt)),1)]),s(`div`,de,[s(`span`,{class:u([`px-2.5 py-1 rounded-md text-[10px] font-bold border`,{"bg-emerald-50 text-emerald-700 border-emerald-200":t.status===`PAID`,"bg-amber-50 text-amber-700 border-amber-200":t.status===`PARTIALLY_PAID`,"bg-rose-50 text-rose-700 border-rose-200":t.status===`DRAFT`||t.status===`UNPAID`}])},o(t.status),3),s(`div`,fe,[s(`button`,{onClick:e=>Q(t),class:`px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1`},[...r[18]||=[s(`svg`,{class:`w-4 h-4`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2`,d:`M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z`})],-1),p(` Print `,-1)]],8,pe),t.status===`PAID`?_(``,!0):(e(),c(`button`,{key:0,onClick:e=>W(t),class:`px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors`},` Pay Now `,8,me))])])]),s(`div`,he,[s(`div`,null,[r[19]||=s(`span`,{class:`text-xs text-slate-500`},`Total Amount`,-1),s(`div`,ge,`₹`+o(t.netAmount?.toFixed(2)),1)]),s(`div`,null,[r[20]||=s(`span`,{class:`text-xs text-slate-500`},`Paid Amount`,-1),s(`div`,_e,`₹`+o(t.paidAmount?.toFixed(2)),1)]),s(`div`,null,[r[21]||=s(`span`,{class:`text-xs text-slate-500`},`Balance Amount`,-1),s(`div`,ve,`₹`+o(t.balanceAmount?.toFixed(2)),1)])])]))),128))]))]),B.value?(e(),c(`div`,ye,[s(`div`,be,[s(`div`,xe,[r[23]||=s(`h3`,{class:`font-bold text-slate-800`},`Process Payment`,-1),s(`button`,{onClick:r[0]||=e=>B.value=!1,class:`text-slate-400 hover:text-slate-600`},[...r[22]||=[s(`svg`,{class:`w-5 h-5`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M6 18L18 6M6 6l12 12`})],-1)]])]),s(`div`,Se,[R.value>0?(e(),c(`div`,Ce,[s(`div`,we,[r[24]||=s(`span`,{class:`font-bold text-emerald-800`},`Deduct from Deposit`,-1),s(`span`,Te,`Available: ₹`+o(R.value.toFixed(2)),1)]),s(`div`,Ee,[r[25]||=s(`span`,{class:`absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold`},`₹`,-1),n(s(`input`,{type:`number`,"onUpdate:modelValue":r[1]||=e=>U.value.deductDeposit=e,onInput:G,class:`w-full pl-8 pr-4 py-2 border-emerald-200 rounded-lg text-emerald-800 focus:ring-emerald-500 focus:border-emerald-500 font-mono`},null,544),[[b,U.value.deductDeposit]])])])):_(``,!0),s(`div`,De,[r[27]||=s(`label`,{class:`block text-sm font-bold text-slate-700 mb-1`},`Remaining Balance to Pay`,-1),s(`div`,Oe,[r[26]||=s(`span`,{class:`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold`},`₹`,-1),n(s(`input`,{type:`number`,"onUpdate:modelValue":r[2]||=e=>U.value.amount=e,readonly:``,class:`w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-lg text-slate-800`},null,512),[[b,U.value.amount]])])]),U.value.amount>0?(e(),c(`div`,ke,[r[29]||=s(`label`,{class:`block text-sm font-bold text-slate-700 mb-1`},`Payment Mode`,-1),n(s(`select`,{"onUpdate:modelValue":r[3]||=e=>U.value.paymentMode=e,class:`w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500`},[...r[28]||=[s(`option`,{value:`CASH`},`Cash`,-1),s(`option`,{value:`UPI`},`UPI`,-1),s(`option`,{value:`CARD`},`Card`,-1),s(`option`,{value:`BANK_TRANSFER`},`Bank Transfer`,-1)]],512),[[x,U.value.paymentMode]])])):_(``,!0),U.value.amount>0&&[`UPI`,`CARD`,`BANK_TRANSFER`].includes(U.value.paymentMode)?(e(),c(`div`,Ae,[r[30]||=s(`label`,{class:`block text-sm font-bold text-slate-700 mb-1`},`Transaction/Reference No.`,-1),n(s(`input`,{type:`text`,"onUpdate:modelValue":r[4]||=e=>U.value.transactionNo=e,class:`w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500`,placeholder:`Enter reference number`},null,512),[[b,U.value.transactionNo]])])):_(``,!0),s(`div`,null,[r[31]||=s(`label`,{class:`block text-sm font-bold text-slate-700 mb-1`},`Remarks (Optional)`,-1),n(s(`input`,{type:`text`,"onUpdate:modelValue":r[5]||=e=>U.value.remarks=e,class:`w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500`,placeholder:`Any comments...`},null,512),[[b,U.value.remarks]])])]),s(`div`,je,[s(`button`,{onClick:r[6]||=e=>B.value=!1,class:`px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors`},`Cancel`),s(`button`,{onClick:K,disabled:V.value,class:`px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2`},[V.value?(e(),c(`span`,Ne,`Processing...`)):(e(),c(`span`,Pe,`Confirm Payment`))],8,Me)])])])):_(``,!0),l(w,{show:J.value,admission:a.admission,billDetails:Y.value,onClose:r[7]||=e=>J.value=!1},null,8,[`show`,`admission`,`billDetails`])]))}},F={class:`p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col`},I={class:`flex-1 min-h-0 flex gap-6`},L={class:`w-[400px] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-shrink-0`},R={class:`p-4 border-b border-slate-100 space-y-3 bg-slate-50/50`},z={class:`relative`},B={class:`flex gap-2`},V={class:`flex-1 overflow-y-auto p-3`},H={key:0,class:`flex justify-center py-8`},U={key:1,class:`text-center py-8`},W={key:2,class:`space-y-2`},G=[`onClick`],K={key:0,class:`absolute left-0 top-0 bottom-0 w-1 bg-indigo-500`},q={class:`flex justify-between items-start mb-2`},J={class:`text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100`},Y={class:`font-bold text-slate-800 text-base mb-1 truncate`},X={class:`text-xs text-slate-500 space-y-1`},Z={class:`flex items-center gap-1.5`},Q={class:`p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between`},$={class:`text-xs text-slate-500 font-medium`},Fe={class:`flex gap-1`},Ie=[`disabled`],Le=[`disabled`],Re={class:`flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col`},ze={key:0,class:`flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50`},Be={__name:`Index`,setup(r){let l=S(),p=C(),h=t(null),g=t(``),w=t(`ADMITTED`),T=t(1),E=t(10),D=t(1),O=t(0),k=async()=>{try{await p.fetchAdmissions({page:T.value,limit:E.value,search:g.value,status:w.value});let e=p.pagination;e?(D.value=e.pages||1,O.value=e.total||p.admissions.length):(D.value=1,O.value=p.admissions.length)}catch(e){console.error(`Error fetching admissions:`,e),l.show({message:p.error||`Failed to fetch admissions`,type:`error`})}},A=async e=>{h.value=e};v(()=>{k()});let j=()=>{T.value=1,k()},M=e=>e?new Date(e).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`,hour:`2-digit`,minute:`2-digit`}):`-`,N=e=>{switch(e){case`ADMITTED`:return`bg-blue-50 text-blue-700 border-blue-200`;case`DISCHARGED`:return`bg-emerald-50 text-emerald-700 border-emerald-200`;default:return`bg-slate-50 text-slate-700 border-slate-200`}};return(t,r)=>(e(),c(`div`,F,[r[12]||=s(`div`,{class:`mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4`},[s(`div`,null,[s(`h1`,{class:`text-2xl font-bold text-slate-800`},`IPD Payments`),s(`p`,{class:`text-sm text-slate-500 mt-1`},`Manage IPD bills and deposit deductions`)])],-1),s(`div`,I,[s(`div`,L,[s(`div`,R,[s(`div`,z,[n(s(`input`,{type:`text`,"onUpdate:modelValue":r[0]||=e=>g.value=e,onKeyup:y(j,[`enter`]),placeholder:`Search by Patient Name or MRN`,class:`w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`},null,544),[[b,g.value]]),r[4]||=s(`svg`,{class:`w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2`,d:`M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z`})],-1)]),s(`div`,B,[n(s(`select`,{"onUpdate:modelValue":r[1]||=e=>w.value=e,onChange:j,class:`flex-1 bg-white border border-slate-200 rounded-xl text-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`},[...r[5]||=[s(`option`,{value:``},`All Statuses`,-1),s(`option`,{value:`ADMITTED`},`Admitted`,-1),s(`option`,{value:`DISCHARGED`},`Discharged`,-1)]],544),[[x,w.value]])])]),s(`div`,V,[a(p).loading?(e(),c(`div`,H,[...r[6]||=[s(`div`,{class:`animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600`},null,-1)]])):a(p).admissions.length===0?(e(),c(`div`,U,[...r[7]||=[s(`p`,{class:`text-slate-500 text-sm`},`No admissions found`,-1)]])):(e(),c(`div`,W,[(e(!0),c(d,null,i(a(p).admissions,t=>(e(),c(`button`,{key:t._id,onClick:e=>A(t),class:u([`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden`,h.value?._id===t._id?`bg-indigo-50 border-indigo-200 shadow-sm`:`bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50`])},[h.value?._id===t._id?(e(),c(`div`,K)):_(``,!0),s(`div`,q,[s(`span`,J,o(t.patientId?.mrn),1),s(`span`,{class:u([`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider`,N(t.status)])},o(t.status),3)]),s(`h3`,Y,o(t.patientId?.fullName||`Unknown Patient`),1),s(`div`,X,[s(`div`,Z,[r[8]||=s(`svg`,{class:`w-3.5 h-3.5 text-slate-400`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2`,d:`M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z`})],-1),s(`span`,null,`Admitted: `+o(M(t.admissionDate)),1)])])],10,G))),128))]))]),s(`div`,Q,[s(`span`,$,`Page `+o(T.value)+` of `+o(D.value),1),s(`div`,Fe,[s(`button`,{onClick:r[2]||=e=>T.value>1&&(T.value--,k()),disabled:T.value===1,class:`p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100`},[...r[9]||=[s(`svg`,{class:`w-4 h-4`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2`,d:`M15 19l-7-7 7-7`})],-1)]],8,Ie),s(`button`,{onClick:r[3]||=e=>T.value<D.value&&(T.value++,k()),disabled:T.value===D.value,class:`p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100`},[...r[10]||=[s(`svg`,{class:`w-4 h-4`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2`,d:`M9 5l7 7-7 7`})],-1)]],8,Le)])])]),s(`div`,Re,[h.value?(e(),f(P,{key:1,admission:h.value,onPaymentSuccess:k},null,8,[`admission`])):(e(),c(`div`,ze,[...r[11]||=[m(`<div class="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100"><svg class="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></div><h3 class="text-lg font-bold text-slate-800">No Admission Selected</h3><p class="text-sm text-slate-500 max-w-sm mt-2">Select an admission from the list on the left to view and process IPD bills and deposit deductions.</p>`,3)]]))])])]))}};export{Be as default};