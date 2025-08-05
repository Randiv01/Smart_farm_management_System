const express = require("express");
const mongoose = require("mongoose");
const router = require("./routes/UserRoute"); // ✅ Correct path

const app = express();
const cors = require("cors");

app.use(express.json()); // to parse JSON body
app.use(cors());
app.use("/users", router); // ✅ Use this instead of app.get()

mongoose.connect("mongodb+srv://randiv:randiv123@cluster0.j8suyzq.mongodb.net/")
  .then(() => {
    console.log("Connected successfully to MongoDB");
    app.listen(5000, () => {
      console.log("Server is running on port 5000");
    });
  })
  .catch((err) => {
    console.log("Database connection failed:", err);
  });
