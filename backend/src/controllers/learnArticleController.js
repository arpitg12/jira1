import LearnArticle from '../models/LearnArticle.js';
import { isAdmin } from '../middleware/auth.js';

const authorPopulate = {
  path: 'author',
  select: 'username email role',
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sanitizeArticlePayload = (payload = {}) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

const isArticleOwnerOrAdmin = (user, article) =>
  isAdmin(user) || String(article?.author?._id || article?.author || '') === String(user?._id || '');

export const createArticle = async (req, res) => {
  try {
    const { title, summary, content, conclusion } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'Header and main article are required' });
    }

    const article = await LearnArticle.create({
      title: title.trim(),
      summary: summary?.trim() || '',
      content: content.trim(),
      conclusion: conclusion?.trim() || '',
      author: req.user._id,
    });

    await article.populate(authorPopulate);

    res.status(201).json({
      message: 'Article created successfully',
      article,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArticles = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search?.trim()) {
      filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    const articles = await LearnArticle.find(filter)
      .populate(authorPopulate)
      .sort({ updatedAt: -1, createdAt: -1 });

    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArticleById = async (req, res) => {
  try {
    const article = await LearnArticle.findById(req.params.id).populate(authorPopulate);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateArticle = async (req, res) => {
  try {
    const article = await LearnArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (!isArticleOwnerOrAdmin(req.user, article)) {
      return res.status(403).json({ error: 'Only the author or an admin can edit this article' });
    }

    const updates = sanitizeArticlePayload({
      title: req.body.title?.trim(),
      summary: req.body.summary?.trim(),
      content: req.body.content?.trim(),
      conclusion: req.body.conclusion?.trim(),
    });

    if ('title' in updates && !updates.title) {
      return res.status(400).json({ error: 'Header is required' });
    }

    if ('content' in updates && !updates.content) {
      return res.status(400).json({ error: 'Main article is required' });
    }

    Object.assign(article, updates);
    await article.save();
    await article.populate(authorPopulate);

    res.json({
      message: 'Article updated successfully',
      article,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteArticle = async (req, res) => {
  try {
    const article = await LearnArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (!isArticleOwnerOrAdmin(req.user, article)) {
      return res.status(403).json({ error: 'Only the author or an admin can delete this article' });
    }

    await article.deleteOne();

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
