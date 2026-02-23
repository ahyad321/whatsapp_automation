const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ===== CONFIG =====
const SHOPIFY_STORE = "gs-smart-watch-store.myshopify.com"; // CHANGE
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;

const BOTBIZ_TOKEN = process.env.BOTBIZ_TOKEN;
const PHONE_NUMBER_ID = "1006116575918464"; // CHANGE

const BOTBIZ_URL = "https://dash.botbiz.io/api/v1/whatsapp/send";

// ===== FETCH PRODUCT IMAGE =====
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

    if (product.image?.src) return product.image.src;
    if (product.images?.length > 0) return product.images[0].src;

    return null;
  } catch (error) {
    console.error("Product fetch error:", error.response?.data || error.message);
    return null;
  }
}

// ===== WEBHOOK =====
app.post("/webhook", async (req, res) => {
  res.status(200).send("OK");

  try {
    const order = req.body;

    const phone =
      order.phone ||
      order.customer?.phone ||
      order.billing_address?.phone;

    if (!phone) {
      console.log("No phone number found");
      return;
    }

    const productList = order.line_items
      .map((item, i) => `${i + 1}. ${item.title}`)
      .join("\n");

    const firstProductId = order.line_items[0].product_id;
    const imageUrl = await getProductImage(firstProductId);

    const templatePayload = {
      name: "order_confirmation_full",
      language: "en",
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: imageUrl
              }
            }
          ]
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: order.customer?.first_name || "Customer" },
            { type: "text", text: order.name },
            { type: "text", text: productList }
          ]
        }
      ]
    };

    const response = await axios.post(BOTBIZ_URL, {
      apiToken: BOTBIZ_TOKEN,
      phone_number_id: PHONE_NUMBER_ID,
      phone_number: phone,
      templateJson: JSON.stringify(templatePayload)
    });

    console.log("Botbiz response:", response.data);

  } catch (error) {
    console.error("Botbiz error:", error.response?.data || error.message);
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

