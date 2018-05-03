/* global __dirname */
import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import PaperModel from '../models/paper';

const runCommand = function runCommand(command) {
  const tokens = command.split(' ').map(token => token.trim());
  const program = tokens[0];
  const args = tokens.slice(1);
  const childProcess = spawn(program, args);

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    childProcess.stdout.on('data', (data) => { stdout += data; });
    childProcess.stderr.on('data', (data) => { stderr += data; });
    childProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(stderr);
        reject(stderr);
      }
      resolve(stdout);
    });
  });
};

const router = express.Router();

router.get('/papers', async (req, res) => {
  try {
    const papers = await PaperModel.find({});
    res.json(papers);
  } catch (err) {
    res.status(500).end(err);
  }
});

router.post('/papers', async (req, res) => {
  const findAllSections = function findAllSectionsFromPaper(content) {
    const regex = /<h2 class="ltx_title ltx_title_section">\s*<span class="ltx_tag ltx_tag_section"><a href="#S\d+">(\d+)\s*<\/a><\/span>"?(.*)"?<\/h2>/g;
    const sections = [];
    let match;
    while (match = regex.exec(content)) { /* eslint-disable-line no-cond-assign */
      sections.push({
        number: match[1],
        name: match[2],
      });
    }
    return sections;
  };

  try {
    await runCommand('mkdir tmp');
    /* TODO: get file from request body and save it, not basic.tex. */
    await runCommand('latex-parser/script/engrafo -o tmp latex-parser/tests/documents/basic.tex');
    const paperContent = fs.readFileSync('tmp/index.html', 'utf-8');
    const paperTitle = /<h1 class="ltx_title ltx_title_document">(.*)<\/h1>/.exec(paperContent)[1];
    const paperSections = findAllSections(paperContent);
    await runCommand('rm -rf tmp');

    const newPaper = new PaperModel({
      title: paperTitle,
      content: paperContent,
      sections: paperSections,
    });
    /* TODO: duplicate paper check logic required. */
    await newPaper.save();
    res.status(201).end(`Successfully save the paper: [${paperTitle}]`);
  } catch (err) {
    res.status(500).end(err);
  }
});

router.get('/papers/:title', async (req, res) => {
  try {
    const paper = await PaperModel.findOne({ title: req.params.title });
    if (!paper) return res.status(400).end(`No paper with title [${req.params.title}].`);
    res.json(paper);
  } catch (err) {
    res.status(500).end(err);
  }
});

router.delete('/papers/:title', async (req, res) => {
  try {
    await PaperModel.remove({ title: req.params.title });
    res.end(`Successfully delete the paper: [${req.params.title}]`);
  } catch (err) {
    res.status(500).end(err);
  }
});

export default router;
