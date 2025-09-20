const axios = require("axios");

async function testRegister() {
  try {
    const res = await axios.post("http://eduweb-eo8i.onrender.com/api/auth/register", {
      name: "Frontend User",
      email: "frontend@test.com",
      password: "test123",
    });
    console.log("✅ Success:", res.data);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
}

testRegister();
