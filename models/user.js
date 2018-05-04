import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: String,
  nickname: String,
  password: String,
});

const UserModel = mongoose.model('user', userSchema);

export default UserModel;
