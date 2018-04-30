module.exports = function addRoutesToApp(app) {
  app.get('/', (req, res) => {
    res.end('Hello, world!');
  });
};
