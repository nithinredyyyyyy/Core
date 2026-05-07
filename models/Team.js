import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  tag: {
    type: String,
    required: true,
    trim: true
  },
  logo_url: {
    type: String,
    trim: true
  },
  game: {
    type: String,
    enum: ['BGMI', 'Valorant', 'CSGO', 'Free Fire', 'PUBG PC', 'Apex Legends']
  },
  region: {
    type: String,
    trim: true
  },
  total_kills: {
    type: Number,
    default: 0
  },
  total_points: {
    type: Number,
    default: 0
  },
  matches_played: {
    type: Number,
    default: 0
  },
  wins: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

teamSchema.index({ name: 1 });
teamSchema.index({ tag: 1 });
teamSchema.index({ game: 1 });
teamSchema.index({ region: 1 });

export default mongoose.model('Team', teamSchema);
