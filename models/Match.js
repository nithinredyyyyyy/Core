import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  tournament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  stage: {
    type: String,
    required: true,
    trim: true
  },
  match_number: {
    type: Number
  },
  map: {
    type: String,
    enum: [
      'Erangel',
      'Miramar',
      'Rondo',
      'Haven',
      'Bind',
      'Split',
      'Ascent',
      'Icebox',
      'Breeze',
      'Fracture',
      'Pearl',
      'Lotus',
      'Sunset',
      'Other'
    ]
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed'],
    default: 'scheduled'
  },
  scheduled_time: {
    type: Date
  },
  stream_url: {
    type: String,
    trim: true
  },
  day: {
    type: Number
  },
  scoreboard: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MatchResult'
  }]
}, {
  timestamps: true
});

matchSchema.index({ tournament_id: 1 });
matchSchema.index({ scheduled_time: 1 });
matchSchema.index({ status: 1 });

export default mongoose.model('Match', matchSchema);
