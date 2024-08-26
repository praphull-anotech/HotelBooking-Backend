const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the Room schema
const roomSchema = new Schema({
  room_type: { type: Schema.Types.ObjectId, ref: "RoomType", required: true },
  room_number: { type: String, required: true },
  room_facility: { type: [String], required: true },
  floor: { type: String, required: true },
  status: {
    type: String,
    enum: ["available", "occupied", "under maintenance"],
    required: true,
  },
  bedType: {
    type: String,
    enum: ["single", "double", "queen", "king", "other"],
    required: true,
  },
  capacity: {
    adults: { type: Number, required: true },
    children: { type: Number, required: true },
  },
  price_per_night: { type: Number, required: true }, // Moved from RoomType
  tax: { type: Number, required: true }, // Moved from RoomType
  total_price: { type: Number, required: true }, // Moved from RoomType
  images: [{ type: String, required: true }],
  bookings: [{ type: Schema.Types.ObjectId, ref: "Booking" }]
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
