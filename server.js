require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");

const cors = require("cors");
const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port`, process.env.PORT);
      console.log("Connected to MongoDB ^_^");
    });
  })
  .catch((error) => {
    console.log("Connection to MongoDB failed !", error);
  });
app.use(
  cors({
    origin: process.env.CLIENT_DOMAIN,
  })
);

app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/city", require("./routes/cityRoute"));
app.use("/api/location", require("./routes/locationRoute"));
app.use("/api/users", require("./routes/userRoute"));
app.use("/api/car", require("./routes/carRoute"));
app.use("/api/booking", require("./routes/bookingRoute"));
app.use("/api/payment", require("./routes/payRoute"));
