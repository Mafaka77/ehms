const mongoose = require('mongoose')

module.exports = function softDeletePlugin(schema) {
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  })

  schema.methods.softDelete = function() {
    this.isDeleted = true
    this.deletedAt = new Date()
    return this.save()
  }

  schema.statics.softDelete = function(filter) {
    return this.updateMany(filter, { isDeleted: true, deletedAt: new Date() })
  }

  // Exclude soft-deleted documents from find operations
  schema.pre(/^find/, function() {
    const query = this.getQuery()
    if (query && query.isDeleted === undefined) {
      this.find({ isDeleted: { $ne: true } })
    }
  })

  // Exclude soft-deleted documents from count operations
  schema.pre(/^count/, function() {
    const query = this.getQuery()
    if (query && query.isDeleted === undefined) {
      this.find({ isDeleted: { $ne: true } })
    }
  })
}
