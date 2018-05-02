const routes = function addRoutesToApp(app) {
  app.get('/', (req, res) => {
    res.end('Hello, world!');
  });
};

export default routes;
