import mongoose from 'mongoose';

const newsArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['tournament', 'patch_update', 'roster_change', 'announcement', 'general']
  },
  thumbnail_url: {
    type: String,
    trim: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  game: {
    type: String,
    enum: ['BGMI', 'Valorant', 'CSGO', 'Free Fire', 'PUBG PC', 'Apex Legends', 'General']
  }
}, {
  timestamps: true
});

newsArticleSchema.index({ category: 1 });
newsArticleSchema.index({ game: 1 });
newsArticleSchema.index({ featured: 1 });
newsArticleSchema.index({ createdAt: -1 });

export default mongoose.model('NewsArticle', newsArticleSchema);
