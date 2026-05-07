const dotenv = require("dotenv");
const app = require('./app');
const connectDB = require("./config/db");

dotenv.config();
const PORT = process.env.PORT || 9090;

// Connect to database
connectDB();

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
