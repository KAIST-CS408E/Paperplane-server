import paper from './paper';
import note from './note';
import user from './user';

const addRoutes = function addRoutesToApp(app) {
  app.use('/api', paper, note, user);
};

export default addRoutes;
