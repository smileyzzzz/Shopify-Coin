import axios from "axios";

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_API_KEY;

const PRIZES = [
  // Common Prizes (65%)
  { name: "Shiba Butt Butt", probability: 0.10, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/shiba_butt_butt.png?v=1742697049" },
  { name: "Corgi Butt Butt", probability: 0.10, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/corgi_butt_butt.png?v=1742697048" },
  { name: "Bee Leaf", probability: 0.10, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/bee_leaf.png?v=1742697047" },
  { name: "Wasabi Buddy", probability: 0.10, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/wasabi.png?v=1742697047" },
  { name: "Mini Sprout", probability: 0.10, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/sprout.png?v=1742697049" },
  
  { name: "Egg Tart Beary",  probability: 0.05, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/egg_tart_beary.png?v=1742697050" },
  { name: "Beary Bubbles", probability: 0.05, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/beary_bubbles.png?v=1742697046" },
  { name: "Purin", probability: 0.05, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/purin.png?v=1742697046" },
  { name: "Tama Beary", probability: 0.05, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/tamabeary.png?v=1742697045" },
  { name: "Calico Coffee", probability: 0.05, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/coffee_calico.png?v=1742697048" },

  { name: "Milk Beary", probability: 0.02, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/milkbeary.png?v=1742697049" },
  { name: "Onigiri Buddy", probability: 0.01, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/onigiri.png?v=1742697048" },
  { name: "Boba Kitty", probability: 0.01, image: "https://cdn.shopify.com/s/files/1/0456/6269/9542/files/boba_kitty.png?v=1742697050" },

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
