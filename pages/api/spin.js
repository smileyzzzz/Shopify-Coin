import axios from "axios";

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_API_KEY;

const PRIZES = [
  // Common Prizes (65%)
  { name: "Cute Sticker Pack", probability: 0.10, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/sproutkunvinylsticker.jpg?v=1741290061" },
  { name: "Mini Keychain", probability: 0.10, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/charsiubaovinylsticker.jpg?v=1741289925" },
  { name: "Small Plushie", probability: 0.10, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/siumaivinylsticker.jpg?v=1741289652" },
  { name: "Postcard Set", probability: 0.05, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/froggymcfrog.jpg?v=1741289235" },
  { name: "Acrylic Pin", probability: 0.05, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/strawberrymoovinylsticker.jpg?v=1741289068" },
  { name: "Random Gacha Capsule",  probability: 0.05, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/slothvinylsticker.jpg?v=1741286482" },
  { name: "Phone Charm", probability: 0.05, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/slothvinylsticker.jpg?v=1741286482" },
  { name: "Cute Socks", probability: 0.05, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/eggtartbeary.jpg?v=1741286367" },
  { name: "Sticker Sheet", probability: 0.03, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/mushroomfriendvinylsticker.jpg?v=1741286198" },
  { name: "Character Badge", probability: 0.03, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/lightcactusvinylsticker.jpg?v=1741286057" },
  { name: "Mini Notebook", probability: 0.02, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/leafyfriendvinylsticker.jpg?v=1741285751" },
  { name: "Art Print", probability: 0.01, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/minimushroomsvinylsticker.jpg?v=1741285512" },
  { name: "Cafe Coupon", probability: 0.01, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/kittybobavinylsticker.jpg?v=1741285376" },

  // Rare Prizes (25%)
  { name: "Deluxe Plushie", probability: 0.07, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/umbrellamushroom.jpg?v=1741285187" },
  { name: "Special Edition Pin", probability: 0.06, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/bearybubblesvinylsticker.jpg?v=1741279636" },
  { name: "Holographic Art Print", probability: 0.05, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/catpybara.jpg?v=1731641814" },
  { name: "Themed Tote Bag", probability: 0.04, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/froggycat.jpg?v=1731641748" },
  { name: "Limited Edition Keychain", probability: 0.03, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/minimcfrog.jpg?v=1731641878" },

  // Ultra Rare Prizes (10%)
  { name: "VIP Cafe Membership", probability: 0.05, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/cutlery1.jpg?v=1731724532" },
  { name: "Exclusive Collector’s Box", probability: 0.05, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/maruapproved.jpg?v=1731724532" }
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
    res.setHeader("Access-Control-Allow-Origin", "https://cafedeyume.com");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();

  }

  if (req.method === "GET") {
    // Return the prize list when the frontend makes a GET request
    return res.status(200).json({ prizes: PRIZES });
}

  if (req.method === "POST") {
    // Your existing code to handle POST request for the spin
    console.log("Processing gacha spin...");
    const { customerId } = req.body;

    if (!customerId) {
        return res.status(400).json({ error: "Customer ID required" });
    }

    try {
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

        res.json({ prize, remainingCoins: coins});

    } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
      console.error("Error occurred:", error);
      res.status(405).json({ error: "Method Not Allowed" });
  }
}
