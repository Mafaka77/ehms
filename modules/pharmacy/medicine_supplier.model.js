const mongoose = require('mongoose')
const Counter = require('../common/counter.model')

const supplierSchema =
new mongoose.Schema({

  supplierCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },

  supplierName: {
    type: String,
    required: true
  },

  contactPerson: {
    type: String,
    default: null
  },

  mobileNo: {
    type: String,
    default: null
  },

  email: {
    type: String,
    default: null
  },

  gstNo: {
    type: String,
    default: null
  },

  address: {
    type: String,
    default: null
  },

  city: {
    type: String,
    default: null
  },

  state: {
    type: String,
    default: null
  },

  pincode: {
    type: String,
    default: null
  },

  isActive: {
    type: Boolean,
    default: true
  }

},{
  timestamps: true
})

supplierSchema.pre('validate', async function() {
  if (!this.supplierCode) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'medicineSupplierCode' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const sequenceStr = String(counter.seq).padStart(4, '0');
    this.supplierCode = `EH-PSUP-${sequenceStr}`;
  }
});

module.exports =
mongoose.model(
  'Supplier',
  supplierSchema
)