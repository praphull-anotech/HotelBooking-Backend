const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentSchema = new Schema({
  booking: {
    type: Schema.Types.ObjectId,
    ref: "Booking", // Reference to the Booking model
    required: true,
  },
  paymentMethod: {
    type: String,
    // required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["Pending", "Success", "Failed"],
    default: "Pending",
  },
  transactionId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
