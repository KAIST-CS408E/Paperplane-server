import paper from './paper';
import note from './note';
import user from './user';
import highlight from './highlight';
import summary from './summary';

const addRoutes = function addRoutesToApp(app) {
  app.use('/api', paper, note, user, highlight, summary);
};

export default addRoutes;
