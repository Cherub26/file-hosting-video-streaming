const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public
app.use(express.static(path.join(__dirname, '../public')));

// Static files (for serving uploads/thumbnails if needed)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/thumbnails', express.static(path.join(__dirname, '../thumbnails')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 