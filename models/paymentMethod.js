const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentMethodSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);
module.exports = PaymentMethod;
