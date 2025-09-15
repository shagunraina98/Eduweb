require('dotenv').config();
const express = require('express');
const cors = require('cors');
const questionRoutes = require("./routes/questions");



// Initialize DB (will create pool and log status on startup)
require('./db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ping route
app.get('/ping', (req, res) => {
  res.send('pong');
});




// Routers
app.use("/api/questions", questionRoutes);

app.use('/api/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/quizzes', require('./routes/quizzes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
