// backend/tests/stkpush.js
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

async function testSTKPush() {
  console.log("\n🧪 Testing M-Pesa STK Push...\n");
  
  // Check environment variables
  console.log("📋 Environment Check:");
  console.log("   MPESA_ENV:", process.env.MPESA_ENV || "❌ Missing");
  console.log("   MPESA_CONSUMER_KEY:", process.env.MPESA_CONSUMER_KEY ? "✅ Set" : "❌ Missing");
  console.log("   MPESA_CONSUMER_SECRET:", process.env.MPESA_CONSUMER_SECRET ? "✅ Set" : "❌ Missing");
  console.log("   MPESA_SHORTCODE:", process.env.MPESA_SHORTCODE || "❌ Missing");
  console.log("   MPESA_PASSKEY:", process.env.MPESA_PASSKEY ? "✅ Set" : "❌ Missing");
  console.log("   MPESA_CALLBACK_URL:", process.env.MPESA_CALLBACK_URL || "❌ Missing");
  console.log("   BASE_URL:", process.env.BASE_URL || process.env.NGROK_URL || "❌ Missing");
  
  // Validate required variables
  const missing = [];
  if (!process.env.MPESA_CONSUMER_KEY) missing.push("MPESA_CONSUMER_KEY");
  if (!process.env.MPESA_CONSUMER_SECRET) missing.push("MPESA_CONSUMER_SECRET");
  if (!process.env.MPESA_SHORTCODE) missing.push("MPESA_SHORTCODE");
  if (!process.env.MPESA_PASSKEY) missing.push("MPESA_PASSKEY");
  
  if (missing.length > 0) {
    console.error("\n❌ Missing required environment variables:", missing.join(", "));
    console.error("\n📝 Please add them to your .env file\n");
    process.exit(1);
  }
  
  // Test phone numbers
  // For sandbox: Use 254708374149 (Safaricom test number)
  // For production: Use your actual Safaricom number
  const testPhone = process.env.MPESA_ENV === "sandbox" 
    ? "254708374149"  // Sandbox test number
    : "254712345678"; // Replace with your number
  
  const testAmount = 1; // Minimum amount
  
  console.log("\n📞 Test Details:");
  console.log("   Phone:", testPhone);
  console.log("   Amount: KES", testAmount);
  console.log("\n⏳ Sending request to backend...\n");

  try {
    // Make request to your backend API
    const response = await axios.post("http://localhost:3000/api/payments/stkpush", {
      phone: testPhone,
      amount: testAmount,
    });

    console.log("\n✅ Backend Response:");
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log("\n📱 Check your phone for the payment prompt!");
      console.log("\n💡 Tips:");
      console.log("   • Make sure phone is unlocked");
      console.log("   • Check for M-Pesa popup notification");
      console.log("   • Enter your M-Pesa PIN to complete");
      console.log("\n📊 View callbacks: http://localhost:3000/api/payments/callbacks\n");
    }
  } catch (error) {
    console.error("\n❌ Test Failed!");
    
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Error:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("   Error:", error.message);
    }
    
    console.error("\n🔍 Common Issues:");
    console.error("   1. Backend not running → Run: node backend/server.js");
    console.error("   2. Wrong credentials → Check Daraja portal");
    console.error("   3. Callback URL not accessible → Start ngrok and update .env");
    console.error("   4. Invalid phone number → Use sandbox test number: 254708374149");
    console.error("   5. Wrong passkey → Copy exactly from Daraja (no spaces)\n");
  }
}

testSTKPush();