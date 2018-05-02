/* global __dirname */
import { spawn } from 'child_process';

const runCommand = function runCommand(command) {
  const tokens = command.split(' ').map(token => token.trim());
  const program = tokens[0];
  const args = tokens.slice(1);
  return spawn(program, args);
};

const routes = function addRoutesToApp(app) {
  app.get('/', (req, res) => {
    res.end('Hello, world!');
  });

  app.get('/api/latex-parser-test', (req, res) => {
    const dockerProcess = runCommand('latex-parser/script/engrafo -o latex latex-parser/tests/documents/basic.tex');
    let stdout = '';
    let stderr = '';
    dockerProcess.stdout.on('data', (data) => { stdout += data; });
    dockerProcess.stderr.on('data', (data) => { stderr += data; });
    dockerProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(stderr);
        return res.status(500).end(stderr);
      }
      return res.end(stdout);
    });
  });
};

export default routes;
