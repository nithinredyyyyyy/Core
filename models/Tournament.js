import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  game: {
    type: String,
    required: true,
    enum: ['BGMI', 'Valorant', 'CSGO', 'Free Fire', 'PUBG PC', 'Apex Legends']
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming'
  },
  prize_pool: {
    type: String,
    trim: true
  },
  start_date: {
    type: Date
  },
  end_date: {
    type: Date
  },
  stages: [{
    name: {
      type: String,
      trim: true
    },
    order: {
      type: Number
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed']
    }
  }],
  description: {
    type: String
  },
  banner_url: {
    type: String,
    trim: true
  },
  rules: {
    type: String
  },
  max_teams: {
    type: Number,
    default: 16
  }
}, {
  timestamps: true
});

tournamentSchema.index({ name: 1 });
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ game: 1 });

export default mongoose.model('Tournament', tournamentSchema);
