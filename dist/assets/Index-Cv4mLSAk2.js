import{E as e,G as t,I as n,N as r,O as i,X as a,_t as o,c as s,d as c,h as ee,ht as l,i as u,m as d,p as te,s as ne,u as f,w as re}from"./api-DtA5Tz69.js";import{_ as ie,a as ae,m as oe,r as se,s as ce}from"./index-BdWlwZbH.js";import{t as le}from"./radiologyStore-BtuxiOVY.js";import ue from"./Create-CdE0SEcN.js";var p={class:`space-y-8`},de={class:`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`},fe={class:`flex items-center gap-3 self-start sm:self-auto`},pe=[`disabled`],m={key:0,class:`animate-spin h-4 w-4 text-indigo-600`,xmlns:`http://www.w3.org/2000/svg`,fill:`none`,viewBox:`0 0 24 24`},h={key:1,class:`w-4 h-4 text-rose-500`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`},g={class:`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden`},_={class:`p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30`},v={class:`relative w-full md:w-80`},y={key:0,class:`flex flex-col items-center justify-center py-24 text-slate-400`},b={key:1,class:`p-6 text-center text-slate-500 py-24`},x={class:`text-slate-400 text-sm mt-1 max-w-sm mx-auto`},S={key:2,class:`overflow-x-auto`},C={class:`w-full border-collapse text-left`},w={class:`divide-y divide-slate-100`},T=[`onClick`],E={class:`px-6 py-4`},D={class:`flex items-center gap-3`},O={class:`font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors block`},k={class:`px-6 py-4`},A={class:`font-mono text-xs px-2.5 py-1 rounded-md font-bold bg-slate-100 text-slate-700 border border-slate-200`},j={class:`px-6 py-4 max-w-xs truncate text-slate-500 text-sm`},M={class:`px-6 py-4 text-center`},N={class:`flex items-center justify-center gap-2`},P=[`onClick`],F=[`onClick`],I=[`onClick`],L={key:3,class:`px-6 py-4.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/10`},R={class:`text-sm text-slate-500 font-medium`},z={class:`text-slate-800 font-semibold`},B={class:`text-slate-800 font-semibold`},me={class:`text-slate-800 font-semibold`},he={key:0,class:`flex items-center gap-2`},ge=[`disabled`],_e=[`onClick`],ve=[`disabled`],ye={__name:`Index`,setup(ye){let V=le(),H=ce(),U=se(),be=ae(),W=t(!1),G=t(null),K=t(1),q=t(10),J=t(!1),Y=async()=>{try{await V.fetchCategories(K.value,q.value,V.searchQuery)}catch(e){console.error(e)}},X=()=>{G.value=null,W.value=!0},Z=e=>{be.push({name:`radiology-category-view`,params:{id:e._id}})},xe=e=>{G.value=e,W.value=!0},Se=e=>{K.value===1?(V.categories.unshift(e),V.categories.length>q.value&&V.categories.pop(),V.pagination.total++):Y()},Ce=()=>{Y()},we=async()=>{J.value=!0;try{let e=await V.fetchAllTestsForExport();if(!e||e.length===0){H.show({message:`No radiology tests found to export.`,type:`warning`}),J.value=!1;return}let t=[...e].sort((e,t)=>{let n=e.radiologyId?.name||`Unassigned`,r=t.radiologyId?.name||`Unassigned`,i=n.localeCompare(r);return i===0?(e.name||``).localeCompare(t.name||``):i}),n=t.length,r=new Set(t.map(e=>e.radiologyId?.name).filter(Boolean)).size,i=`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Radiology Test Directory & Price List - ${new Date().toLocaleDateString(`en-IN`)}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 18px; line-height: 1.5; font-size: 11px; }
            .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 10px; margin-bottom: 18px; }
            .header h1 { margin: 0; font-size: 20px; color: #4338ca; text-transform: uppercase; letter-spacing: 0.8px; }
            .header p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; }
            
            .meta-bar { display: flex; justify-content: space-between; background: #eef2ff; border: 1px solid #c7d2fe; padding: 10px 14px; border-radius: 8px; font-size: 11px; margin-bottom: 16px; }
            .meta-item { display: flex; flex-direction: column; }
            .meta-label { font-weight: 700; color: #4338ca; text-transform: uppercase; font-size: 9.5px; }
            .meta-val { font-weight: 600; color: #1e293b; margin-top: 2px; }

            table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-bottom: 16px; }
            th { background: #4f46e5; color: #ffffff; text-align: left; padding: 7px 9px; font-weight: 700; text-transform: uppercase; font-size: 9.5px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 7px 9px; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }

            .amount-col { text-align: right; font-weight: 700; font-family: monospace; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
            .badge-active { background: #dcfce7; color: #15803d; }
            .badge-inactive { background: #f1f5f9; color: #64748b; }
            .badge-cat { background: #dbeafe; color: #1e40af; }

            .footer { margin-top: 35px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 170px; }
            .sig-line { border-top: 1px solid #475569; margin-top: 45px; padding-top: 5px; font-weight: 700; color: #1e293b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Hospital Radiology Directory & Price List</h1>
            <p>Imaging & Diagnostic Radiology Investigations Catalogue for Doctors & Clinical Staff</p>
          </div>

          <div class="meta-bar">
            <div class="meta-item">
              <span class="meta-label">Scope</span>
              <span class="meta-val">Complete Radiology Test Directory</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Tests Available</span>
              <span class="meta-val">${n} Scans & Scopes</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Categories Covered</span>
              <span class="meta-val">${r} Modalities</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Generated On</span>
              <span class="meta-val">${new Date().toLocaleString(`en-IN`)}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 4%;">#</th>
                <th style="width: 14%;">Code</th>
                <th style="width: 32%;">Test Name</th>
                <th style="width: 22%;">Radiology Category</th>
                <th style="width: 12%; text-align: right;">Price (₹)</th>
                <th style="width: 16%; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${t.map((e,t)=>{let n=e.radiologyId?.name||`General Radiology`,r=e.radiologyId?.code?` (${e.radiologyId.code})`:``,i=e.rate==null?`₹0.00`:`₹${Number(e.rate).toFixed(2)}`,a=e.isActive===!1?`<span class="badge badge-inactive">Inactive</span>`:`<span class="badge badge-active">Active</span>`;return`
                  <tr>
                    <td>${t+1}</td>
                    <td style="font-family: monospace; font-weight: bold; color: #4338ca;">${e.code||`-`}</td>
                    <td><strong>${e.name}</strong></td>
                    <td><span class="badge badge-cat">${n}${r}</span></td>
                    <td class="amount-col">${i}</td>
                    <td style="text-align: center;">${a}</td>
                  </tr>
                `}).join(``)}
            </tbody>
          </table>

          <div class="footer">
            <div>Document intended for medical practitioners, doctors, and clinical nursing staff.</div>
            <div class="sig-box">
              <div class="sig-line">Radiology Department Head Signature</div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          <\/script>
        </body>
      </html>
    `,a=window.open(``,`_blank`);a.document.write(i),a.document.close()}catch(e){console.error(e),H.show({message:`Failed to export radiology test catalogue PDF`,type:`error`})}finally{J.value=!1}},Q=ne(()=>V.categories),$=null;r(()=>V.searchQuery,()=>{$&&clearTimeout($),$=setTimeout(()=>{K.value=1,Y()},400)}),r([K,q],()=>{Y()});let Te=async e=>{if(confirm(`Are you sure you want to delete "${e.name}"?`)){let t=await V.deleteCategory(e._id);t.success?(H.show({message:t.message,type:`success`}),V.categories.length===0&&K.value>1?K.value--:Y()):H.show({message:t.message,type:`error`})}},Ee=e=>({XRAY:`bg-sky-50 text-sky-600`,USG:`bg-violet-50 text-violet-600`,CT:`bg-amber-50 text-amber-600`,MRI:`bg-indigo-50 text-indigo-600`,CARDIAC:`bg-rose-50 text-rose-600`,NEURO:`bg-teal-50 text-teal-600`,PFT:`bg-emerald-50 text-emerald-600`})[e?.toUpperCase()]||`bg-indigo-50 text-indigo-600`;return re(()=>{Y()}),(t,r)=>(e(),c(`div`,p,[s(`div`,de,[r[9]||=te(`<div><div class="flex items-center gap-3 mb-1"><div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200"><svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18"></path></svg></div><h1 class="text-2xl font-bold text-slate-900">Radiology Categories</h1></div><p class="text-slate-500 text-sm ml-13">Manage imaging and diagnostic radiology service types.</p></div>`,1),s(`div`,fe,[s(`button`,{onClick:we,disabled:J.value,class:`bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-semibold px-4 py-2.5 rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50`},[J.value?(e(),c(`svg`,m,[...r[5]||=[s(`circle`,{class:`opacity-25`,cx:`12`,cy:`12`,r:`10`,stroke:`currentColor`,"stroke-width":`4`},null,-1),s(`path`,{class:`opacity-75`,fill:`currentColor`,d:`M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z`},null,-1)]])):(e(),c(`svg`,h,[...r[6]||=[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2`,d:`M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z`},null,-1)]])),r[7]||=d(` Export Radiology Catalogue (PDF) `,-1)],8,pe),a(U).hasPermission(`radiology.create`)?(e(),c(`button`,{key:0,onClick:X,class:`bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0`},[...r[8]||=[s(`svg`,{class:`w-4.5 h-4.5`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2.5`,d:`M12 4v16m8-8H4`})],-1),d(` Add Category `,-1)]])):f(``,!0)])]),s(`div`,g,[s(`div`,_,[r[11]||=s(`h2`,{class:`text-lg font-semibold text-slate-800`},`All Categories`,-1),s(`div`,v,[r[10]||=s(`span`,{class:`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none`},[s(`svg`,{class:`w-4 h-4 text-slate-400`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2.5`,d:`M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z`})])],-1),n(s(`input`,{"onUpdate:modelValue":r[0]||=e=>a(V).searchQuery=e,type:`text`,placeholder:`Search categories by name or code...`,class:`w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-inner`},null,512),[[oe,a(V).searchQuery]])])]),a(V).loading?(e(),c(`div`,y,[...r[12]||=[s(`svg`,{class:`animate-spin h-10 w-10 text-indigo-600 mb-4`,xmlns:`http://www.w3.org/2000/svg`,fill:`none`,viewBox:`0 0 24 24`},[s(`circle`,{class:`opacity-25`,cx:`12`,cy:`12`,r:`10`,stroke:`currentColor`,"stroke-width":`4`}),s(`path`,{class:`opacity-75`,fill:`currentColor`,d:`M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z`})],-1),s(`span`,{class:`text-sm font-medium`},`Loading categories...`,-1)]])):Q.value.length===0?(e(),c(`div`,b,[r[14]||=s(`svg`,{class:`w-16 h-16 mx-auto text-slate-200 mb-4`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`1.5`,d:`M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18`})],-1),r[15]||=s(`p`,{class:`text-slate-700 font-semibold text-lg`},`No radiology categories found`,-1),s(`p`,x,o(a(V).searchQuery?`No results match your search query. Try searching for a different term.`:`Get started by creating your first radiology category.`),1),!a(V).searchQuery&&a(U).hasPermission(`radiology.create`)?(e(),c(`button`,{key:0,onClick:X,class:`mt-5 inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer`},[...r[13]||=[s(`svg`,{class:`w-4 h-4`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2.5`,d:`M12 4v16m8-8H4`})],-1),d(` Add First Category `,-1)]])):f(``,!0)])):(e(),c(`div`,S,[s(`table`,C,[r[19]||=s(`thead`,null,[s(`tr`,{class:`bg-slate-50 border-b border-slate-100`},[s(`th`,{class:`text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider`},`Category`),s(`th`,{class:`text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider`},`Code`),s(`th`,{class:`text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider`},`Description`),s(`th`,{class:`text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider text-center`},`Status`),s(`th`,{class:`text-slate-500 font-semibold text-xs uppercase px-6 py-4.5 tracking-wider text-center`},`Actions`)])],-1),s(`tbody`,w,[(e(!0),c(u,null,i(Q.value,t=>(e(),c(`tr`,{key:t._id,class:`hover:bg-slate-50/50 transition-colors group cursor-pointer`,onClick:e=>Z(t)},[s(`td`,E,[s(`div`,D,[s(`div`,{class:l([`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0`,Ee(t.code)])},o(t.code?.charAt(0)||`R`),3),s(`div`,null,[s(`span`,O,o(t.name),1)])])]),s(`td`,k,[s(`span`,A,o(t.code),1)]),s(`td`,j,o(t.description||`—`),1),s(`td`,M,[s(`span`,{class:l([t.isActive?`bg-emerald-50 text-emerald-700 border-emerald-200`:`bg-slate-100 text-slate-500 border-slate-200`,`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border`])},[s(`span`,{class:l([t.isActive?`bg-emerald-500`:`bg-slate-400`,`w-1.5 h-1.5 rounded-full mr-1.5`])},null,2),d(` `+o(t.isActive?`Active`:`Inactive`),1)],2)]),s(`td`,{class:`px-6 py-4 text-center`,onClick:r[1]||=ie(()=>{},[`stop`])},[s(`div`,N,[s(`button`,{onClick:e=>Z(t),class:`p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all cursor-pointer`,title:`View Tests in Category`},[...r[16]||=[s(`svg`,{class:`w-4.5 h-4.5`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M15 12a3 3 0 11-6 0 3 3 0 016 0z`}),s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z`})],-1)]],8,P),a(U).hasPermission(`radiology.edit`)?(e(),c(`button`,{key:0,onClick:e=>xe(t),class:`p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all cursor-pointer`,title:`Edit Category`},[...r[17]||=[s(`svg`,{class:`w-4.5 h-4.5`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z`})],-1)]],8,F)):f(``,!0),a(U).hasPermission(`radiology.delete`)?(e(),c(`button`,{key:1,onClick:e=>Te(t),class:`p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer`,title:`Delete Category`},[...r[18]||=[s(`svg`,{class:`w-4.5 h-4.5`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16`})],-1)]],8,I)):f(``,!0)])])],8,T))),128))])])])),a(V).pagination.total>0?(e(),c(`div`,L,[s(`span`,R,[r[20]||=d(` Showing `,-1),s(`span`,z,o((K.value-1)*q.value+1),1),r[21]||=d(` to `,-1),s(`span`,B,o(Math.min(K.value*q.value,a(V).pagination.total)),1),r[22]||=d(` of `,-1),s(`span`,me,o(a(V).pagination.total),1),r[23]||=d(` entries `,-1)]),a(V).pagination.pages>1?(e(),c(`div`,he,[s(`button`,{onClick:r[2]||=e=>K.value>1&&K.value--,disabled:K.value===1,class:`inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer`,title:`Previous Page`},[...r[24]||=[s(`svg`,{class:`w-4 h-4`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2.5`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M15 19l-7-7 7-7`})],-1)]],8,ge),(e(!0),c(u,null,i(a(V).pagination.pages,t=>(e(),c(`button`,{key:t,onClick:e=>K.value=t,class:l([`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all cursor-pointer`,K.value===t?`bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100`:`bg-white border border-slate-200 text-slate-600 hover:bg-slate-50`])},o(t),11,_e))),128)),s(`button`,{onClick:r[3]||=e=>K.value<a(V).pagination.pages&&K.value++,disabled:K.value===a(V).pagination.pages,class:`inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer`,title:`Next Page`},[...r[25]||=[s(`svg`,{class:`w-4 h-4`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`,"stroke-width":`2.5`},[s(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,d:`M9 5l7 7-7 7`})],-1)]],8,ve)])):f(``,!0)])):f(``,!0)]),ee(ue,{show:W.value,category:G.value,onClose:r[4]||=e=>W.value=!1,onCreated:Se,onUpdated:Ce},null,8,[`show`,`category`])]))}};export{ye as default};