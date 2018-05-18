import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  paper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'paper',
  },
  section: Number,
  title: String,
  content: String,
});

const NoteModel = mongoose.model('note', noteSchema);

export default NoteModel;
