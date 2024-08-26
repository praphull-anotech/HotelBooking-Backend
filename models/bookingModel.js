const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the Booking schema
const bookingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { 
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
  },
  room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  room_quantity: { type: Number, default: 1, required: true },
  status: { type: String, enum: ["pending", "confirmed","checkedout", "cancelled"], default: "pending" },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  payment_method: { type: String, enum: ["paypal", "cashfree", "netbanking"], required: true },
  payment: [{ type: Schema.Types.ObjectId, ref: "Payment" }],
  bookingType: {
    type: String,
    enum: ["standard", "advance", "last-minute"],
    required: true,
  },
  discountCoupon: { type: String },
  dueAmount: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  totalBalance: { type: Number, required: true },
  bookingId: { type: String, required: true }
});

// Create the Booking model
const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
