const axios = require("axios");

async function createAdmin() {
  try {
    const res = await axios.post("http://localhost:5000/api/auth/register", {
      name: "Admin User",
      email: "admin@admin.com",
      password: "admin123",
    });
    console.log("✅ Admin user created:", res.data);
    
    // Now let's manually set the role to admin in database
    console.log("Note: You'll need to manually update the role to 'admin' in the database");
    
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
}

createAdmin();