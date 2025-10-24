import axios from "axios";

const BASE_URL = "https://annelle-climatic-antwan.ngrok-free.dev";

async function testLogin() {
  try {
    console.log(`🔄 Sending POST request to ${BASE_URL}/api/users/login`);
    const res = await axios.post(`${BASE_URL}/api/users/login`, {
      email: "admin@techietown.com",
      password: "TechieTown@2025",
    });
    console.log("✅ Login Success!");
    console.log(res.data);
  } catch (err) {
    console.error("❌ Login Failed:");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error(err);
    }
  }
}

testLogin();
