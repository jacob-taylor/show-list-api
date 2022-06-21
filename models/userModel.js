const mongoose = require("mongoose");

const userModel = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  reset_password_code: { type: Number },
  show_list: [
    {
      id: Number,
      media_type: String,
      poster: String,
      backdrop: String,
      title: String,
      date: String,
      favorited: Boolean,
      reminder_date: Date,
      watched: Boolean,
      rating: Number,
      order: Number,
    },
  ],
  push_notifications: { type: Boolean },
  push_token: { type: String },
  streaming_services: [
    { provider_id: Number, logo_path: String, provider_name: String },
  ],
});

var User = (module.exports = mongoose.model("user", userModel));

module.exports.get = function (callback, limit) {
  User.find(callback).limit(limit);
};
