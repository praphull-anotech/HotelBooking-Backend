const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the BedType schema
const bedTypeSchema = new Schema({
  type: {
    type: String,
    enum: ["single", "double", "queen", "king", "other"],
    required: true
  },
  capacity: {
    adults: { type: Number, required: true },
    children: { type: Number, required: true }
  }
});

// Create the BedType model
const BedType = mongoose.model("BedType", bedTypeSchema);

module.exports = BedType;
