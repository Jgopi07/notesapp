const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const Note = require('./models/noteModel');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;

// Root route for basic test
app.get('/', (req, res) => {
  res.send('Welcome to the Notes App!');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ➡️ Create Note
app.post('/api/notes', async (req, res) => {
  const { title, content } = req.body;
  try {
    const newNote = new Note({ title, content });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create note', error: err });
  }
});

// ➡️ Get Notes
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.find();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notes', error: err });
  }
});

// ➡️ Update Note by ID
app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  try {
    const updatedNote = await Note.findByIdAndUpdate(
      id,
      { title, content },
      { new: true } // This returns the updated note
    );
    
    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update note', error: err });
  }
});

// ➡️ Delete Note by ID
app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedNote = await Note.findByIdAndDelete(id);
    
    if (!deletedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully', deletedNote });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete note', error: err });
  }
});



app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
