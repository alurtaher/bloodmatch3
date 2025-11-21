const express = require("express");

const purchaseMembershipController = require("../controllers/purchaseMembershipController");

const {protect} = require("../middleware/auth");

const router = express.Router();

router.get(
  "/premiumMembership",
  protect,
  purchaseMembershipController.purchasePremium
);

router.post(
  "/updateTransactionStatus/:orderId",
  protect,
  purchaseMembershipController.updateTransactionStatus
);

module.exports = router;