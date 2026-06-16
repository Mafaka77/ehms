const mongoose = require('mongoose')
const sampleTypeSchema = new mongoose.Schema({

  code: String,

  name: {
    type: String,
    required: true
  }

}, { timestamps: true })

module.exports = mongoose.model('SampleType', sampleTypeSchema)
