import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  paper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'paper',
  },
  section: Number,
  isSummary: Boolean,
  title: String,
  content: String,
});

const NoteModel = mongoose.model('note', noteSchema);

export default NoteModel;
