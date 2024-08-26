const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Department schema
const departmentSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  employees: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  jobs: [{ type: Schema.Types.ObjectId, ref: 'JobRole' }]
});

// Create the Department model
const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
