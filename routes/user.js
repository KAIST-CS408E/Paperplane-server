import express from 'express';
import UserModel from '../models/user';

const router = express.Router();

// router.get('/users/:_id', async (req, res) => {
//   /* TODO: authenticate user with uid; req.user._id === req.params._id? */
//   let user;
//   try {
//     user = await UserModel.findOne({ _id: req.params._id });
//   } catch (err) {
//     return res.status(500).end(err.message);
//   }
//   const { password, ...userWithoutPassword } = user;
//   res.json(userWithoutPassword);
// });

router.post('/users', async (req, res) => {
  const { id, nickname, password } = req.body;
  if (!id || !nickname || !password) return res.status(400).end('id, nickname, password should be given.');
  if (await UserModel.findOne({ id })) return res.status(400).end('Duplicate id.');

  const newUser = new UserModel({
    id,
    nickname,
    password,
  });

  try {
    await newUser.save();
  } catch (err) {
    return res.status(500).end(err.message);
  }

  res.status(201).end(`Successfully created a new user: ${id}`);
});

router.post('/login', async (req, res) => {
  const { id, password } = req.body;

  let user;
  try {
    user = await UserModel.findOne({ id, password });
  } catch (err) {
    return res.status(500).end(err.message);
  }
  if (!user) return res.status(401).end();
  const { password: _, ...userWithoutPassword } = user._doc;
  res.status(200).json(userWithoutPassword);
});

export default router;
