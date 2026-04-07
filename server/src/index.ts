import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import doctorsRoutes from './routes/doctors';
import affiliatesRoutes from './routes/affiliates';
import appointmentsRoutes from './routes/appointments';
import publicRoutes from './routes/public';
import referralRoutes from './routes/referral';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/doctors', doctorsRoutes);
app.use('/api/affiliates', affiliatesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api', publicRoutes); // /api/specialties, /api/cities

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Pontea Backend server running on port ${port}`);
});
