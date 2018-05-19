import express from 'express';
import SummaryModel from '../models/summary';

const router = express.Router();

router.get('/summaries', async (req, res) => {
  const { uid, paperId } = req.query;
  if (!uid || !paperId) return res.status(400).end('You need to specify both uid and paperId as url query.');

  let summaries;
  try {
    summaries = await SummaryModel.find({ createdBy: uid, paper: paperId });
  } catch (err) {
    return res.status(500).end(err.message);
  }
  const summariesBySection = summaries.reduce((_summariesBySection, summary) => (
    {
      [summary.section]: summary,
      ..._summariesBySection,
    }
  ), {});
  res.json(summariesBySection);
});

router.post('/summaries', async (req, res) => {
  const { uid: createdBy, paperId: paper, section, summary } = req.body;

  /* TODO: validate uid, paperId, sectionId. */

  const newSummary = new SummaryModel({
    createdBy,
    paper,
    section,
    summary,
  });
  try {
    await newSummary.save();
  } catch (err) {
    return res.status(500).end(err.message);
  }

  res.status(201).json(newSummary);
});

router.put('/summaries/:summaryId', async (req, res) => {
  const { summary: summaryContent } = req.body;

  let summary;
  try {
    summary = await SummaryModel.findById(req.params.summaryId);
  } catch (err) {
    return res.status(500).end(err.message);
  }

  summary.summary = summaryContent;
  try {
    await summary.save();
  } catch (err) {
    return res.status(500).end(err.message);
  }

  res.status(204).end(`Successfully updated a summary with _id: ${req.params.summaryId}`);
});

router.delete('/summaries/:summaryId', async (req, res) => {
  /* TODO: Authorize the request sender; sender's uid === summary's uid? */

  try {
    await SummaryModel.remove({ _id: req.params.summaryId });
  } catch (err) {
    return res.status(500).end(err.message);
  }

  res.status(204).end(`Successfully deleted a summary with _id: ${req.params.summaryId}`);
});

export default router;
