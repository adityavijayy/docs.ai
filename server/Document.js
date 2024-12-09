const mongoose = require("mongoose")

const DocumentSchema = new mongoose.Schema({
  _id: String,
  data: Object
}, { timestamps: true })

module.exports = mongoose.model("Document", DocumentSchema)
