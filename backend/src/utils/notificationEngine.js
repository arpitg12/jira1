import Issue from '../models/Issue.js';
import Notification from '../models/Notification.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import webpush, { isPushConfigured } from './pushConfig.js';

const EVENT_TITLES = {
  TASK_CREATED: 'Task created',
  TASK_ASSIGNED: 'Task assigned',
  TASK_COMMENTED: 'New task comment',
  TASK_UPDATED: 'Task updated',
  TASK_MENTIONED: 'You were mentioned',
};

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

const getFallbackOpenProjectUserIds = async (roles = []) => {
  const filter = { active: true };

  if (roles.length > 0) {
    filter.role = { $in: roles };
  }

  const users = await User.find(filter).select('_id');
  return users.map((user) => toId(user));
};

const getProjectAudienceGroups = async (project) => {
  const managerIds = uniqueIds(project?.managers || []);
  const memberIds = uniqueIds(project?.members || []);
  const watcherIds = uniqueIds(project?.watchers || []);
  const visibleUserIds = uniqueIds(project?.visibleToUsers || []);
  const isOpenProject = visibleUserIds.length === 0;

  return {
    managers:
      managerIds.length > 0
        ? managerIds
        : isOpenProject
          ? await getFallbackOpenProjectUserIds(['Admin', 'Lead'])
          : [],
    members:
      memberIds.length > 0
        ? memberIds
        : visibleUserIds.length > 0
          ? visibleUserIds
          : await getFallbackOpenProjectUserIds(),
    watchers:
      watcherIds.length > 0
        ? watcherIds
        : visibleUserIds.length > 0
          ? visibleUserIds
          : await getFallbackOpenProjectUserIds(),
  };
};

const getTaskWatcherIds = (issue) =>
  uniqueIds([
    ...(issue?.watchers || []),
    ...(issue?.assignees || []),
    ...(issue?.reviewAssignees || []),
    issue?.reporter,
    ...(issue?.comments || []).flatMap((comment) => [
      comment?.author,
      ...(comment?.replies || []).map((reply) => reply?.author),
    ]),
  ]);

const formatStatusLabel = (status = '') => String(status || '').trim().toLowerCase();

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
        title: `${actorName} assigned ${issueTitle} to you`,
        body: `${actorName} assigned ${issueTitle} to you`,
        actorName,
        actionText: `assigned ${issueTitle} to you`,
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
        title: `${actorName} mentioned you on ${issueTitle}`,
        body: `${actorName} mentioned you on ${issueTitle}`,
        actorName,
        actionText: `mentioned you on ${issueTitle}`,
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

const resolveAudienceIds = async (eventType, issue) => {
  const projectAudience = await getProjectAudienceGroups(issue?.project);
  const taskWatcherIds = getTaskWatcherIds(issue);

  switch (eventType) {
    case 'TASK_CREATED':
      return uniqueIds([...projectAudience.managers, ...projectAudience.members]);
    case 'TASK_ASSIGNED':
      return uniqueIds(issue?.assignees || []);
    case 'TASK_COMMENTED':
      return uniqueIds([...taskWatcherIds, ...(issue?.assignees || [])]);
    case 'TASK_UPDATED':
      return uniqueIds([...projectAudience.watchers, ...taskWatcherIds]);
    default:
      return [];
  }
};

const issueNotificationPopulate = [
  { path: 'assignees', select: 'username email role active' },
  { path: 'reviewAssignees', select: 'username email role active' },
  { path: 'reporter', select: 'username email role active' },
  { path: 'watchers', select: 'username email role active' },
  { path: 'comments.author', select: 'username email role active' },
  { path: 'comments.replies.author', select: 'username email role active' },
  {
    path: 'project',
    populate: [
      { path: 'visibleToUsers', select: 'username email role active' },
      { path: 'managers', select: 'username email role active' },
      { path: 'members', select: 'username email role active' },
      { path: 'watchers', select: 'username email role active' },
    ],
  },
];

const getIssueWithNotificationContext = async (issueOrId) => {
  const issueId = toId(issueOrId);

  if (!issueId) {
    return null;
  }

  return Issue.findById(issueId).populate(issueNotificationPopulate);
};

const deliverNotification = async (eventType, issue, audienceIds, extras = {}) => {
  const filteredAudienceIds = uniqueIds(audienceIds).filter(
    (audienceId) => audienceId !== toId(extras.actorId)
  );

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

  if (!issue.project) {
    issue.project = await Project.findById(issue.project);
  }

  const audienceIds = await resolveAudienceIds(eventType, issue);
  await deliverNotification(eventType, issue, audienceIds, extras);
};

export const notifyMentionedUsers = async (issueOrId, mentionedUserIds, extras = {}) => {
  const issue = await getIssueWithNotificationContext(issueOrId);

  if (!issue) {
    return;
  }

  if (!issue.project) {
    issue.project = await Project.findById(issue.project);
  }

  await deliverNotification('TASK_MENTIONED', issue, uniqueIds(mentionedUserIds), extras);
};
