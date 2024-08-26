const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the JobRole schema
const jobRoleSchema = new Schema({
  jobRole: { type: String, required: true },
  jobDescription: { type: String, required: true },
  jobPolicy: { type: String },
  employees: [{ type: Schema.Types.ObjectId, ref: "Employee" }],
  salary: { type: Number, required: true },
});

// Create the JobRole model
const JobRole = mongoose.model("JobRole", jobRoleSchema);

module.exports = JobRole;
