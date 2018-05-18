/* global __dirname */
import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import multer from 'multer';
import PaperModel from '../models/paper';
import NoteModel from '../models/note';

const API_URL = 'http://ec2-18-191-57-158.us-east-2.compute.amazonaws.com';

const upload = multer({ dest: './static' });

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

router.get('/papers/sample', async (req, res) => {
  try {
    const papers = await PaperModel.find({});
    res.end(papers[0].content);
  } catch (err) {
    res.status(500).end(err);
  }
});

router.get('/papers', async (req, res) => {
  try {
    const papers = await PaperModel.find({});
    res.json(papers);
  } catch (err) {
    res.status(500).end(err);
  }
});

router.post('/papers', upload.single('paper'), async (req, res) => {
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

  const processPaperContent = function replacePaperContent(originalTitle, originalContent) {
    const replaceImgSrc = function replaceImgSrcToStaticFolderImg(title, content) {
      const imgPath = title.replace(' ', '-');
      const regex = /<img src="((?:(?![\s"])[\w\W])+)" id="(?:(?:(?![\s"])[\w\W])+)" class="ltx_graphics" (?:(?:(?!=)\w)+="(?:(?!")[\w\W])+"\s?)*alt="">/gi;
      return content.replace(regex, (match, oldSrc) => match.replace(oldSrc, `${API_URL}/${imgPath}/${oldSrc}`));
    };

    const replaceStyle = function replaceWrongCss(content) {
      const middleContent1 = content.replace(/margin-left: calc\(50% - 984px \/ 2\);/gi, '');
      const middleContent2 = middleContent1.replace(/width: 984px;\s+margin-left: auto;\s+margin-right: auto;/gi, '');
      return middleContent2;
    };

    const middleContent1 = replaceImgSrc(originalTitle, originalContent);
    const middleContent2 = replaceStyle(middleContent1);

    return middleContent2;
  };

  const findFigures = function findFiguresHTMLTags(content) {
    const regex = /<figure id="S[\d]+\.(F[\d]+)(?:(?!")[\w\W])*" class="ltx_figure">(?:(?!<\/figure>)[\w\W])+<\/figure>/gi;
    const figures = [];

    let match;
    while (true) { /* eslint-disable-line no-constant-condition */
      match = regex.exec(content);
      if (!match) break;

      const [figureTag, figureNumber] = match;
      if (!figures.some(figure => figure.number === figureNumber)) {
        figures.push({
          number: figureNumber,
          html: figureTag,
        });
      }
    }

    return figures;
  };

  const findEquations = function findEquationsHTMLTags(content) {
    const regex = /<table id="S[\d]+\.(E[\d]+)(?:(?!")[\w\W])*" class="ltx_equation ltx_eqn_table">(?:(?!<\/table>)[\w\W])+<\/table>/gi;
    const equations = [];

    let match;
    while (true) { /* eslint-disable-line no-constant-condition */
      match = regex.exec(content);
      if (!match) break;

      const [equationTag, equationNumber] = match;
      if (!equations.some(equation => equation.number === equationNumber)) {
        equations.push({
          number: equationNumber,
          html: equationTag,
        });
      }
    }

    return equations;
  };

  const { file } = req;
  try {
    /* TODO: check duplicate paper. */
    await runCommand('mkdir static/tmp');
    await runCommand(`unzip ${file.path} -d static/tmp`);
    await runCommand('touch static/tmp/index.html');
    await runCommand('sudo chmod -R 777 static/tmp');
    await runCommand('sudo latex-parser/script/engrafo -o static/tmp ./static/tmp/paper.tex');
    const paperOriginalContent = fs.readFileSync('static/tmp/index.html', 'utf-8');
    const paperTitle = /<h1 class="ltx_title ltx_title_document">(.*)<\/h1>/.exec(paperOriginalContent)[1];
    const paperContent = processPaperContent(paperTitle, paperOriginalContent);
    const paperSections = findAllSections(paperContent);
    const paperFigures = findFigures(paperContent);
    const paperEquations = findEquations(paperContent);
    await runCommand(`rm static/tmp/index.html static/tmp/paper.tex ${file.path}`);
    await runCommand(`mv static/tmp static/${paperTitle.replace(' ', '-')}`);

    const newPaper = new PaperModel({
      title: paperTitle,
      content: paperContent,
      sections: paperSections,
      figures: paperFigures,
      equations: paperEquations,
    });
    /* TODO: duplicate paper check logic required. */
    await newPaper.save();
    res.status(201).end(`Successfully save the paper: [${paperTitle}]`);
  } catch (err) {
    await runCommand(`rm -rf ${file.path} static/tmp`);
    res.status(500).end(JSON.stringify(err));
  }
});

router.get('/papers/:paperId', async (req, res) => {
  try {
    const paper = await PaperModel.findOne({ _id: req.params.paperId });
    if (!paper) return res.status(400).end(`No paper with _id [${req.params.paperId}].`);
    res.json(paper);
  } catch (err) {
    res.status(500).end(err);
  }
});

router.delete('/papers/:paperId', async (req, res) => {
  try {
    await PaperModel.remove({ _id: req.params.paperId });
    res.end(`Successfully delete the paper with _id: [${req.params.paperId}]`);
  } catch (err) {
    res.status(500).end(err);
  }
});

router.get('/papers/read-by/:uid', async (req, res) => {
  const { uid } = req.params;
  if (!uid) return res.status(400).end('You need to specify uid in url.');

  let notes;
  try {
    notes = await NoteModel.find({ createdBy: uid }).populate('paper');
  } catch (err) {
    return res.status(500).end(err);
  }

  const papers = notes.reduce((_papers, note) => {
    if (_papers.some(_paper => _paper._id === note.paper._id)) return _papers;
    _papers.push(note.paper);
    return _papers;
  }, []);
  res.json(papers);
});

export default router;
