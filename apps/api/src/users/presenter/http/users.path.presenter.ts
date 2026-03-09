export const UsersRouter = {
  Root: 'users',
  HttpApiTags: 'Users',
  Http: {
    GetMe: 'me',
    UpdateProfile: 'me',
    GetAvatarPresignedUrl: 'me/avatar/presigned',
    ChangePassword: 'me/password',
    GetBookmarks: 'me/bookmarks',
    ToggleBookmark: 'me/bookmarks/:toolId',
  },
} as const;
