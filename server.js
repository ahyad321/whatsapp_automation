const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ===== CONFIG =====
const SHOPIFY_STORE = "gs-smart-watch-store.myshopify.com"; // <-- CHANGE THIS
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;
const BOTBIZ_TOKEN = process.env.BOTBIZ_TOKEN;
const BOTBIZ_URL = "https://api.botbiz.io/send-message";

// ===== FETCH PRODUCT IMAGE SAFELY =====
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
    console.error(
      "Error fetching product:",
      error.response?.data || error.message
    );
    return null;
  }
}

// ===== WEBHOOK =====
app.post("/webhook", async (req, res) => {
  // Respond immediately to Shopify (prevents timeout)
  res.status(200).send("OK");

  try {
    const order = req.body;

    const phone =
      order.phone ||
      order.customer?.phone ||
      order.billing_address?.phone;

    if (!phone) {
      console.log("No phone found in order");
      return;
    }

    const firstProductId = order.line_items[0].product_id;
    const imageUrl = await getProductImage(firstProductId);

    const productList = order.line_items
      .map((item, i) => `${i + 1}. ${item.title}`)
      .join("\n");

    // ===== SEND IMAGE =====
    if (imageUrl) {
      await axios.post(
        BOTBIZ_URL,
        {
          to: phone,
          type: "image",
          image: {
            link: imageUrl,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${BOTBIZ_TOKEN}`,
          },
        }
      );
    }

    // ===== SEND TEXT CONFIRMATION =====
    await axios.post(
      BOTBIZ_URL,
      {
        to: phone,
        type: "text",
        text: {
          body: `✅ Order Confirmed ${order.name}

${productList}

Total: ₹${order.total_price}

We’ll notify you when it ships.`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${BOTBIZ_TOKEN}`,
        },
      }
    );

    console.log("WhatsApp message sent successfully");
  } catch (error) {
    console.error(
      "Botbiz error:",
      error.response?.data || error.message
    );
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
