import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:5173' // React app
}));

// Serve static files from public
app.use(express.static(path.join(__dirname, '../public')));


// Multer setup for local uploads (temp folder)
const upload = multer({ dest: path.join(__dirname, '../../uploads/') });

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.use('/api/auth', authRouter);
app.use('/api', uploadRouter);


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 