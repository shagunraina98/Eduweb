const axios = require("axios");

async function testLogin() {
  try {
    const res = await axios.post("http://eduweb-eo8i.onrender.com/api/auth/login", {
      email: "frontend@test.com",   // wahi jo tumne register me diya tha
      password: "test123"
    });
    console.log("✅ Login success:", res.data);
  } catch (err) {
    console.error("❌ Login error:", err.response?.data || err.message);
  }
}

testLogin();
