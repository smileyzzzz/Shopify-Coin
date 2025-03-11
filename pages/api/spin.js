import axios from "axios";

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_API_KEY;

const PRIZES = [
  // Common Prizes (65%)
  { name: "Cute Sticker Pack", rarity: "Common", probability: 0.10, image: "/assets/sticker-pack.jpg" },
  { name: "Mini Keychain", rarity: "Common", probability: 0.10, image: "/assets/mini-keychain.jpg" },
  { name: "Small Plushie", rarity: "Common", probability: 0.10, image: "/assets/small-plushie.jpg" },
  { name: "Postcard Set", rarity: "Common", probability: 0.05, image: "/assets/postcard-set.jpg" },
  { name: "Acrylic Pin", rarity: "Common", probability: 0.05, image: "/assets/acrylic-pin.jpg" },
  { name: "Random Gacha Capsule", rarity: "Common", probability: 0.05, image: "/assets/gacha-capsule.jpg" },
  { name: "Phone Charm", rarity: "Common", probability: 0.05, image: "/assets/phone-charm.jpg" },
  { name: "Cute Socks", rarity: "Common", probability: 0.05, image: "/assets/cute-socks.jpg" },
  { name: "Sticker Sheet", rarity: "Common", probability: 0.03, image: "/assets/sticker-sheet.jpg" },
  { name: "Character Badge", rarity: "Common", probability: 0.03, image: "/assets/character-badge.jpg" },
  { name: "Mini Notebook", rarity: "Common", probability: 0.02, image: "/assets/mini-notebook.jpg" },
  { name: "Art Print", rarity: "Common", probability: 0.01, image: "/assets/art-print.jpg" },
  { name: "Cafe Coupon", rarity: "Common", probability: 0.01, image: "/assets/cafe-coupon.jpg" },

  // Rare Prizes (25%)
  { name: "Deluxe Plushie", rarity: "Rare", probability: 0.07, image: "/assets/deluxe-plushie.jpg" },
  { name: "Special Edition Pin", rarity: "Rare", probability: 0.06, image: "/assets/special-pin.jpg" },
  { name: "Holographic Art Print", rarity: "Rare", probability: 0.05, image: "/assets/holo-art-print.jpg" },
  { name: "Themed Tote Bag", rarity: "Rare", probability: 0.04, image: "/assets/themed-tote.jpg" },
  { name: "Limited Edition Keychain", rarity: "Rare", probability: 0.03, image: "/assets/limited-keychain.jpg" },

  // Ultra Rare Prizes (10%)
  { name: "VIP Cafe Membership", rarity: "Ultra Rare", probability: 0.05, image: "/assets/vip-membership.jpg" },
  { name: "Exclusive Collector’s Box", rarity: "Ultra Rare", probability: 0.05, image: "/assets/collectors-box.jpg" }
];

// Function to pick a prize based on weighted probabilities
function pickPrize() {
  const rand = Math.random();
  let cumulativeProbability = 0;
  
  for (const prize of PRIZES) {
    cumulativeProbability += prize.probability;
    if (rand < cumulativeProbability) {
      return prize;
    }
  }
  return PRIZES[0]; // Default fallback
}

// Fetch customer metafields from Shopify
async function getCustomerMetafields(customerId) {
  try {
    const response = await axios.get(
      `https://${SHOPIFY_STORE_URL}/admin/api/2024-01/customers/${customerId}/metafields.json`,
      { headers: { "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN } }
    );
    return response.data.metafields;
  } catch (error) {
    console.error("Error fetching metafields:", error);
    return null;
  }
}

// Update coin balance
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

// Next.js API route handler
export default async function handler(req, res) {
    console.log("Received request:", req.method);

  if (req.method !== "POST") {
    console.log("405 - Method Not Allowed");
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("Processing gacha spin...");

  const { customerId } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: "Customer ID required" });
  }

  try {
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

    // eslint-disable-next-line no-unused-vars
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}
