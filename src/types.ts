/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ScreenId =
  | 'splash'
  | 'onboarding'
  | 'user-onboarding'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'verification'
  | 'home'
  | 'discover'
  | 'upload'
  | 'notifications'
  | 'profile'
  | 'creator-profile'
  | 'edit-profile'
  | 'settings'
  | 'settings-privacy'
  | 'settings-security'
  | 'settings-appearance'
  | 'settings-about'
  | 'settings-help'
  | 'settings-report-user'
  | 'settings-report-video'
  | 'settings-guidelines'
  | 'settings-terms'
  | 'settings-policy'
  | 'settings-withdraw'
  | 'creator-dashboard'
  | 'wallet'
  | 'admin-entry'
  | 'advertiser-entry'
  | 'error-404'
  | 'error-maintenance'
  | 'error-offline';

export interface Creator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  coverPhoto: string;
  bio: string;
  followersCount: string;
  followingCount: string;
  totalLikes: string;
  isFollowing: boolean;
  isVerified?: boolean;
  isMonetized?: boolean;
}

export interface Video {
  id: string;
  url: string; // fallback or main URL
  title: string;
  description: string;
  tags: string[];
  creator: Creator;
  music: string;
  likes: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  views?: number;
  createdAt?: string;
  mediaType?: 'video' | 'image' | 'carousel';
  images?: string[]; // for images/carousels
  texts?: any[]; // added for texts overlay
  stickers?: any[]; // added for stickers overlay
}

export interface Comment {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
}

export type NotificationType = 'like' | 'comment' | 'mention' | 'follow' | 'announcement' | 'system' | 'monetization';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  recipientId?: string;
  sender?: {
    id?: string;
    name: string;
    username: string;
    avatar: string;
  };
  message: string;
  timestamp: string;
  isRead: boolean;
  videoId?: string;
  videoThumbnail?: string;
  actionText?: string;
}

export interface Transaction {
  id: string;
  type: 'withdraw' | 'deposit' | 'earning' | 'tip';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  method?: string;
}
