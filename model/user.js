var mongoose = require('mongoose');
var UserSchema = new mongoose.Schema({
  google_id: String,
  facebook_id: String,
  picture: String,
  user_name: String,
  password: String,
  display_name: String,
  updated_at: { type: Date, default: Date.now },
});
var findOrCreate = require('mongoose-findorcreate')
UserSchema.plugin(findOrCreate);

module.exports = mongoose.model('User', UserSchema);