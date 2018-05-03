import paper from './paper';
import note from './note';

const addRoutes = function addRoutesToApp(app) {
  app.use('/api', paper, note);
};

export default addRoutes;
