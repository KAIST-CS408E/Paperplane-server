/* global __dirname */
import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import multer from 'multer';
import PaperModel from '../models/paper';

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

  const replaceImgSrc = function replaceImgSrcToStaticFolderImg(content, title) {
    const imgPath = title.replace(' ', '-');
    const regex = /<img src="((?:(?![\s"])[\w\W])+)" id="(?:(?:(?![\s"])[\w\W])+)" class="ltx_graphics" (?:(?:(?!=)\w)+="(?:(?!")[\w\W])+"\s?)*alt="">/gi;
    return content.replace(regex, (match, oldSrc) => match.replace(oldSrc, `/${imgPath}/${oldSrc}`));
  };

  const findFiguresSrc = function findFiguresNumAndSrc(content) {
    const regex = /<img src="((?:(?![\s"])[\w\W])+)" id="((?:(?![\s"])[\w\W])+)" class="ltx_graphics" (?:(?:(?!=)\w)+="(?:(?!")[\w\W])+"\s?)*alt="">/gi;
    const figures = [];

    let match;
    while (true) { /* eslint-disable-line no-constant-condition */
      match = regex.exec(content);
      if (!match) break;

      const [, src, id] = match;
      const figureMatch = /S[\d]+\.(F[\d]+)/.exec(id);
      if (figureMatch) {
        const figureNumber = figureMatch[1];
        if (!figures.some(figure => figure.number === figureNumber)) {
          figures.push({
            number: figureNumber,
            src,
          });
        }
      }
    }

    return figures;
  };

  const findEquations = function findEquationsHTMLTags(content) {
    const regex = /<table id="S[\d]+\.(E[\d]+)(?:(?!")[\w\W])*" class="ltx_equation ltx_eqn_table">(?:(?!<\/table>)[\w\W]+)<\/table>/gi;
    const equations = [];

    let match;
    while (true) { /* eslint-disable-line no-constant-condition */
      match = regex.exec(content);
      if (!match) break;

      const [equationTag, equationNumber] = match;
      if (!equations.some(equation => equation.number === equationNumber)) {
        equations.push({
          number: equationNumber,
          equation: equationTag,
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
    await runCommand('latex-parser/script/engrafo -o static/tmp ./static/tmp/paper.tex');
    const paperOriginalContent = fs.readFileSync('static/tmp/index.html', 'utf-8');
    const paperTitle = /<h1 class="ltx_title ltx_title_document">(.*)<\/h1>/.exec(paperOriginalContent)[1];
    const paperContent = replaceImgSrc(paperOriginalContent, paperTitle);
    const paperSections = findAllSections(paperContent);
    const paperFigures = findFiguresSrc(paperContent);
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
