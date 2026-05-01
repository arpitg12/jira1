import Issue from '../models/Issue.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import webpush, { isPushConfigured } from './pushConfig.js';

const toId = (value) => String(value?._id || value || '');
const uniqueIds = (values = []) => [...new Set(values.map((value) => toId(value)).filter(Boolean))];

const removeInvalidPushSubscription = async (userId, subscription) => {
  if (!userId || !subscription?.endpoint) {
    return;
  }

  await User.findByIdAndUpdate(userId, {
    $pull: {
      pushSubscriptions: {
        endpoint: subscription.endpoint,
      },
    },
  });
};

const sendPushToUser = async (user, payload) => {
  if (!isPushConfigured() || !Array.isArray(user?.pushSubscriptions) || user.pushSubscriptions.length === 0) {
    return;
  }

  await Promise.allSettled(
    user.pushSubscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (error) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await removeInvalidPushSubscription(user._id, subscription);
        }
      }
    })
  );
};

const formatStatusLabel = (status = '') => String(status || '').trim().toLowerCase();

const getIssueStakeholderIds = (issue) =>
  uniqueIds([
    ...(issue?.assignees || []),
    ...(issue?.reviewAssignees || []),
    issue?.reporter,
  ]);

const buildNotificationPayload = (eventType, issue, extras = {}) => {
  const issueTitle = issue?.title || 'this ticket';
  const actorName = extras.actorName || 'A teammate';
  const statusFrom = formatStatusLabel(extras.previousStatus);
  const statusTo = formatStatusLabel(issue?.status);

  switch (eventType) {
    case 'TASK_CREATED':
      return {
        title: `${actorName} created ${issueTitle}`,
        body: `${actorName} created ${issueTitle}`,
        actorName,
        actionText: `created ${issueTitle}`,
      };
    case 'TASK_ASSIGNED':
      return {
        title: `${actorName} assigned you ${issueTitle}`,
        body: `${actorName} assigned you ${issueTitle}`,
        actorName,
        actionText: `assigned you ${issueTitle}`,
      };
    case 'TASK_UNASSIGNED':
      return {
        title: `${actorName} removed you from ${issueTitle}`,
        body: `${actorName} removed you from ${issueTitle}`,
        actorName,
        actionText: `removed you from ${issueTitle}`,
      };
    case 'TASK_REVIEW_ASSIGNED':
      return {
        title: `${actorName} assigned you as reviewer on ${issueTitle}`,
        body: `${actorName} assigned you as reviewer on ${issueTitle}`,
        actorName,
        actionText: `assigned you as reviewer on ${issueTitle}`,
      };
    case 'TASK_REVIEW_UNASSIGNED':
      return {
        title: `${actorName} removed you as reviewer from ${issueTitle}`,
        body: `${actorName} removed you as reviewer from ${issueTitle}`,
        actorName,
        actionText: `removed you as reviewer from ${issueTitle}`,
      };
    case 'TASK_COMMENTED':
      return {
        title: `${actorName} commented on ${issueTitle}`,
        body: `${actorName} commented on ${issueTitle}`,
        actorName,
        actionText: `commented on ${issueTitle}`,
      };
    case 'TASK_MENTIONED':
      return {
        title: `${actorName} mentioned you in ${issueTitle}`,
        body: `${actorName} mentioned you in ${issueTitle}`,
        actorName,
        actionText: `mentioned you in ${issueTitle}`,
      };
    case 'TASK_ATTACHMENT_ADDED':
      return {
        title: `${actorName} added an attachment to ${issueTitle}`,
        body: `${actorName} added an attachment to ${issueTitle}`,
        actorName,
        actionText: `added an attachment to ${issueTitle}`,
      };
    case 'TASK_UPDATED':
    default:
      return {
        title:
          statusFrom && statusTo && statusFrom !== statusTo
            ? `${actorName} changed the status from ${statusFrom} to ${statusTo} on ${issueTitle}`
            : `${actorName} updated ${issueTitle}`,
        body:
          statusFrom && statusTo && statusFrom !== statusTo
            ? `${actorName} changed the status from ${statusFrom} to ${statusTo} on ${issueTitle}`
            : `${actorName} updated ${issueTitle}`,
        actorName,
        actionText:
          statusFrom && statusTo && statusFrom !== statusTo
            ? `changed the status from ${statusFrom} to ${statusTo} on ${issueTitle}`
            : `updated ${issueTitle}`,
      };
  }
};

const resolveAudienceIds = (eventType, issue) => {
  switch (eventType) {
    case 'TASK_CREATED':
      return uniqueIds([issue?.reporter]);
    case 'TASK_ASSIGNED':
      return uniqueIds(issue?.assignees || []);
    case 'TASK_REVIEW_ASSIGNED':
      return uniqueIds(issue?.reviewAssignees || []);
    case 'TASK_COMMENTED':
    case 'TASK_UPDATED':
    case 'TASK_ATTACHMENT_ADDED':
      return getIssueStakeholderIds(issue);
    default:
      return [];
  }
};

const issueNotificationPopulate = [
  { path: 'assignees', select: 'username email role active' },
  { path: 'reviewAssignees', select: 'username email role active' },
  { path: 'reporter', select: 'username email role active' },
];

const getIssueWithNotificationContext = async (issueOrId) => {
  const issueId = toId(issueOrId);

  if (!issueId) {
    return null;
  }

  return Issue.findById(issueId).populate(issueNotificationPopulate);
};

const deliverNotification = async (eventType, issue, audienceIds, extras = {}) => {
  const excludedIds = new Set(uniqueIds([extras.actorId, ...(extras.excludeUserIds || [])]));
  const filteredAudienceIds = uniqueIds(audienceIds).filter((audienceId) => !excludedIds.has(audienceId));

  if (filteredAudienceIds.length === 0) {
    return;
  }

  const users = await User.find({
    _id: { $in: filteredAudienceIds },
    active: true,
  }).select('notificationSettings pushSubscriptions email username active');

  const payload = {
    ...buildNotificationPayload(eventType, issue, extras),
    url: `/admin/issue/${issue._id}`,
    type: eventType,
    issueTitle: issue?.title || '',
    issueKey: issue?.issueId || '',
    issueStatus: issue?.status || '',
  };

  const targetUsers = users.filter((user) => user?.notificationSettings?.[eventType] !== false);

  if (targetUsers.length === 0) {
    return;
  }

  await Notification.insertMany(
    targetUsers.map((user) => ({
      userId: user._id,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      actorName: payload.actorName,
      actionText: payload.actionText,
      issueTitle: payload.issueTitle,
      issueKey: payload.issueKey,
      issueStatus: payload.issueStatus,
      url: payload.url,
      isRead: false,
    }))
  );

  await Promise.allSettled(targetUsers.map((user) => sendPushToUser(user, payload)));
};

export const notify = async (eventType, issueOrId, extras = {}) => {
  const issue = await getIssueWithNotificationContext(issueOrId);

  if (!issue) {
    return;
  }

  const audienceIds = extras.audienceIds || resolveAudienceIds(eventType, issue);
  await deliverNotification(eventType, issue, audienceIds, extras);
};

export const notifyMentionedUsers = async (issueOrId, mentionedUserIds, extras = {}) => {
  const issue = await getIssueWithNotificationContext(issueOrId);

  if (!issue) {
    return;
  }

  await deliverNotification('TASK_MENTIONED', issue, uniqueIds(mentionedUserIds), extras);
};
