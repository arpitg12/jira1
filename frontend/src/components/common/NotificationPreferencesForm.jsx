import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { useNotifications } from '../../context/NotificationContext';

const SETTING_LABELS = {
  TASK_CREATED: 'Task created',
  TASK_ASSIGNED: 'Task assigned',
  TASK_COMMENTED: 'Task commented',
  TASK_MENTIONED: 'Mentioned in comment',
  TASK_UPDATED: 'Task updated',
};

export const NotificationPreferencesForm = () => {
  const {
    notificationSettings,
    savePreferences,
    isSavingSettings,
    permission,
  } = useNotifications();
  const [draftSettings, setDraftSettings] = useState(notificationSettings);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    setDraftSettings(notificationSettings);
  }, [notificationSettings]);

  const handleToggle = (settingKey) => {
    setDraftSettings((current) => ({
      ...current,
      [settingKey]: !current?.[settingKey],
    }));
    setStatusMessage('');
  };

  const handleSave = async () => {
    await savePreferences(draftSettings);
    setStatusMessage('Preferences saved.');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-sm font-semibold text-white">Browser push status</p>
        <p className="mt-1 text-xs text-white/55">
          Permission: <span className="font-semibold text-white/80">{permission}</span>
        </p>
      </div>

      <div className="space-y-2">
        {Object.entries(SETTING_LABELS).map(([settingKey, label]) => (
          <div
            key={settingKey}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
          >
            <div>
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-white/45">Store it in history and deliver it to your devices.</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle(settingKey)}
              className={`relative h-6 w-11 rounded-full transition ${
                draftSettings?.[settingKey] ? 'bg-primary' : 'bg-white/15'
              }`}
              aria-label={`Toggle ${label}`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                  draftSettings?.[settingKey] ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/45">{statusMessage || 'Changes apply to new notifications immediately.'}</p>
        <Button type="button" size="sm" onClick={handleSave} disabled={isSavingSettings}>
          {isSavingSettings ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};
