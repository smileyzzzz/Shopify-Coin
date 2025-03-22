// Import prize data from the prize-data.js file in the same folder
import { PRIZES } from "./prize-data";

export default function handler(req, res) {
  // Log the incoming request method for debugging
  console.log("Received request:", req.method);

  try {
    // Set CORS headers for your frontend domain
    res.setHeader("Access-Control-Allow-Origin", "https://cafedeyume.com");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle OPTIONS preflight request (necessary for CORS)
    if (req.method === "OPTIONS") {
      console.log("OPTIONS request received");
      return res.status(200).end(); // Respond with status 200 for OPTIONS request
    }

    // Handle GET request by returning prize data
    if (req.method === "GET") {
      console.log("GET request received, sending prizes");
      return res.status(200).json(PRIZES); // Send the PRIZES data
    }

    // Handle any other HTTP methods (if needed)
    console.log("Method not allowed:", req.method);
    res.status(405).json({ error: "Method Not Allowed" });

  } catch (error) {
    // Catch any internal errors and log them
    console.error("Error occurred:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
