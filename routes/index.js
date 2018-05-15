import paper from './paper';
import note from './note';
import user from './user';
import highlight from './highlight';

const addRoutes = function addRoutesToApp(app) {
  app.use('/api', paper, note, user, highlight);
};

export default addRoutes;
