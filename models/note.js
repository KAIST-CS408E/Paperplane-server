import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  createdBy: String,
  paper: String,
  section: String,
  title: String,
  content: String,
});

const NoteModel = mongoose.model('note', noteSchema);

export default NoteModel;
