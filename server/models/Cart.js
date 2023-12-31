const mongoose = require('mongoose');

const { Schema } = mongoose;

const cartSchema = new Schema({
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    }
  ]
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
