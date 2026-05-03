import React, { useMemo, useState } from 'react';
import { IoChevronDown, IoChevronUp, IoClose, IoSearch } from 'react-icons/io5';

const toggleSelection = (selectedIds, userId) =>
  selectedIds.includes(userId)
    ? selectedIds.filter((id) => id !== userId)
    : [...selectedIds, userId];

const buildTriggerLabel = (users, selectedIds, placeholder) => {
  const selectedUsers = users.filter((user) => selectedIds.includes(user._id));

  if (selectedUsers.length === 0) {
    return placeholder;
  }

  if (selectedUsers.length <= 2) {
    return selectedUsers.map((user) => user.username).join(', ');
  }

  return `${selectedUsers.slice(0, 2).map((user) => user.username).join(', ')} +${selectedUsers.length - 2}`;
};

export const SearchableUserMultiSelect = ({
  users = [],
  selectedIds = [],
  onChange,
  emptyLabel = 'No users found',
  placeholder = 'Select users',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const username = user?.username?.toLowerCase() || '';
      const email = user?.email?.toLowerCase() || '';
      return username.includes(query) || email.includes(query);
    });
  }, [search, users]);

  const triggerLabel = buildTriggerLabel(users, selectedIds, placeholder);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0d1015] px-3 py-2.5 text-left transition hover:border-white/20"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white/85">{triggerLabel}</p>
          <p className="mt-1 text-xs text-white/45">
            {selectedIds.length} selected
          </p>
        </div>
        <span className="shrink-0 text-white/45">
          {isOpen ? <IoChevronUp size={16} /> : <IoChevronDown size={16} />}
        </span>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          <div className="relative">
            <IoSearch
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Type a name..."
              className="w-full rounded-lg border border-white/10 bg-[#0d1015] py-2 pl-8 pr-9 text-sm text-white placeholder-white/30"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-white/75"
                aria-label="Clear user search"
              >
                <IoClose size={14} />
              </button>
            )}
          </div>

          <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-[#0d1015] p-3">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <label key={user._id} className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user._id)}
                    onChange={() => onChange(toggleSelection(selectedIds, user._id))}
                    className="rounded border-white/20 bg-transparent text-primary"
                  />
                  <span className="truncate">{user.username}</span>
                </label>
              ))
            ) : (
              <div className="text-xs text-white/45">{emptyLabel}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
