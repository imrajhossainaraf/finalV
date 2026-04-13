const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  mac: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  location: { type: String },
  last_seen: { type: Date },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', deviceSchema);
