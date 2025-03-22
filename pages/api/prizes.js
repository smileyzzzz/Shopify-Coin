// Import prize data from the prize-data.js file in the same folder
import { PRIZES } from "./prize-data";

// Handle the API request
export default function handler(req, res) {
  // Set CORS headers for your frontend domain
  res.setHeader("Access-Control-Allow-Origin", "https://cafedeyume.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS preflight request (necessary for CORS)
  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Respond with status 200 for OPTIONS request
  }

  // Handle GET request by returning prize data
  if (req.method === "GET") {
    return res.status(200).json(PRIZES); // Send the PRIZES data
  }

  // Handle any other HTTP methods (if needed)
  res.status(405).json({ error: "Method Not Allowed" });
}
