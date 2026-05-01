import React, { useEffect, useMemo, useRef, useState } from 'react';

const mentionTokenPattern = /(^|\s)@([a-zA-Z0-9._-]*)$/;

export const MentionTextarea = ({
  value,
  onChange,
  users = [],
  currentUserId = '',
  placeholder = '',
  rows = 3,
  className = '',
}) => {
  const textareaRef = useRef(null);
  const [mentionState, setMentionState] = useState({
    isOpen: false,
    query: '',
    start: -1,
    end: -1,
    activeIndex: 0,
  });

  const suggestions = useMemo(() => {
    if (!mentionState.isOpen) {
      return [];
    }

    const normalizedQuery = mentionState.query.trim().toLowerCase();

    return users
      .filter(
        (user) =>
          user?._id &&
          String(user._id) !== String(currentUserId || '') &&
          user?.username
      )
      .filter((user) =>
        normalizedQuery
          ? user.username.toLowerCase().includes(normalizedQuery)
          : true
      )
      .slice(0, 6);
  }, [currentUserId, mentionState.isOpen, mentionState.query, users]);

  useEffect(() => {
    if (!mentionState.isOpen) {
      return;
    }

    if (suggestions.length === 0) {
      setMentionState((current) => ({ ...current, activeIndex: 0 }));
      return;
    }

    if (mentionState.activeIndex > suggestions.length - 1) {
      setMentionState((current) => ({ ...current, activeIndex: 0 }));
    }
  }, [mentionState.activeIndex, mentionState.isOpen, suggestions.length]);

  const syncMentionState = (nextValue, cursorPosition) => {
    const prefix = nextValue.slice(0, cursorPosition);
    const match = prefix.match(mentionTokenPattern);

    if (!match) {
      setMentionState({
        isOpen: false,
        query: '',
        start: -1,
        end: -1,
        activeIndex: 0,
      });
      return;
    }

    const query = match[2] || '';
    const start = cursorPosition - query.length - 1;

    setMentionState((current) => {
      const isSameMention =
        current.isOpen &&
        current.query === query &&
        current.start === start &&
        current.end === cursorPosition;

      return {
        isOpen: true,
        query,
        start,
        end: cursorPosition,
        activeIndex: isSameMention ? current.activeIndex : 0,
      };
    });
  };

  const handleChange = (event) => {
    const nextValue = event.target.value;
    const cursorPosition = event.target.selectionStart ?? nextValue.length;
    onChange(nextValue);
    syncMentionState(nextValue, cursorPosition);
  };

  const handleSelectMention = (selectedUser) => {
    if (!selectedUser?.username || mentionState.start < 0 || mentionState.end < mentionState.start) {
      return;
    }

    const replacement = `@${selectedUser.username} `;
    const nextValue = `${value.slice(0, mentionState.start)}${replacement}${value.slice(mentionState.end)}`;
    const nextCursorPosition = mentionState.start + replacement.length;

    onChange(nextValue);
    setMentionState({
      isOpen: false,
      query: '',
      start: -1,
      end: -1,
      activeIndex: 0,
    });

    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  const handleKeyDown = (event) => {
    if (!mentionState.isOpen || suggestions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setMentionState((current) => ({
        ...current,
        activeIndex: (current.activeIndex + 1) % suggestions.length,
      }));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setMentionState((current) => ({
        ...current,
        activeIndex: current.activeIndex === 0 ? suggestions.length - 1 : current.activeIndex - 1,
      }));
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      handleSelectMention(suggestions[mentionState.activeIndex]);
    }

    if (event.key === 'Escape') {
      setMentionState((current) => ({ ...current, isOpen: false }));
    }
  };

  return (
    <div className="relative overflow-visible">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={(event) => syncMentionState(event.target.value, event.target.selectionStart ?? 0)}
        onKeyUp={(event) => syncMentionState(event.target.value, event.target.selectionStart ?? 0)}
        onBlur={() => {
          window.setTimeout(() => {
            setMentionState((current) => ({ ...current, isOpen: false }));
          }, 120);
        }}
        rows={rows}
        placeholder={placeholder}
        className={className}
      />

      {mentionState.isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#101318] shadow-2xl">
          {suggestions.map((suggestion, index) => {
            const isActive = index === mentionState.activeIndex;

            return (
              <button
                key={suggestion._id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSelectMention(suggestion);
                }}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                  isActive ? 'bg-primary/15' : 'hover:bg-white/5'
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-semibold text-white">
                  {suggestion.username.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{suggestion.username}</span>
                  <span className="block truncate text-xs text-white/45">{suggestion.email || suggestion.role || 'User'}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
