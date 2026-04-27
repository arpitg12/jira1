import Issue from '../models/Issue.js';

export const migrateLegacyIssueAssignments = async () => {
  await Issue.collection.updateMany(
    {},
    [
      {
        $set: {
          assignees: {
            $setUnion: [
              { $ifNull: ['$assignees', []] },
              {
                $cond: [
                  { $ifNull: ['$assignee', false] },
                  ['$assignee'],
                  [],
                ],
              },
            ],
          },
          reviewAssignees: {
            $setUnion: [
              { $ifNull: ['$reviewAssignees', []] },
              {
                $cond: [
                  { $ifNull: ['$reviewAssignee', false] },
                  ['$reviewAssignee'],
                  [],
                ],
              },
            ],
          },
        },
      },
      {
        $unset: ['assignee', 'reviewAssignee'],
      },
    ]
  );
};
