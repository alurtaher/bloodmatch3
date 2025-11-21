const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  paymentid: {
    type: String
  },
  orderid: {
    type: String
  },
  status: {
    type: String
  },
  userId: {                   
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;