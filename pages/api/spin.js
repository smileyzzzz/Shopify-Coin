import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

const PRIZES = [
  { name: "Common Prize", probability: 0.7 },
  { name: "Rare Prize", probability: 0.25 },
  { name: "Ultra Rare Prize", probability: 0.05 }
];

// Function to pick a prize based on probabilities
function pickPrize() {
  const rand = Math.random();
  let cumulativeProbability = 0;

  for (const prize of PRIZES) {
    cumulativeProbability += prize.probability;
    if (rand < cumulativeProbability) {
      return prize.name;
    }
  }
  return PRIZES[0].name; // Fallback (shouldn't happen)
}

// Get customer metafields
async function getCustomerMetafields(customerId) {
  try {
    const response = await axios.get(
      `https://${SHOPIFY_STORE_URL}/admin/api/2024-01/customers/${customerId}/metafields.json`,
      { headers: { "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN } }
    );
    return response.data.metafields;
  } catch (error) {
    console.error("Error fetching customer metafields:", error);
    return null;
  }
}

// Update customer's coin balance
async function updateCoinBalance(customerId, newBalance) {
  try {
    await axios.post(
      `https://${SHOPIFY_STORE_URL}/admin/api/2024-01/customers/${customerId}/metafields.json`,
      {
        metafield: {
          namespace: "gacha",
          key: "coins_balance",
          type: "integer",
          value: newBalance.toString()
        }
      },
      { headers: { "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN } }
    );
  } catch (error) {
    console.error("Error updating coin balance:", error);
  }
}

// Store prize in metafield
async function storePrize(customerId, prize) {
  try {
    const metafields = await getCustomerMetafields(customerId);
    let prizeHistory = [];

    const existingPrizeField = metafields.find(
      (mf) => mf.namespace === "gacha" && mf.key === "prize_history"
    );

    if (existingPrizeField) {
      prizeHistory = JSON.parse(existingPrizeField.value);
    }

    prizeHistory.push(prize);

    await axios.post(
      `https://${SHOPIFY_STORE_URL}/admin/api/2024-01/customers/${customerId}/metafields.json`,
      {
        metafield: {
          namespace: "gacha",
          key: "prize_history",
          type: "json",
          value: JSON.stringify(prizeHistory)
        }
      },
      { headers: { "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN } }
    );
  } catch (error) {
    console.error("Error storing prize:", error);
  }
}

// Handle spin request
app.post("/gacha/spin", async (req, res) => {
  const { customerId } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: "Customer ID required" });
  }

  // Fetch customer metafields
  const metafields = await getCustomerMetafields(customerId);
  const coinField = metafields.find(
    (mf) => mf.namespace === "gacha" && mf.key === "coins_balance"
  );
  let coins = coinField ? parseInt(coinField.value) : 0;

  if (coins <= 0) {
    return res.status(400).json({ error: "Not enough coins" });
  }

  // Deduct a coin
  coins -= 1;
  await updateCoinBalance(customerId, coins);

  // Determine prize
  const prize = pickPrize();
  await storePrize(customerId, prize);

  res.json({ prize, remainingCoins: coins });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
