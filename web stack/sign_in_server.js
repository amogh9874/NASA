// 🔌 Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

// 🚀 App Setup
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serves HTML/CSS/JS from current folder

// 🌌 MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/space_drifters', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// 👤 User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// 🛠️ Sign-In Route (Registration)
app.post('/sign-in', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.send('User already exists. Please log in.');

    const hashedPassword = await bcrypt.hash(password, 10);
const newUser = new User({ email, password: hashedPassword });

    await newUser.save();
    res.send('Account created successfully!');
  } catch (err) {
    console.error('Sign-in error:', err);
    res.status(500).send('Error during sign-in.');
  }
});

// 🔐 Login Route (Authentication)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.send('No account found. Please sign in first.');
    const match = await bcrypt.compare(password, user.password);
if (!match) return res.send('Incorrect password.');


    res.redirect('/calendar.html');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error during login.');
  }
});

// 🛰️ Start Server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

const bcrypt = require('bcrypt');

// 🔐 Change Password Route
app.post('/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.send('User not found.');

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.send('Current password is incorrect.');

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.send('Password updated successfully!');
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).send('Server error during password update.');
  }
});
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config(); // To manage environment variables

// --- CONFIGURATION ---
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI; // Your database connection string
const DB_NAME = 'smart_calendar';
const COLLECTION_NAME = 'reminders';

// --- MIDDLEWARE ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON request bodies

// --- DATABASE CONNECTION ---
let db;
async function connectDB() {
    if (db) return;
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log('Successfully connected to MongoDB Atlas!');
    } catch (error) {
        console.error('Could not connect to MongoDB Atlas:', error);
        process.exit(1); // Exit the process with an error code
    }
}

// --- API ENDPOINTS / ROUTES ---

// GET reminders for a specific date (e.g., /reminders/2025-10-26)
app.get('/reminders/:date', async (req, res) => {
    try {
        const reminders = await db.collection(COLLECTION_NAME).find({ date: req.params.date }).toArray();
        res.status(200).json(reminders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
});

// GET all reminders for a given month (e.g., /reminders/2025/10)
app.get('/reminders/:year/:month', async (req, res) => {
    try {
        const year = parseInt(req.params.year, 10);
        const month = parseInt(req.params.month, 10);
        const monthPadded = month.toString().padStart(2, '0');
        const regex = new RegExp(`^${year}-${monthPadded}-`);
        
        const reminders = await db.collection(COLLECTION_NAME).find({ date: { $regex: regex } }).toArray();
        res.status(200).json(reminders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch month reminders' });
    }
});

// POST a new reminder
app.post('/reminders', async (req, res) => {
    try {
        const reminder = req.body;
        const result = await db.collection(COLLECTION_NAME).insertOne(reminder);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add reminder' });
    }
});

// DELETE a reminder by its ID
app.delete('/reminders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid reminder ID format' });
        }
        const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Reminder not found' });
        }
        res.status(200).json({ message: 'Reminder deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete reminder' });
    }
});


// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    connectDB();
});