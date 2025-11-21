const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profileRoutes");
const geocodeRoutes = require("./routes/geocodeRoutes");
const purchaseMembershipRouter = require("./routes/purchaseMembershipRoutes");
const reminderRoutes = require('./routes/notificationRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const reminderNotificationService = require('./services/reminderNotificationService');
reminderNotificationService();
dotenv.config();
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/", authRoutes);
app.use('/geocode', geocodeRoutes);
app.use("/profile", profileRoutes);
app.use("/purchase", purchaseMembershipRouter);
app.use('/reminders', reminderRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));