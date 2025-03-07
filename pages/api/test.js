export default function handler(req, res) {
  console.log("✅ Test API hit!");
  console.log("vercel");
  res.status(200).json({ message: "API is working" });
}
