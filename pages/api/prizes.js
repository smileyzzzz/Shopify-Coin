// Import prize data
import { PRIZES } from "./prize-data";

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://cafedeyume.com"); // Allow your frontend domain
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); // Allow specific methods
  res.setHeader("Access-Control-Allow-Headers", "Content-Type"); // Allow specific headers

  // Handle OPTIONS preflight request (necessary for CORS)
  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Respond with a successful status for OPTIONS request
  }

  // Respond with prize data for GET request
  res.status(200).json(PRIZES);
}
