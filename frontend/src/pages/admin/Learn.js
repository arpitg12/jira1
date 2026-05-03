import React, { useDeferredValue, useEffect, useState } from 'react';
import {
  IoAdd,
  IoArrowForward,
  IoBookOutline,
  IoClose,
  IoPencil,
  IoSearch,
  IoTrash,
} from 'react-icons/io5';
import AdminLayout from '../../layouts/AdminLayout';
import { Breadcrumb, Button, Modal } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import {
  createLearnArticle,
  deleteLearnArticle,
  getLearnArticles,
  updateLearnArticle,
} from '../../services/api';

const emptyArticleForm = {
  title: '',
  summary: '',
  content: '',
  conclusion: '',
};

const formatArticleDate = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

const getAuthorName = (article) =>
  article?.author?.username || article?.author?.email || 'Workspace teammate';

const getInitial = (article) => getAuthorName(article).slice(0, 1).toUpperCase();

const Learn = () => {
  const { user, isAdmin } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [composerError, setComposerError] = useState('');
  const [search, setSearch] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create');
  const [articleForm, setArticleForm] = useState(emptyArticleForm);

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        const data = await getLearnArticles();
        setArticles(data || []);
        setError('');
      } catch (loadError) {
        setError(loadError.message || 'Failed to load learn articles');
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  const authorOptions = [...new Map(
    articles
      .filter((article) => article?.author?._id)
      .map((article) => [
        String(article.author._id),
        {
          id: String(article.author._id),
          name: getAuthorName(article),
        },
      ])
  ).values()].sort((left, right) => left.name.localeCompare(right.name));

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = deferredSearch
      ? article.title?.toLowerCase().includes(deferredSearch)
      : true;

    const matchesAuthor = authorFilter
      ? String(article.author?._id || '') === authorFilter
      : true;

    return matchesSearch && matchesAuthor;
  });

  const openCreateModal = () => {
    setEditorMode('create');
    setArticleForm(emptyArticleForm);
    setFeedback(null);
    setComposerError('');
    setIsComposerOpen(true);
  };

  const openEditModal = (article) => {
    setSelectedArticle(article);
    setEditorMode('edit');
    setArticleForm({
      title: article.title || '',
      summary: article.summary || '',
      content: article.content || '',
      conclusion: article.conclusion || '',
    });
    setFeedback(null);
    setComposerError('');
    setIsComposerOpen(true);
  };

  const closeComposer = () => {
    setIsComposerOpen(false);
    setArticleForm(emptyArticleForm);
    setComposerError('');
  };

  const canManageArticle = (article) =>
    isAdmin || String(article?.author?._id || '') === String(user?._id || '');

  const syncArticleState = (nextArticle) => {
    setArticles((currentArticles) =>
      currentArticles.map((article) => (article._id === nextArticle._id ? nextArticle : article))
    );
    setSelectedArticle((currentArticle) =>
      currentArticle?._id === nextArticle._id ? nextArticle : currentArticle
    );
  };

  const prependArticleState = (nextArticle) => {
    setArticles((currentArticles) => [nextArticle, ...currentArticles]);
    setSelectedArticle(nextArticle);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setComposerError('');

      if (editorMode === 'edit' && selectedArticle?._id) {
        const response = await updateLearnArticle(selectedArticle._id, articleForm);
        syncArticleState(response.article);
        setFeedback({ type: 'success', message: 'Article updated successfully.' });
      } else {
        const response = await createLearnArticle(articleForm);
        prependArticleState(response.article);
        setFeedback({ type: 'success', message: 'Article published to the Learn hub.' });
      }

      closeComposer();
    } catch (submitError) {
      setComposerError(submitError.message || 'Unable to save article right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`Delete "${article.title}"?`)) {
      return;
    }

    try {
      setDeletingId(article._id);
      setFeedback(null);
      await deleteLearnArticle(article._id);
      setArticles((currentArticles) =>
        currentArticles.filter((currentArticle) => currentArticle._id !== article._id)
      );
      setSelectedArticle((currentArticle) =>
        currentArticle?._id === article._id ? null : currentArticle
      );
      setFeedback({ type: 'success', message: 'Article deleted successfully.' });
    } catch (deleteError) {
      setFeedback({
        type: 'error',
        message: deleteError.message || 'Unable to delete this article.',
      });
    } finally {
      setDeletingId('');
    }
  };

  return (
    <AdminLayout>
      <div className="-mx-3 -my-3 min-h-[calc(100vh-120px)] ui-dark-page px-3 py-4 text-white md:-mx-5 md:px-6 md:py-6">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/admin' },
            { label: 'Learn', href: '/admin/learn', active: true },
          ]}
        />

        <section className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,122,24,0.12),rgba(255,255,255,0.03),rgba(29,155,240,0.12))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="display-font text-2xl font-bold tracking-tight text-white md:text-3xl">
                Learn
              </h1>
              <p className="mt-2 text-sm text-white/60">
                Share useful knowledge with the team and find articles by header.
              </p>
            </div>
            <Button variant="primary" className="flex items-center gap-2" onClick={openCreateModal}>
              <IoAdd size={16} />
              Write article
            </Button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
            <div className="relative">
              <IoSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by article header..."
                className="w-full rounded-[1.1rem] border border-white/12 bg-white/[0.08] py-3.5 pl-12 pr-12 text-sm text-white placeholder-white/32"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/45 transition hover:bg-white/10 hover:text-white/80"
                  aria-label="Clear search"
                >
                  <IoClose size={16} />
                </button>
              )}
            </div>

            <select
              value={authorFilter}
              onChange={(event) => setAuthorFilter(event.target.value)}
              className="w-full rounded-[1.1rem] border border-white/12 bg-white/[0.08] py-3.5 text-sm text-white"
            >
              <option value="">All authors</option>
              {authorOptions.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {feedback && (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100'
                : 'border-red-400/30 bg-red-500/15 text-red-100'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Articles</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/45">
              {filteredArticles.length} article{filteredArticles.length === 1 ? '' : 's'}
            </div>
          </div>

          {loading ? (
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 px-6 py-16 text-center text-sm text-white/65">
              Loading the Learn hub...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-white/12 bg-white/[0.03] px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-white/60">
                <IoBookOutline size={28} />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">
                {search ? 'No article matched that header.' : 'The Learn hub is ready for the first article.'}
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/55">
                {search
                  ? 'Try a different header keyword, or publish a new article so teammates can discover it here.'
                  : 'Start with something useful your team learned today. A strong summary and conclusion make it much easier to revisit later.'}
              </p>
              <Button variant="primary" className="mt-6 inline-flex items-center gap-2" onClick={openCreateModal}>
                <IoAdd size={16} />
                Create first article
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filteredArticles.map((article) => (
                <button
                  key={article._id}
                  type="button"
                  onClick={() => setSelectedArticle(article)}
                  className="group rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-black/20 text-sm font-semibold text-white">
                        {getInitial(article)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{getAuthorName(article)}</p>
                        <p className="text-xs text-white/48">Updated {formatArticleDate(article.updatedAt)}</p>
                      </div>
                    </div>
                    {canManageArticle(article) && (
                      <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/60">
                        Edit
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-semibold leading-8 text-white">
                    {article.title}
                  </h3>

                  <div className="mt-5 flex items-center justify-between text-sm text-white/55">
                    <span>Open full article</span>
                    <span className="flex items-center gap-2 text-white transition group-hover:translate-x-1">
                      Read
                      <IoArrowForward size={16} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <Modal
          isOpen={isComposerOpen}
          onClose={closeComposer}
          title={editorMode === 'edit' ? 'Edit Learn Article' : 'Write Learn Article'}
          size="3xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-dark">Header</label>
                <input
                  type="text"
                  value={articleForm.title}
                  onChange={(event) =>
                    setArticleForm((currentForm) => ({ ...currentForm, title: event.target.value }))
                  }
                  placeholder="Example: What I learned about API caching today"
                  maxLength={180}
                  required
                  className="w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-dark">Summary</label>
                <textarea
                  value={articleForm.summary}
                  onChange={(event) =>
                    setArticleForm((currentForm) => ({ ...currentForm, summary: event.target.value }))
                  }
                  placeholder="Give teammates a quick overview so they know why this article matters."
                  rows={3}
                  maxLength={400}
                  className="w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-dark">Main Article</label>
                <textarea
                  value={articleForm.content}
                  onChange={(event) =>
                    setArticleForm((currentForm) => ({ ...currentForm, content: event.target.value }))
                  }
                  placeholder="Write the full knowledge article here. You can structure it with short paragraphs and bullet points."
                  rows={10}
                  required
                  className="w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-dark">Conclusion</label>
                <textarea
                  value={articleForm.conclusion}
                  onChange={(event) =>
                    setArticleForm((currentForm) => ({ ...currentForm, conclusion: event.target.value }))
                  }
                  placeholder="Close with the final takeaway, best practice, or recommendation."
                  rows={4}
                  maxLength={800}
                  className="w-full"
                />
              </div>
            </div>

            {composerError && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                {composerError}
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
              Only header and main article are required. Summary and conclusion can stay empty.
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" type="submit" disabled={saving} className="flex items-center gap-2">
                {saving
                  ? editorMode === 'edit'
                    ? 'Saving...'
                    : 'Publishing...'
                  : editorMode === 'edit'
                    ? 'Save changes'
                    : 'Publish article'}
              </Button>
              <Button type="button" variant="secondary" onClick={closeComposer}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={Boolean(selectedArticle) && !isComposerOpen}
          onClose={() => setSelectedArticle(null)}
          title={selectedArticle?.title || 'Learn Article'}
          size="6xl"
        >
          {selectedArticle && (
            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(249,115,22,0.14),rgba(14,165,233,0.14),rgba(255,255,255,0.03))] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-black/15 text-lg font-semibold text-white">
                      {getInitial(selectedArticle)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{getAuthorName(selectedArticle)}</p>
                      <p className="mt-1 text-sm text-white/50">
                        Posted {formatArticleDate(selectedArticle.createdAt)} | Updated {formatArticleDate(selectedArticle.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {canManageArticle(selectedArticle) && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        className="flex items-center gap-2"
                        onClick={() => openEditModal(selectedArticle)}
                      >
                        <IoPencil size={15} />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        className="flex items-center gap-2"
                        disabled={deletingId === selectedArticle._id}
                        onClick={() => handleDelete(selectedArticle)}
                      >
                        <IoTrash size={15} />
                        {deletingId === selectedArticle._id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="space-y-4">
                  {selectedArticle.summary ? (
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/40">Summary</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/70">
                        {selectedArticle.summary}
                      </p>
                    </div>
                  ) : null}
                  {selectedArticle.conclusion ? (
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/40">Conclusion</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/70">
                        {selectedArticle.conclusion}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/40">Full article</p>
                  <div className="mt-4 whitespace-pre-wrap text-sm leading-8 text-white/75">
                    {selectedArticle.content || 'No detailed article content added yet.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default Learn;
