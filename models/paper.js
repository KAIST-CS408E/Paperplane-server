import mongoose from 'mongoose';

const paperSchema = new mongoose.Schema({
  title: String,
  content: String,
  sections: [
    {
      number: Number,
      name: String,
    },
  ],
  figures: [
    {
      number: String,
      html: String,
    },
  ],
  equations: [
    {
      number: String,
      html: String,
    },
  ],
});

const PaperModel = mongoose.model('paper', paperSchema);

export default PaperModel;
