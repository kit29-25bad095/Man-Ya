import type { User, Chat, Post, Story } from './types';

export const MOCK_USERS: User[] = [
  { id: 'user-1', username: 'aetheria', avatarUrl: 'https://picsum.photos/seed/aetheria/200', profileIsPublic: false, securityCode: 'ax-23-de-56', blockedUserIds: [] },
  { id: 'user-2', username: 'alex', avatarUrl: 'https://picsum.photos/seed/alex/200', profileIsPublic: true, securityCode: 'fg-90-jk-12', blockedUserIds: [] },
  { id: 'user-3', username: 'casey', avatarUrl: 'https://picsum.photos/seed/casey/200', profileIsPublic: false, securityCode: 'lm-34-op-78', blockedUserIds: [] },
];

export const MOCK_CHATS: Chat[] = [
  {
    id: 'chat-1',
    participantIds: ['user-1', 'user-2'],
    disappearingMessageTimer: null,
    messages: [
      { id: 'msg-1-1', senderId: 'user-2', text: 'Hey, how is the new secure app?', timestamp: '2023-10-27T10:00:00Z', type: 'user' },
      { id: 'msg-1-2', senderId: 'user-1', text: 'It\'s amazing! So private and the UI is slick.', timestamp: '2023-10-27T10:01:00Z', reactions: [{ emoji: '❤️', userIds: ['user-2'] }], type: 'user' },
      { id: 'msg-1-3', senderId: 'user-2', text: 'Love the galaxy theme in the chat.', timestamp: '2023-10-27T10:01:30Z', type: 'user' },
    ],
  },
  {
    id: 'chat-2',
    participantIds: ['user-1', 'user-3'],
    disappearingMessageTimer: 86400, // 24 hours
    messages: [
      { id: 'msg-2-1', senderId: 'user-3', text: 'Did you try the chat lock feature?', timestamp: '2023-10-27T11:00:00Z', type: 'user' },
      { id: 'msg-2-2', senderId: 'user-1', text: 'Yes! It works perfectly. My chats have never been more secure.', timestamp: '2023-10-27T11:01:00Z', type: 'user' },
    ],
  },
];

export const MOCK_POSTS: Post[] = [
    {
        id: 'post-1',
        userId: 'user-1',
        imageUrl: 'https://picsum.photos/seed/post1/500',
        caption: 'Exploring new horizons. ✨',
        timestamp: '2023-10-26T18:30:00Z',
    },
    {
        id: 'post-2',
        userId: 'user-2',
        imageUrl: 'https://picsum.photos/seed/post2/500',
        caption: 'A moment of peace.',
        timestamp: '2023-10-25T12:00:00Z',
    },
    {
        id: 'post-3',
        userId: 'user-1',
        imageUrl: 'https://picsum.photos/seed/post3/500',
        caption: 'City lights.',
        timestamp: '2023-10-24T21:45:00Z',
    },
     {
        id: 'post-4',
        userId: 'user-2',
        imageUrl: 'https://picsum.photos/seed/post4/500',
        caption: 'Public post for the discover feed!',
        timestamp: '2023-10-23T11:00:00Z',
    },
];

export const MOCK_STORIES: Story[] = [
    { id: 'story-1', userId: 'user-2', mediaUrl: 'https://picsum.photos/seed/story_alex1/400/800', mediaType: 'image', caption: 'Having a great time!', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }, // 2 hours ago
    { id: 'story-2', userId: 'user-2', mediaUrl: 'https://picsum.photos/seed/story_alex2/400/800', mediaType: 'image', caption: 'Look at this sunset', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }, // 1 hour ago
    { id: 'story-3', userId: 'user-3', mediaUrl: 'https://picsum.photos/seed/story_casey1/400/800', mediaType: 'image', caption: 'Working on a new project', timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() }, // 10 hours ago
    { id: 'story-4', userId: 'user-1', mediaUrl: 'https://picsum.photos/seed/story_aetheria1/400/800', mediaType: 'image', caption: 'My own story!', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() }, // 5 hours ago
    { id: 'story-5', userId: 'user-3', mediaUrl: 'https://picsum.photos/seed/story_casey2/400/800', mediaType: 'image', timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString() }, // 30 hours ago (expired)
];