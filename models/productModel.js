const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Product schema
const productSchema = new Schema({
  product_name: { type: String, required: true },
  product_description: { type: String, required: true },
  merchants: [{ type: Schema.Types.ObjectId, ref: 'Merchant', required: true }],
  stock: { type: Number, required: true },
  purchase_date: { type:Date, default:Date.now}
});

// Create the Product model
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
