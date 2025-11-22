export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  profileIsPublic: boolean;
  securityCode: string;
  blockedUserIds?: string[];
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  edited?: boolean;
  reactions?: Reaction[];
  type?: 'user' | 'system';
}

export interface Chat {
  id: string;
  participantIds: [string, string];
  messages: Message[];
  disappearingMessageTimer?: number | null; // in seconds
}

export interface Post {
  id:string;
  userId: string;
  imageUrl: string;
  caption: string;
  timestamp: string;
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image';
  caption?: string;
  timestamp: string;
}

export type Theme = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: Theme;
  notifications: boolean;
  profileIsPublic: boolean;
  enablePosts: boolean;
  enableStories: boolean;
  twoFactorEnabled: boolean;
  enableBiometrics: boolean;
  showSecurityNotifications: boolean;
}

export type Page = 'home' | 'chat' | 'profile' | 'settings' | 'discover';