const mongoose = require('mongoose');
const Counter = require('../common/counter.model');
const PharmacyIndentSchema = new mongoose.Schema(
  {
    indentNo: {
      type: String,
      unique: true,
      index: true,
    },

    sourceType: {
      type: String,
      enum: [
        "IPD",
        "OPD",
        "EMERGENCY",
        "OT",
        "ICU",
        "NICU",
        "WARD",
        "LABORATORY",
        "STORE",
        "OTHERS"
      ],
      required: true,
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
    },

    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
      default: null,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      default: null,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    priority: {
      type: String,
      enum: ["NORMAL", "URGENT", "STAT"],
      default: "NORMAL",
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "PARTIALLY_ISSUED",
        "COMPLETED",
        "CANCELLED",
        "REJECTED",
      ],
      default: "PENDING",
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

PharmacyIndentSchema.pre('validate', async function() {
  if (!this.indentNo) {
    const prefix = 'EH-INDENT';
    const counter = await Counter.findByIdAndUpdate(
      { _id: prefix },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.indentNo = `${prefix}-${String(counter.seq).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model("PharmacyIndent", PharmacyIndentSchema);