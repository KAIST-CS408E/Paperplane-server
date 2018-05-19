import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  paper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'paper',
  },
  section: Number,
  summary: String,
});

const SummaryModel = mongoose.model('summary', summarySchema);

export default SummaryModel;
