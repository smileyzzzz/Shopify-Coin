import axios from 'axios';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_PASSWORD = process.env.SHOPIFY_API_PASSWORD;
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;

export default async function handler(req, res) {
    console.log("📩 Webhook received!");

    if (req.method !== 'POST') {
        console.log("❌ Invalid method:", req.method);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, line_items } = req.body;

    let totalCoins = 0;

    // Calculate total coins based on the order items
    line_items.forEach((item) => {
      if (item.title.includes("1")) {
        totalCoins += item.quantity; // Each "1 Gacha Coin" adds 1 coin
      } else if (item.title.includes("3")) {
        totalCoins += item.quantity * 3; // Each "3 Gacha Coins" adds 3 coins
      }
    });

    console.log(`User ${email} bought ${totalCoins} coins`);

    try {
        // Fetch the customer by email
        const customer = await getCustomerByEmail(email);
        
        if (customer) {
            // Update customer's metafield with the total number of coins
            await updateCustomerMetafield(customer.id, totalCoins);
            console.log(`Updated customer ${email} with ${totalCoins} coins.`);
        } else {
            console.log(`Customer with email ${email} not found.`);
        }
    } catch (error) {
        console.error("❌ Error updating customer metafield:", error);
    }

    res.status(200).json({ message: 'Webhook received and processed' });
}

// Get customer details by email
async function getCustomerByEmail(email) {
    try {
        const response = await axios({
            method: 'get',
            url: `https://${SHOPIFY_API_KEY}:${SHOPIFY_API_PASSWORD}@${SHOPIFY_STORE_URL}/admin/api/2025-01/customers/search.json?query=email:${email}`,
        });
        
        return response.data.customers[0]; // Return the first customer (if found)
    } catch (error) {
        console.error('Error fetching customer:', error);
        throw new Error('Failed to fetch customer');
    }
}

// Update customer metafield
async function updateCustomerMetafield(customerId, totalCoins) {
    try {
        const response = await axios({
            method: 'get', // Fetch current metafields to check existing ones
            url: `https://${SHOPIFY_API_KEY}:${SHOPIFY_API_PASSWORD}@${SHOPIFY_STORE_URL}/admin/api/2025-01/customers/${customerId}/metafields.json`
        });

        const currentMetafields = response.data.metafields;
        const existingCoinMetafield = currentMetafields.find(mf => mf.key === 'coins_balance' && mf.namespace === '');  // Empty namespace for default

        if (existingCoinMetafield) {
            // Update existing metafield
            const updateResponse = await axios({
                method: 'put',
                url: `https://${SHOPIFY_API_KEY}:${SHOPIFY_API_PASSWORD}@${SHOPIFY_STORE_URL}/admin/api/2025-01/metafields/${existingCoinMetafield.id}.json`,
                data: {
                    metafield: {
                        value: totalCoins.toString(), // Convert to string for the API
                        value_type: 'integer', // Ensure the metafield is treated as an integer
                    }
                }
            });
            console.log("Metafield updated:", updateResponse.data);
        } else {
            // Create a new metafield if it doesn't exist
            const createResponse = await axios({
                method: 'post',
                url: `https://${SHOPIFY_API_KEY}:${SHOPIFY_API_PASSWORD}@${SHOPIFY_STORE_URL}/admin/api/2025-01/customers/${customerId}/metafields.json`,
                data: {
                    metafield: {
                        namespace: '',  // No namespace (default)
                        key: 'coins_balance',
                        value: totalCoins.toString(),
                        value_type: 'integer', // Make sure it's an integer
                    }
                }
            });
            console.log("New metafield created:", createResponse.data);
        }
    } catch (error) {
        console.error('Error updating or creating metafield:', error);
        throw new Error('Failed to update or create metafield');
    }
}
