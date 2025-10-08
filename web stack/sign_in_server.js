// 🔌 Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

// 🚀 App Setup
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'smart_calendar';
const COLLECTION_NAME = 'reminders';
const USERS_COLLECTION = 'users';

// --- DATABASE CONNECTION ---
let db;
async function connectDB() {
  if (db) return;
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// --- AUTH ROUTES ---

// 🛠️ Sign-In
app.post('/sign-in', async (req, res) => {
  await connectDB();
  const { email, password } = req.body;
  try {
    const existingUser = await db.collection(USERS_COLLECTION).findOne({ email });
    if (existingUser) return res.send('User already exists. Please log in.');

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection(USERS_COLLECTION).insertOne({ email, password: hashedPassword });
    res.send('Account created successfully!');
  } catch (err) {
    console.error('Sign-in error:', err);
    res.status(500).send('Error during sign-in.');
  }
});

// 🔐 Login
app.post('/login', async (req, res) => {
  await connectDB();
  const { email, password } = req.body;
  try {
    const user = await db.collection(USERS_COLLECTION).findOne({ email });
    if (!user) return res.send('No account found. Please sign in first.');

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('Incorrect password.');

    res.redirect('/calendar.html');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error during login.');
  }
});

// 🔐 Change Password
app.post('/change-password', async (req, res) => {
  await connectDB();
  const { email, currentPassword, newPassword } = req.body;
  try {
    const user = await db.collection(USERS_COLLECTION).findOne({ email });
    if (!user) return res.send('User not found.');

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.send('Current password is incorrect.');

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.collection(USERS_COLLECTION).updateOne(
      { email },
      { $set: { password: hashedNewPassword } }
    );

    res.send('Password updated successfully!');
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).send('Server error during password update.');
  }
});

// --- REMINDER ROUTES ---

// 📅 Get reminders for a specific date
app.get('/reminders/:date', async (req, res) => {
  await connectDB();
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email query parameter is required' });

  try {
    const reminders = await db.collection(COLLECTION_NAME).find({
      date: req.params.date,
      email
    }).toArray();
    res.status(200).json(reminders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});


// 📆 Get all reminders for a month
app.get('/reminders/:year/:month', async (req, res) => {
  await connectDB();
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email query parameter is required' });

  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10).toString().padStart(2, '0');
    const regex = new RegExp(`^${year}-${month}-`);

    const reminders = await db.collection(COLLECTION_NAME).find({
      date: { $regex: regex },
      email
    }).toArray();
    res.status(200).json(reminders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch month reminders' });
  }
});


// ➕ Add a new reminder
app.post('/reminders', async (req, res) => {
  await connectDB();
  try {
    const { email, date, title, description } = req.body;
    if (!email || !date || !title) {
      return res.status(400).json({ error: 'Missing required fields: email, date, title' });
    }

    const reminder = { email, date, title, description };
    const result = await db.collection(COLLECTION_NAME).insertOne(reminder);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add reminder' });
  }
});


// ❌ Delete a reminder
app.delete('/reminders/:id', async (req, res) => {
  await connectDB();
  const { id } = req.params;
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email query parameter is required' });
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid reminder ID format' });

  try {
    const result = await db.collection(COLLECTION_NAME).deleteOne({
      _id: new ObjectId(id),
      email
    });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Reminder not found or unauthorized' });

    res.status(200).json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});


// 🛰️ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  connectDB();
});
