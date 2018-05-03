import paper from './paper';

const addRoutes = function addRoutesToApp(app) {
  app.use('/api', paper);
};

export default addRoutes;
