import axios from 'axios';

const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_API_KEY;
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL; // Should be just "cafe-deyume.myshopify.com"

export default async function handler(req, res) {
    console.log("📩 Webhook received!");

    if (req.method !== 'POST') {
        console.log("❌ Invalid method:", req.method);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, line_items } = req.body;

    let totalCoins = 0;

    // Calculate total coins based on order items
    line_items.forEach((item) => {
        if (item.title.includes("Lucky Spin Coin")) {
            if (item.variant_title.includes('1')){
                totalCoins += item.quantity; // Each "1 Gacha Coin" adds 1 coin
            } else if (item.variant_title.includes('3')){
                totalCoins += item.quantity * 3; // Each "1 Gacha Coin" adds 1 coin
            }
        }
    });

    console.log(`User ${email} bought ${totalCoins} coins`);

    try {
        // Fetch customer by email
        const customer = await getCustomerByEmail(email);
        
        if (customer) {
            // Update customer's metafield with the total number of coins
            await updateCustomerMetafield(customer.id, totalCoins);
            console.log(`✅ Updated customer ${email} with ${totalCoins} coins.`);
        } else {
            console.log(`⚠️ Customer with email ${email} not found.`);
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
            url: `https://${SHOPIFY_STORE_URL}/admin/api/2025-01/customers/search.json?query=email:${email}`,
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json',
            }
        });

        return response.data.customers[0]; // Return the first customer (if found)
    } catch (error) {
        console.error('❌ Error fetching customer:', error.response?.data || error.message);
        throw new Error('Failed to fetch customer');
    }
}

// Update or create customer metafield
async function updateCustomerMetafield(customerId, totalCoins) {
    try {
        // Fetch current metafields
        const response = await axios({
            method: 'get',
            url: `https://${SHOPIFY_STORE_URL}/admin/api/2025-01/customers/${customerId}/metafields.json`,
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json',
            }
        });

        const currentMetafields = response.data.metafields;
        const existingCoinMetafield = currentMetafields.find(mf => mf.key === 'coins_balance' && mf.namespace === 'gacha');

        if (existingCoinMetafield) {

            totalCoins = parseInt(existingCoinMetafield.value, 10) + totalCoins;

            // Update existing metafield
            await axios({
                method: 'put',
                url: `https://${SHOPIFY_STORE_URL}/admin/api/2025-01/metafields/${existingCoinMetafield.id}.json`,
                headers: {
                    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                    'Content-Type': 'application/json',
                },
                data: {
                    metafield: {
                        value: totalCoins.toString(), // Convert to string for Shopify API
                        type: 'integer',
                    }
                }
            });
            console.log("✅ Metafield updated.");
        } else {
            // Create a new metafield if it doesn't exist
            await axios({
                method: 'post',
                url: `https://${SHOPIFY_STORE_URL}/admin/api/2025-01/customers/${customerId}/metafields.json`,
                headers: {
                    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                    'Content-Type': 'application/json',
                },
                data: {
                    metafield: {
                        namespace: 'gacha', // Proper namespace
                        key: 'coins_balance',
                        value: totalCoins.toString(),
                        type: 'integer',
                    }
                }
            });
            console.log("✅ New metafield created.");
        }
    } catch (error) {
        console.error('❌ Error updating or creating metafield:', error.response?.data || error.message);
        throw new Error('Failed to update or create metafield');
    }
}
