import express from 'express';
import HighlightModel from '../models/highlight';

const router = express.Router();

router.get('/highlights', async (req, res) => {
  const { uid, paperId } = req.query;
  if (!uid || !paperId) return res.status(400).end('You need to specify both uid and paperId as url query.');

  let highlights;
  try {
    highlights = await HighlightModel.find({ createdBy: uid, paper: paperId });
  } catch (err) {
    return res.status(500).end(err);
  }
  res.json(highlights);
});

router.post('/highlights', async (req, res) => {
  const { uid: createdBy, paperId: paper, paragraph, start, end } = req.body;

  /* TODO: validate uid, paperId. */

  const newHighlight = new HighlightModel({
    createdBy,
    paper,
    paragraph,
    start,
    end,
  });
  try {
    await newHighlight.save();
  } catch (err) {
    return res.status(500).end(err);
  }

  res.status(201).json(newHighlight);
});

router.delete('/highlights/:highlightId', async (req, res) => {
  /* TODO: Authorize the request sender; sender's uid === highlight's uid? */

  try {
    await HighlightModel.remove({ _id: req.params.highlightId });
  } catch (err) {
    return res.status(500).end(err);
  }

  res.status(204).end(`Successfully deleted a highlight with _id: ${req.params.highlightId}`);
});

export default router;
