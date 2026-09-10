const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'GENERAL' // e.g., 'PHARMACY_ORDER', 'APPOINTMENT', 'ADMISSION', 'LAB', 'EMERGENCY', 'SYSTEM'
  },
  department: {
    type: String,
    default: null // e.g. 'pharmacy', 'laboratory', 'nursing', 'doctor', 'billing'
  },
  targetRoles: [{
    type: String // e.g. ['PharmacyManager', 'Pharmacist'], ['Doctor'], ['Nurse']
  }],
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Specific user ID or null for role/broadcast
  },
  data: {
    type: Map,
    of: String,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
