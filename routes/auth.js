const express = require('express')
const {getStartPage , registerUser, loginUser,getLoginPage,getSignupPage,getDashboardPage} = require("../controllers/auth.js");
const { protect } = require("../middleware/auth.js");

const router = express.Router();

router.get("/", getStartPage);
router.get("/signup", getSignupPage);
router.post("/signup", registerUser);
router.get("/login", getLoginPage);
router.post("/login", loginUser);
router.get('/dashboard',getDashboardPage)


module.exports = router;