const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the user schema
const userSchema = new Schema({
  userName: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  address: { type: String },
  email: { type: String, required: true },
  password: { type: String, required: true },
  nationality: { type: String },
  dob: { type: Date }, // Date of Birth
  idProof: { type: String, required: true }, // ID proof can be a string representing the document name or URL
  phoneNumber: { type: String, required: true },
  registrationDate: { type: Date, default: Date.now },
  bookings: [{ type: Schema.Types.ObjectId, ref: "Booking" }],
  accountType: {
    type: String,
    enum: ["User", "Admin", "Manager"],
  },
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
});

// Check if the model is already defined before defining it again
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
