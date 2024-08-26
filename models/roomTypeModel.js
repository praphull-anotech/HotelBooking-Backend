const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the RoomType schema
const roomTypeSchema = new Schema({
  type_name: { type: String, required: true },
  description: { type: String, required: true },
  amenities: [{ type: String, required: true }],
  rooms: [{ type: Schema.Types.ObjectId, ref: "Room" }],
  images: [{ type: String }],
  services: [{ type: String }],
});

const RoomType = mongoose.model("RoomType", roomTypeSchema);

module.exports = RoomType;
