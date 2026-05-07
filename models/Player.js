import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  ign: {
    type: String,
    required: true,
    trim: true
  },
  real_name: {
    type: String,
    trim: true
  },
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  role: {
    type: String,
    enum: ['IGL', 'Assaulter', 'Sniper', 'Support', 'Flex']
  },
  photo_url: {
    type: String,
    trim: true
  },
  total_kills: {
    type: Number,
    default: 0
  },
  matches_played: {
    type: Number,
    default: 0
  },
  avg_damage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

playerSchema.index({ team_id: 1 });
playerSchema.index({ ign: 1 });

export default mongoose.model('Player', playerSchema);
