const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the Employee schema
const employeeSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  dob: { type: Date, required: true },
  doj: { type: Date, required: true }, // Date of Joining
  phoneNumber: { type: String, required: true },
  alternativeNumber: { type: String },
  presentAddress: { type: addressSchema, required: true },
  addresses: [
    {
      city: { type: String },
      state: { type: String },
      homeNumber: { type: String },
      pincode: { type: String },
      landmark: { type: String },
    },
  ],
  permanentAddress: { type: addressSchema, required: true },
  picture_of_employee: { type: String }, // URL or path to the image
  department: {
    type: Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },
  jobRole: { type: Schema.Types.ObjectId, ref: "JobRole", required: true },
  idProof: { type: String }, // URL or path to the ID proof image
  salary: { type: Schema.Types.ObjectId, ref: "JobRole" },
  leaves: { type: Number, default: 0 }, // Number of leaves taken
});

// Create the Employee model
const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
