process.on('unhandledRejection', (reason) => {
  if (reason && reason.name === 'FormatError') return; // suppress pdf-parse internal errors
  console.error('Unhandled rejection:', reason);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors({ origin: ['https://project-airesumeanalyzer.vercel.app', 'http://localhost:3000'] }));
app.use(express.json());

app.use('/api', require('./routes/authRoutes'));
app.use('/api', require('./routes/resumeRoutes'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    const PORT = process.env.PORT || 5001;
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));
