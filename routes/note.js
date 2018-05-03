import express from 'express';
import NoteModel from '../models/note';

const router = express.Router();

router.get('/notes', async (req, res) => {
  const { uid, paperId } = req.query;
  if (!uid || !paperId) return res.status(400).end('You need to specify both uid and paperId as url query.');

  let notes;
  try {
    notes = await NoteModel.find({ createdBy: uid, paper: paperId });
  } catch (err) {
    return res.status(500).end(err);
  }
  const notesBySection = notes.reduce((_notesBySection, note) => {
    if (!(note.section in _notesBySection)) {
      return {
        [note.section]: [note],
        ..._notesBySection,
      };
    }
    return _notesBySection[note.section].push(note);
  }, {});
  res.json(notesBySection);
});

router.post('/notes', async (req, res) => {
  const { uid: createdBy, paperId: paper, sectionId: section, title, content } = req.body;

  /* TODO: validate uid, paperId, sectionId. */

  const newNote = new NoteModel({
    createdBy,
    paper,
    section,
    title,
    content,
  });
  try {
    await newNote.save();
  } catch (err) {
    return res.status(500).end(err);
  }

  res.status(201).end(`Successfully created a note with title: ${title}`);
});

router.put('/notes/:noteId', async (req, res) => {
  const { uid: createdBy, paperId: paper, sectionId: section, title, content } = req.body;

  /* TODO: Authorize the request sender; sender's uid === note's uid? */

  let note;
  try {
    note = await NoteModel.findById(req.params.noteId);
  } catch (err) {
    return res.status(500).end(err);
  }
  if (note.createdBy !== createdBy || note.paper !== paper || note.section !== section) {
    return res.status(400).end('Please try with correct uid, paperId, and sectionId.');
  }

  note.title = title;
  note.content = content;
  try {
    await note.save();
  } catch (err) {
    return res.status(500).end(err);
  }

  res.status(204).end(`Successfully updated a note with _id: ${req.params.noteId}`);
});

router.delete('/notes/:noteId', async (req, res) => {
  /* TODO: Authorize the request sender; sender's uid === note's uid? */

  try {
    await NoteModel.remove({ _id: req.params.noteId });
  } catch (err) {
    return res.status(500).end(err);
  }

  res.status(204).end(`Successfully deleted a note with _id: ${req.params.noteId}`);
});

export default router;
