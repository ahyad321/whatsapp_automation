const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const SHOPIFY_STORE = "gs-smart-watch-store.myshopify.com"; // <-- change this
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;

async function getProductImage(productId) {
  try {
    const response = await axios.get(
      `https://${SHOPIFY_STORE}/admin/api/2024-01/products/${productId}.json`,
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_TOKEN,
        },
      }
    );

    const product = response.data.product;

    if (product.image && product.image.src) {
      return product.image.src;
    }

    if (product.images && product.images.length > 0) {
      return product.images[0].src;
    }

    return null;
  } catch (error) {
    console.error("Error fetching product:", error.response?.data || error.message);
    return null;
  }
}

app.post("/webhook", async (req, res) => {
  res.status(200).send("OK"); // respond immediately to Shopify

  try {
    const order = req.body;

    const firstProductId = order.line_items[0].product_id;

    const imageUrl = await getProductImage(firstProductId);

    console.log("Fetched Image URL:", imageUrl);
  } catch (err) {
    console.error(err.message);
  }
});

app.listen(3000, () => console.log("Server running"));



