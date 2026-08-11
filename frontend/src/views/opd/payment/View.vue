<template>
  <div class="h-full flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">OPD Appointment Details</span>
        <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2 mt-0.5">
          <span class="font-mono">{{ appointment.appointmentId }}</span>
          <span 
            v-if="appointment.status === 'Completed'" 
            class="px-2 py-0.5 text-[10px] font-bold rounded uppercase border bg-slate-100 text-slate-700 border-slate-200"
          >
            COMPLETED
          </span>
          <span 
            v-else-if="appointment.status === 'Booked'" 
            class="px-2 py-0.5 text-[10px] font-bold rounded uppercase border bg-blue-100 text-blue-700 border-blue-200"
          >
            BOOKED
          </span>
        </h2>
      </div>
      <div class="text-right flex items-center gap-2">
        <span v-if="appointment.paymentMode || getPaymentModeText(consultationBill || chargesBill)" class="px-2.5 py-1 text-xs font-bold font-mono uppercase tracking-wider rounded-md border bg-slate-100 text-slate-700 border-slate-200">
          Mode: {{ appointment.paymentMode || getPaymentModeText(consultationBill || chargesBill) }}
        </span>
        <span :class="['px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md border', getPaymentStatusColor(appointment.paymentStatus)]">
          {{ appointment.paymentStatus || 'Unpaid' }}
        </span>
      </div>
    </div>

    <!-- Main Content Area -->
    <div v-if="isInitializing" class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- Skeleton Loading -->
      <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-pulse">
        <div class="bg-slate-100 border-b border-slate-200 px-5 py-4 flex justify-between items-center">
          <div class="h-4 bg-slate-300 rounded w-1/3"></div>
          <div class="h-6 w-16 bg-slate-300 rounded-md"></div>
        </div>
        <div class="p-5 space-y-4">
          <div class="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
          <div class="h-16 bg-slate-100 rounded-lg w-full border border-slate-200"></div>
          <div class="flex justify-end gap-3 pt-2">
            <div class="h-8 w-24 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 overflow-y-auto p-6 space-y-6">

      <!-- Patient & Doctor Info Bar -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
        <div>
          <h4 class="font-semibold uppercase text-slate-400">Patient Details</h4>
          <p class="font-bold text-slate-800 mt-1 flex items-center gap-1.5 flex-wrap">
            {{ appointment.patientId?.fullName }}
            <span v-if="appointment.patientId?.isEmployee" class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
              Staff ({{ appointment.patientId?.employeeCode }})
            </span>
          </p>
          <p class="text-slate-500 font-mono mt-0.5">{{ appointment.patientId?.patientCode }}</p>
          <p class="text-slate-500 mt-0.5">{{ appointment.patientId?.gender }} • {{ appointment.patientId?.age }} Years • Mob: {{ appointment.patientId?.mobileNo }}</p>
        </div>
        <div>
          <h4 class="font-semibold uppercase text-slate-400">Consultation Details</h4>
          <p class="font-bold text-slate-800 mt-1">{{ appointment.doctorId?.fullName || 'N/A' }}</p>
          <p class="text-slate-500 mt-0.5">Specialization: {{ appointment.doctorId?.specializationId?.name || '-' }}</p>
          <p class="text-slate-500 mt-0.5">Date: {{ formatDate(appointment.appointmentDate) }}</p>
        </div>
      </div>

      <!-- STAGE 1: REGISTRATION / CONSULTATION FEE -->
      <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div class="bg-indigo-50 border-b border-slate-200 px-5 py-3 flex justify-between items-center">
          <h3 class="font-bold text-indigo-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Stage 1: Registration / Consultation Fee
          </h3>
          <span :class="['px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border', getPaymentStatusColor(consultationStatus)]">
            {{ consultationStatus }}
          </span>
        </div>

        <div class="p-5 space-y-4">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th class="px-2 py-2">Item Details</th>
                <th class="px-2 py-2 text-right">Rate</th>
                <th class="px-2 py-2 text-center">Qty</th>
                <th class="px-2 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr class="hover:bg-slate-50/50">
                <td class="px-2 py-3 font-medium text-slate-800">OPD Consultation Fee - {{ appointment.doctorId?.fullName || 'General' }}</td>
                <td class="px-2 py-3 text-right font-mono">{{ formatCurrency(appointment.consultationFee) }}</td>
                <td class="px-2 py-3 text-center font-mono">1</td>
                <td class="px-2 py-3 text-right font-mono font-semibold">{{ formatCurrency(appointment.consultationFee) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Discount Options (Before Bill Generation) -->
          <div v-if="!consultationBill" class="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer font-bold text-slate-700 uppercase select-none">
                <input type="checkbox" v-model="showDiscount" class="text-indigo-600 focus:ring-indigo-500 rounded border-slate-300">
                Apply Discount
              </label>
              <span v-if="showDiscount" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                Discount Enabled
              </span>
            </div>

            <div v-if="showDiscount" class="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/50">
              <div class="col-span-2 sm:col-span-1">
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Discount Type</label>
                <select 
                  v-model="discountMode"
                  class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="free">Free Clinic (100%)</option>
                  <option value="doctor">Doctor Discount</option>
                </select>
              </div>

              <!-- Doctor Search Select -->
              <div v-if="discountMode === 'doctor'" class="col-span-2 sm:col-span-1 relative">
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search Doctor <span class="text-rose-500">*</span></label>
                
                <div v-if="selectedDoctor" class="flex items-center justify-between px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div class="flex flex-col overflow-hidden w-full">
                    <span class="text-xs font-bold text-indigo-900 truncate">{{ selectedDoctor.fullName }}</span>
                    <span class="text-[9px] text-indigo-700 font-mono truncate">{{ selectedDoctor.doctorCode }}</span>
                  </div>
                  <button type="button" @click="clearDoctor" class="text-indigo-400 hover:text-indigo-600 focus:outline-none ml-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div v-else>
                  <input 
                    v-model="doctorSearchQuery"
                    type="text" 
                    placeholder="Name or doctor code..." 
                    class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div v-if="doctorSearchResults.length > 0" class="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <ul class="py-0.5 divide-y divide-slate-50">
                      <li 
                        v-for="doc in doctorSearchResults" 
                        :key="doc._id"
                        @click="selectDoctor(doc)"
                        class="px-2.5 py-1.5 hover:bg-slate-50 cursor-pointer flex flex-col"
                      >
                        <span class="text-xs font-semibold text-slate-800">{{ doc.fullName }}</span>
                        <span class="text-[10px] text-slate-500 font-mono">{{ doc.doctorCode }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Reason/Remarks Input -->
              <div class="col-span-2">
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Discount Reason / Remarks</label>
                <input 
                  v-model="discountRemarks"
                  type="text"
                  placeholder="e.g. Free clinic scheme, Doctor recommendation..."
                  class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          <div v-if="consultationBill" class="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs border border-slate-100">
            <div class="space-y-1">
              <p class="text-slate-500">Bill No: <span class="font-mono font-bold text-slate-800">{{ consultationBill.billNo }}</span></p>
              <p class="text-slate-500">Generated: {{ formatDate(consultationBill.generatedAt) }}</p>
              <p v-if="getPaymentModeText(consultationBill)" class="text-slate-600 flex items-center gap-1.5 pt-0.5">
                <span>Payment Mode:</span>
                <span class="font-bold text-indigo-700 font-mono uppercase bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md text-[11px]">
                  {{ getPaymentModeText(consultationBill) }}
                </span>
              </p>
            </div>
            <div class="text-left sm:text-right">
              <p class="font-semibold text-slate-800">Net Amount: <span class="text-sm font-mono text-indigo-600 font-bold">{{ formatCurrency(consultationBill.netAmount) }}</span></p>
              <p class="text-slate-500 font-medium mt-0.5">Balance: {{ formatCurrency(consultationBill.balanceAmount) }}</p>
            </div>
          </div>

          <!-- Consultation Bill Payments Table -->
          <div v-if="consultationBill && consultationBill.payments && consultationBill.payments.length > 0" class="border border-slate-200/80 rounded-xl overflow-hidden text-xs shadow-xs">
            <div class="bg-slate-100/70 px-4 py-2 font-bold text-slate-700 border-b border-slate-200/60 flex items-center justify-between">
              <span>Payment History</span>
              <span class="text-[10px] text-slate-500 font-semibold">{{ consultationBill.payments.length }} Transaction(s)</span>
            </div>
            <table class="w-full text-left">
              <thead class="bg-slate-50 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th class="px-3 py-2">Receipt / Txn No</th>
                  <th class="px-3 py-2">Date</th>
                  <th class="px-3 py-2">Payment Mode</th>
                  <th class="px-3 py-2 text-right">Amount</th>
                  <th class="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="pay in consultationBill.payments" :key="pay._id" class="hover:bg-slate-50/50">
                  <td class="px-3 py-2.5 font-mono font-semibold text-slate-800">
                    {{ pay.paymentNo }}
                    <span v-if="pay.transactionNo" class="text-[10px] text-slate-400 font-normal block">Ref: {{ pay.transactionNo }}</span>
                  </td>
                  <td class="px-3 py-2.5 text-slate-500">{{ formatDate(pay.createdAt) }}</td>
                  <td class="px-3 py-2.5">
                    <span class="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {{ pay.paymentMode }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-right font-mono font-bold text-slate-800">{{ formatCurrency(pay.amount) }}</td>
                  <td class="px-3 py-2.5 text-center">
                    <span :class="['px-1.5 py-0.5 text-[9px] font-bold rounded uppercase border', pay.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100']">
                      {{ pay.status || 'SUCCESS' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex gap-3 justify-end pt-2">
            <button 
              v-if="!consultationBill"
              @click="generateConsultationBill"
              :disabled="loadingConsultation || (showDiscount && discountMode === 'doctor' && !selectedDoctor)"
              class="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl font-semibold text-xs shadow transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <span v-if="loadingConsultation" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              Generate Consultation Bill
            </button>
            <template v-else>
              <button 
                v-if="consultationBill.status !== 'PAID'"
                @click="emit('pay-clicked', consultationBill)"
                class="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl font-semibold text-xs shadow transition-all cursor-pointer"
              >
                Process Payment ({{ formatCurrency(consultationBill.balanceAmount) }})
              </button>
              <button 
                v-if="consultationBill.status === 'PAID'"
                @click="printBill(consultationBill)"
                class="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-2 px-4 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Print Invoice
              </button>
              <button 
                @click="cancelBill(consultationBill)"
                :disabled="loadingCancel === consultationBill._id"
                class="bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 py-2 px-3 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {{ consultationBill.status === 'PAID' ? 'Refund & Cancel' : 'Cancel Bill' }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- STAGE 2: PROCEDURES & INVESTIGATIONS (TREATMENT CHARGES) -->
      <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div class="bg-amber-50 border-b border-slate-200 px-5 py-3 flex justify-between items-center">
          <h3 class="font-bold text-amber-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            Stage 2: Procedures & Investigations (Treatment Charges)
          </h3>
          <span :class="['px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border', getPaymentStatusColor(chargesStatus)]">
            {{ chargesStatus }}
          </span>
        </div>

        <div class="p-5 space-y-4">
          <div class="max-h-80 overflow-y-auto pr-1">
            <table class="w-full text-left text-xs relative">
              <thead class="text-slate-400 uppercase font-semibold border-b border-slate-100 sticky top-0 bg-white z-10 shadow-xs">
                <tr>
                  <th class="px-2 py-2">Item Details</th>
                  <th class="px-2 py-2 text-right">Rate</th>
                  <th class="px-2 py-2 text-center">Qty</th>
                  <th class="px-2 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="patientCharges.length === 0" class="hover:bg-slate-50/50">
                  <td colspan="4" class="px-2 py-4 text-center text-slate-500 text-xs">No additional treatment charges added for this appointment.</td>
                </tr>
                <tr v-for="charge in patientCharges" :key="charge._id" class="hover:bg-slate-50/50">
                  <td class="px-2 py-3 text-slate-700">
                    <p class="font-bold text-slate-800">{{ charge.description }}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">{{ charge.chargeCategoryId?.name || 'General' }} • {{ formatDate(charge.createdAt) }}</p>
                    <div v-if="charge.doctorId" class="text-[10px] text-indigo-600 font-bold mt-1 inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                      {{ charge.doctorId.fullName || charge.doctorId.name }}
                    </div>
                    <!-- Addon badges -->
                    <div v-if="charge.addons && charge.addons.length > 0" class="mt-1.5 flex flex-wrap gap-1">
                      <span 
                        v-for="addon in charge.addons" 
                        :key="addon._id" 
                        class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-teal-50 text-teal-800 border border-teal-100 inline-flex items-center gap-1.5"
                      >
                        <span>{{ addon.itemName }}</span>
                        <span v-if="addon.doctorId" class="px-1 py-0.2 text-[8px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 rounded">
                          {{ addon.doctorId.fullName || addon.doctorId.name || addon.doctorId }}
                        </span>
                        <span class="text-slate-500 font-extrabold">(₹{{ addon.amount?.toLocaleString() }})</span>
                      </span>
                    </div>
                  </td>
                  <td class="px-2 py-3 text-right font-mono">{{ formatCurrency(charge.rate) }}</td>
                  <td class="px-2 py-3 text-center font-mono">{{ charge.quantity }}</td>
                  <td class="px-2 py-3 text-right font-mono font-semibold">
                    {{ formatCurrency((charge.amount || 0) + (charge.addons || []).reduce((s, a) => s + (a.amount || 0), 0)) }}
                  </td>
                </tr>
                <tr class="bg-slate-50/50 font-bold border-t border-slate-100" v-if="patientCharges.length > 0">
                  <td colspan="3" class="px-2 py-3 text-slate-800 text-right">Total Charges Subtotal:</td>
                  <td class="px-2 py-3 text-right font-mono text-indigo-600 font-bold">{{ formatCurrency(totalChargesAmount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="chargesBill" class="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs border border-slate-100">
            <div class="space-y-1">
              <p class="text-slate-500">Bill No: <span class="font-mono font-bold text-slate-800">{{ chargesBill.billNo }}</span></p>
              <p class="text-slate-500">Generated: {{ formatDate(chargesBill.generatedAt) }}</p>
              <p v-if="getPaymentModeText(chargesBill)" class="text-slate-600 flex items-center gap-1.5 pt-0.5">
                <span>Payment Mode:</span>
                <span class="font-bold text-indigo-700 font-mono uppercase bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md text-[11px]">
                  {{ getPaymentModeText(chargesBill) }}
                </span>
              </p>
            </div>
            <div class="text-left sm:text-right">
              <p class="font-semibold text-slate-800">Net Amount: <span class="text-sm font-mono text-indigo-600 font-bold">{{ formatCurrency(chargesBill.netAmount) }}</span></p>
              <p class="text-slate-500 font-medium mt-0.5">Balance: {{ formatCurrency(chargesBill.balanceAmount) }}</p>
            </div>
          </div>

          <!-- Treatment Charges Bill Payments Table -->
          <div v-if="chargesBill && chargesBill.payments && chargesBill.payments.length > 0" class="border border-slate-200/80 rounded-xl overflow-hidden text-xs shadow-xs">
            <div class="bg-slate-100/70 px-4 py-2 font-bold text-slate-700 border-b border-slate-200/60 flex items-center justify-between">
              <span>Payment History</span>
              <span class="text-[10px] text-slate-500 font-semibold">{{ chargesBill.payments.length }} Transaction(s)</span>
            </div>
            <table class="w-full text-left">
              <thead class="bg-slate-50 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th class="px-3 py-2">Receipt / Txn No</th>
                  <th class="px-3 py-2">Date</th>
                  <th class="px-3 py-2">Payment Mode</th>
                  <th class="px-3 py-2 text-right">Amount</th>
                  <th class="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="pay in chargesBill.payments" :key="pay._id" class="hover:bg-slate-50/50">
                  <td class="px-3 py-2.5 font-mono font-semibold text-slate-800">
                    {{ pay.paymentNo }}
                    <span v-if="pay.transactionNo" class="text-[10px] text-slate-400 font-normal block">Ref: {{ pay.transactionNo }}</span>
                  </td>
                  <td class="px-3 py-2.5 text-slate-500">{{ formatDate(pay.createdAt) }}</td>
                  <td class="px-3 py-2.5">
                    <span class="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {{ pay.paymentMode }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-right font-mono font-bold text-slate-800">{{ formatCurrency(pay.amount) }}</td>
                  <td class="px-3 py-2.5 text-center">
                    <span :class="['px-1.5 py-0.5 text-[9px] font-bold rounded uppercase border', pay.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100']">
                      {{ pay.status || 'SUCCESS' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex gap-3 justify-end pt-2">
            <button 
              v-if="!chargesBill && unbilledChargesCount > 0"
              @click="generateChargesBill"
              :disabled="loadingCharges"
              class="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-xl font-semibold text-xs shadow transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <span v-if="loadingCharges" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              Generate Charges Bill
            </button>
            <template v-else-if="chargesBill">
              <button 
                v-if="chargesBill.status !== 'PAID'"
                @click="emit('pay-clicked', chargesBill)"
                class="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl font-semibold text-xs shadow transition-all cursor-pointer"
              >
                Process Payment ({{ formatCurrency(chargesBill.balanceAmount) }})
              </button>
              <button 
                v-if="chargesBill.status === 'PAID'"
                @click="printBill(chargesBill)"
                class="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-2 px-4 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Print Invoice
              </button>
              <button 
                @click="cancelBill(chargesBill)"
                :disabled="loadingCancel === chargesBill._id"
                class="bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 py-2 px-3 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {{ chargesBill.status === 'PAID' ? 'Refund & Cancel' : 'Cancel Bill' }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Printable Invoice Modal -->
    <OpdInvoiceModal 
      v-if="showInvoiceModal" 
      :show="showInvoiceModal" 
      :appointment="appointment" 
      :bill-details="activePrintBill"
      :patient-charges="patientCharges"
      @close="closeInvoiceModal" 
    />
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import api from '../../../axios/api'
import { useSnackbarStore } from '../../../stores/snackbarStore'
import { useOpdStore } from '../../../stores/opdStore'
import OpdInvoiceModal from './Invoice.vue'

const props = defineProps({
  appointment: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['bill-generated', 'pay-clicked'])
const snackbarStore = useSnackbarStore()
const opdStore = useOpdStore()

const showInvoiceModal = ref(false)
const activePrintBill = ref(null)

const consultationBill = ref(null)
const chargesBill = ref(null)

const patientCharges = ref([])
const isInitializing = ref(false)

const showDiscount = ref(false)
const discountMode = ref('free') // 'free', 'doctor'
const discountRemarks = ref('')
const doctorSearchQuery = ref('')
const isSearchingDoctors = ref(false)
const doctorSearchResults = ref([])
const selectedDoctor = ref(null)

const searchDoctors = async () => {
  if (doctorSearchQuery.value.length < 2) {
    doctorSearchResults.value = []
    return
  }
  isSearchingDoctors.value = true
  try {
    const res = await api.get('/doctors', { params: { search: doctorSearchQuery.value, limit: 10 } })
    doctorSearchResults.value = res.data.data
  } catch (err) {
    console.error('Error searching doctors:', err)
  } finally {
    isSearchingDoctors.value = false
  }
}

let doctorSearchTimeout = null
watch(doctorSearchQuery, () => {
  if (doctorSearchTimeout) clearTimeout(doctorSearchTimeout)
  if (selectedDoctor.value && doctorSearchQuery.value === selectedDoctor.value.fullName) return
  doctorSearchTimeout = setTimeout(() => {
    searchDoctors()
  }, 400)
})

const selectDoctor = (doc) => {
  selectedDoctor.value = doc
  doctorSearchQuery.value = doc.fullName
  doctorSearchResults.value = []
}

const clearDoctor = () => {
  selectedDoctor.value = null
  doctorSearchQuery.value = ''
}

const fetchBillDetails = async (billId, isConsultation = true) => {
  try {
    const data = await opdStore.fetchBillDetails(billId)
    if (isConsultation) {
      consultationBill.value = data
    } else {
      chargesBill.value = data
    }
  } catch (error) {
    console.error('Error fetching bill details:', error)
  }
}

watch(() => props.appointment, async (newAppt, oldAppt) => {
  if (newAppt) {
    const isSameAppointment = oldAppt && oldAppt._id === newAppt._id
    
    if (!isSameAppointment) {
      isInitializing.value = true
      consultationBill.value = null
      chargesBill.value = null
      patientCharges.value = []
    }

    if (newAppt.consultationBillId || newAppt.billId) {
      await fetchBillDetails(newAppt.consultationBillId || newAppt.billId, true)
    }
    
    if (newAppt.chargesBillId) {
      await fetchBillDetails(newAppt.chargesBillId, false)
    }
    
    // Fetch patient charges
    try {
      const res = await opdStore.fetchPatientCharges(newAppt._id)
      patientCharges.value = res.data || []
    } catch (e) {
      if (!isSameAppointment) patientCharges.value = []
    } finally {
      if (!isSameAppointment) {
        isInitializing.value = false
      }
    }
  } else {
    consultationBill.value = null
    chargesBill.value = null
    patientCharges.value = []
  }
}, { immediate: true })

const totalChargesAmount = computed(() => {
  return patientCharges.value.reduce((sum, c) => {
    const addonsTotal = (c.addons || []).reduce((s, a) => s + (a.amount || 0), 0)
    return sum + (c.amount || 0) + addonsTotal
  }, 0)
})

const unbilledChargesCount = computed(() => {
  return patientCharges.value.filter(c => !c.isBilled).length
})

const consultationStatus = computed(() => {
  if (props.appointment.consultationFee === 0 && !consultationBill.value) return 'Paid'
  if (!consultationBill.value) return 'Unbilled'
  if (consultationBill.value.status === 'PAID' || props.appointment.consultationFee === 0) return 'Paid'
  if (consultationBill.value.status === 'PARTIALLY_PAID') return 'Partial'
  return 'Billed'
})

const chargesStatus = computed(() => {
  if (patientCharges.value.length === 0) return 'No Charges'
  if (!chargesBill.value) return 'Unbilled'
  if (chargesBill.value.status === 'PAID' || chargesBill.value.netAmount === 0) return 'Paid'
  if (chargesBill.value.status === 'PARTIALLY_PAID') return 'Partial'
  return 'Billed'
})

const loadingConsultation = ref(false)
const generateConsultationBill = async () => {
  loadingConsultation.value = true
  try {
    const payload = {
      opdAppointmentId: props.appointment._id,
      discountAmount: showDiscount.value ? props.appointment.consultationFee : 0,
      discountType: showDiscount.value ? (discountMode.value === 'free' ? 'Free Clinic' : 'Doctor Discount') : 'Free Clinic',
      discountRemarks: showDiscount.value ? (discountRemarks.value || (discountMode.value === 'free' ? 'Free Clinic 100%' : `Doctor Discount` + (selectedDoctor.value ? ` - ${selectedDoctor.value.fullName}` : ''))) : ''
    }
    if (showDiscount.value && discountMode.value === 'doctor' && selectedDoctor.value) {
      payload.doctorId = selectedDoctor.value._id
    }
    const data = await opdStore.generateBill(payload)
    snackbarStore.show({ message: 'Consultation bill generated', type: 'success' })
    await fetchBillDetails(data._id, true)
    emit('bill-generated', data)
  } catch (error) {
    snackbarStore.show({ message: error.response?.data?.message || 'Failed to generate consultation bill', type: 'error' })
  } finally {
    loadingConsultation.value = false
  }
}

const loadingCharges = ref(false)
const generateChargesBill = async () => {
  loadingCharges.value = true
  try {
    const payload = {
      opdAppointmentId: props.appointment._id,
      discountAmount: 0,
      discountType: 'CUSTOM'
    }
    const data = await opdStore.generateChargesBill(payload)
    snackbarStore.show({ message: 'Treatment charges bill generated', type: 'success' })
    await fetchBillDetails(data._id, false)
    emit('bill-generated', data)
  } catch (error) {
    snackbarStore.show({ message: error.response?.data?.message || 'Failed to generate charges bill', type: 'error' })
  } finally {
    loadingCharges.value = false
  }
}

const printBill = (bill) => {
  activePrintBill.value = bill
  showInvoiceModal.value = true
}

const closeInvoiceModal = () => {
  showInvoiceModal.value = false
  activePrintBill.value = null
}

const loadingCancel = ref(null)
const cancelBill = async (bill) => {
  if (!confirm(`Are you sure you want to cancel bill ${bill.billNo}?`)) return
  loadingCancel.value = bill._id
  try {
    await opdStore.cancelBill(bill._id)
    snackbarStore.show({ message: 'Bill cancelled successfully', type: 'success' })
    if (consultationBill.value && consultationBill.value._id === bill._id) consultationBill.value = null
    if (chargesBill.value && chargesBill.value._id === bill._id) chargesBill.value = null
    emit('bill-generated', null)
  } catch (error) {
    snackbarStore.show({ message: error.response?.data?.message || 'Failed to cancel bill', type: 'error' })
  } finally {
    loadingCancel.value = null
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
  })
}


const getPaymentModeText = (bill) => {
  if (!bill) return null
  if (bill.payments && bill.payments.length > 0) {
    const activePayments = bill.payments.filter(p => p.status === 'SUCCESS' || !p.status)
    const list = activePayments.length > 0 ? activePayments : bill.payments
    const modes = [...new Set(list.map(p => {
      const mode = p.paymentMode || p.mode || 'CASH'
      return p.transactionNo ? `${mode} (${p.transactionNo})` : mode
    }))]
    return modes.join(', ')
  }
  if (bill.paymentMode) return bill.paymentMode
  return null
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0)
}

const getPaymentStatusColor = (status) => {
  switch (status) {
    case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'Unpaid': return 'bg-rose-100 text-rose-700 border-rose-200'
    case 'Billed': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'Partial': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'No Charges': return 'bg-slate-100 text-slate-600 border-slate-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}
</script>
