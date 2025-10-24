import jwt from "jsonwebtoken";

// Replace with your real admin's _id from MongoDB
const ADMIN_ID = "68f09de03baeb63b64ab7528d";

// Use the same secret key as in your .env file
const SECRET = process.env.JWT_SECRET || "yourSecretKey";

// Generate JWT token
const token = jwt.sign({ id: ADMIN_ID, role: "admin" }, SECRET, { expiresIn: "7d" });

console.log("\n✅ Admin token generated:\n");
console.log(token);
console.log("\n💡 Copy this token and use it in Postman or localStorage.\n");
