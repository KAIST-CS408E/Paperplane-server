import mongoose from 'mongoose';

const highlightSchema = new mongoose.Schema({
  createdBy: String,
  paper: String,
  paragraph: String,
  start: Number,
  end: Number,
});

const highlightModel = mongoose.model('highlight', highlightSchema);

export default highlightModel;
