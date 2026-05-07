import mongoose from 'mongoose';

const matchResultSchema = new mongoose.Schema({
  match_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  tournament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  placement: {
    type: Number
  },
  kill_points: {
    type: Number,
    default: 0
  },
  placement_points: {
    type: Number,
    default: 0
  },
  total_points: {
    type: Number,
    default: 0
  },
  stage: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

matchResultSchema.index({ match_id: 1 });
matchResultSchema.index({ team_id: 1 });
matchResultSchema.index({ placement: 1 });

export default mongoose.model('MatchResult', matchResultSchema);
