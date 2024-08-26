const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Review schema
const reviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  Room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

// Create the Review model
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
