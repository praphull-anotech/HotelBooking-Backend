const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the Service schema
const serviceSchema = new Schema({
  service_name: { type: String, required: true },
  service_description: { type: String, required: true },
  // price: { type: Number, required: true },
  // request_date: { type: Date, default: Date.now },
  // user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  room_type: { type: Schema.Types.ObjectId, ref: "RoomType", required: true },
});

// Create the Service model
const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
