const mongoose = require('mongoose');

const blacklistTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: [true, "Token hash is required to be added in blacklist"],
    index: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

blacklistTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const tokenBlacklistModel = mongoose.model("blacklistToken", blacklistTokenSchema);

module.exports = tokenBlacklistModel;
