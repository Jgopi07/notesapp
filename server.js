const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const User = require('./models/userModel');
const Note = require('./models/noteModel');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;

// ✅ Root Route
app.get('/', (req, res) => {
  res.send('Welcome to the Notes App!');
});

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ User Registration
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send({ message: 'Email already exists' });

    const user = new User({ username, email, password });
    await user.save();

    res.status(201).send({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).send({ message: 'Error registering user', error: err.message });
  }
});

// ✅ User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send({ message: 'User not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).send({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).send({ message: 'Login successful', token });
  } catch (err) {
    res.status(400).send({ message: 'Error logging in', error: err.message });
  }
});

// ✅ Middleware to Protect Routes
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send({ message: 'Invalid token' });
  }
};

// ✅ Create Note (Protected) – Link to logged-in user
app.post('/api/notes', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.userId;

  try {
    const newNote = new Note({ title, content, userId });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create note', error: err.message });
  }
});

// ✅ Get Notes (Protected) – Only return notes belonging to logged-in user
app.get('/api/notes', authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  try {
    const notes = await Note.find({ userId });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notes', error: err.message });
  }
});

// ✅ Update Note by ID (Protected) – Only update user's note
app.put('/api/notes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.userId;

  try {
    const updatedNote = await Note.findOneAndUpdate(
      { _id: id, userId }, // Ensure note belongs to logged-in user
      { title, content },
      { new: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found or not authorized' });
    }

    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update note', error: err.message });
  }
});

// ✅ Delete Note by ID (Protected) – Only delete user's note
app.delete('/api/notes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const deletedNote = await Note.findOneAndDelete({ _id: id, userId });

    if (!deletedNote) {
      return res.status(404).json({ message: 'Note not found or not authorized' });
    }

    res.json({ message: 'Note deleted successfully', deletedNote });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete note', error: err.message });
  }
});

// ✅ Start Server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
