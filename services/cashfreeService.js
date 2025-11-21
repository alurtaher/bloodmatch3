const { Cashfree, CFEnvironment } = require("cashfree-pg");

// Initialize Cashfree SDK in SANDBOX mode
const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,
  "TEST430329ae80e0f32e41a393d78b923034", // Need to Replace with our actual credentials in PRODUCTION
  "TESTaf195616268bd6202eeb3bf8dc458956e7192a85"
);

// Create Order Function
exports.createOrder = async ({
  orderId,
  orderAmount,
  orderCurrency = "INR",
  userId,
  customerPhone,
}) => {
  try {
    if (!userId) {
      throw new Error("userId is undefined in createOrder");
    }
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const formattedExpiryDate = expiryDate.toISOString();

    const request = {
      order_id: orderId.toString(),
      order_amount: Number(orderAmount),
      order_currency: orderCurrency,

      customer_details: {
        customer_id: userId.toString(),
        customer_phone: customerPhone.toString(),
        customer_email: "test@example.com", // Required in SANDBOX
      },

      order_meta: {
        return_url: `http://localhost:3000/purchase/updateTransactionStatus/${orderId}`,
        payment_methods: "cc,dc,upi",
      },

      order_expiry_time: formattedExpiryDate,
    };

    console.log("Sending order to Cashfree:", request);

    const response = await cashfree.PGCreateOrder(request);

    return response.data.payment_session_id;
  } catch (error) {
    console.error(
      "Error Creating Order:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Get Payment Status Function
exports.getPaymentStatus = async (orderId) => {
  try {
    const response = await cashfree.PGOrderFetchPayments(orderId.toString());
    const transactions = response.data;

    let status = "FAILED";
    if (transactions.some((txn) => txn.payment_status === "SUCCESS")) {
      status = "SUCCESS";
    } else if (transactions.some((txn) => txn.payment_status === "PENDING")) {
      status = "PENDING";
    }

    return status;
  } catch (error) {
    console.error(
      "Error fetching order status:",
      error.response?.data || error.message
    );
    throw error;
  }
};