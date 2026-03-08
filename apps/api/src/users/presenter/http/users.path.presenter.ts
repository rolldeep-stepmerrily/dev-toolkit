export const UsersRouter = {
  Root: 'users',
  HttpApiTags: 'Users',
  Http: {
    GetMe: 'me',
    UpdateProfile: 'me',
    ChangePassword: 'me/password',
    GetBookmarks: 'me/bookmarks',
    ToggleBookmark: 'me/bookmarks/:toolId',
    GetHistory: 'me/history',
    RecordHistory: 'me/history/:toolId',
  },
} as const;
