const express = require("express");

const app = express();
app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log("Order received:");
  console.log(JSON.stringify(req.body, null, 2));

  res.status(200).send("Webhook received");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});