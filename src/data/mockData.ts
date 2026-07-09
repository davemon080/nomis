/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Creator, Video, Comment, NotificationItem, Transaction } from '../types';

export const mockCreators: Creator[] = [
  {
    id: 'c1',
    name: 'Elena Rostova',
    username: 'elena_design',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80',
    coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80',
    bio: 'Digital artist & minimalist designer. Sharing daily creative hacks and aesthetic room layouts. 🤍',
    followersCount: '1.2M',
    followingCount: '342',
    totalLikes: '4.8M',
    isFollowing: true,
    isVerified: true
  },
  {
    id: 'c2',
    name: 'Marcus Chen',
    username: 'marcus_vibe',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80',
    coverPhoto: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&h=300&fit=crop&q=80',
    bio: 'Urban skater and tech enthusiast. Capturing neon city vibes, mechanical keyboards, and synthwave beats.',
    followersCount: '840K',
    followingCount: '198',
    totalLikes: '2.9M',
    isFollowing: false,
    isVerified: true
  },
  {
    id: 'c3',
    name: 'Nomis Studio',
    username: 'nomis_official',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
    coverPhoto: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=300&fit=crop&q=80',
    bio: 'Official channel of Nomis. Explore our curated visual showcases of pure architecture, style, and motion design.',
    followersCount: '5.6M',
    followingCount: '12',
    totalLikes: '22.4M',
    isFollowing: true,
    isVerified: true
  },
  {
    id: 'c4',
    name: 'Aria Taylor',
    username: 'aria_acoustic',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&q=80',
    coverPhoto: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=300&fit=crop&q=80',
    bio: 'Singer/Songwriter. Just me, my guitar, and some glassmorphic lighting. New album out soon! ✨',
    followersCount: '312K',
    followingCount: '450',
    totalLikes: '1.2M',
    isFollowing: false
  }
];

export const mockVideos: Video[] = [
  {
    id: 'v1',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-in-front-of-a-wall-with-neon-lights-40003-large.mp4',
    title: 'Neon Vibe Dance Session',
    description: 'Feeling the electric rhythm of these neon walls tonight. Custom glass installations and ambient synth beats in my studio.',
    tags: ['neon', 'dance', 'glassmorphism', 'aesthetic', 'vibe'],
    creator: mockCreators[0],
    music: 'Elena Rostova - Cyberpunk Solitude',
    likes: 124200,
    commentsCount: 1840,
    sharesCount: 3200,
    savesCount: 9400,
    isLiked: true,
    isSaved: false
  },
  {
    id: 'v2',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skating-on-the-street-40134-large.mp4',
    title: 'Cruising into the Golden Hour',
    description: 'Golden hour hits different when gliding on glass-smooth asphalt. Testing out the new customized dual-shred board.',
    tags: ['skate', 'goldenhour', 'california', 'freestyle', 'lifestyle'],
    creator: mockCreators[1],
    music: 'Lofi Records - Sundown Session',
    likes: 85900,
    commentsCount: 924,
    sharesCount: 1420,
    savesCount: 5210,
    isLiked: false,
    isSaved: true
  },
  {
    id: 'v3',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-taking-photos-with-her-smart-phone-in-the-city-39885-large.mp4',
    title: 'Visual Hunting in Tokyo',
    description: 'Finding abstract reflections, translucent overlays, and modular structures hidden in urban architecture. Check out my final shots!',
    tags: ['tokyo', 'streetphotography', 'reflections', 'minimalism', 'architecture'],
    creator: mockCreators[2],
    music: 'Nomis Beat Lab - Tokyo Glassscape',
    likes: 342000,
    commentsCount: 4120,
    sharesCount: 12800,
    savesCount: 28400,
    isLiked: true,
    isSaved: true
  },
  {
    id: 'v4',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-a-retro-arcade-game-41870-large.mp4',
    title: 'Retro Arcade Luminescence',
    description: 'Getting lost in physical glass buttons and CRT screen scanlines. That analog texture is unmatched.',
    tags: ['retro', 'arcade', 'cyberpunk', 'synthwave', 'macro'],
    creator: mockCreators[3],
    music: 'Aria Acoustic - Retro Neon (Lofi Acoustic Cover)',
    likes: 42100,
    commentsCount: 380,
    sharesCount: 890,
    savesCount: 1980,
    isLiked: false,
    isSaved: false
  }
];

export const mockComments: Comment[] = [
  {
    id: 'cm1',
    user: {
      name: 'Oliver Vance',
      username: 'oliver_visuals',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80'
    },
    text: 'That glass overlay in the transition is absolutely beautiful! How did you achieve that level of refraction? 🔥',
    timestamp: '2h ago',
    likes: 482,
    isLiked: true
  },
  {
    id: 'cm2',
    user: {
      name: 'Sophia Sterling',
      username: 'sophia_code',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=80'
    },
    text: 'Tokyo architecture is a playground for glassmorphism. This composition is so clean, outstanding content!',
    timestamp: '5h ago',
    likes: 219
  },
  {
    id: 'cm3',
    user: {
      name: 'Kenji Sato',
      username: 'kenji_sound',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&q=80'
    },
    text: 'The music matches the visuals perfectly. Is this track coming to Spotify soon? The synth chords are incredible.',
    timestamp: '1d ago',
    likes: 105
  },
  {
    id: 'cm4',
    user: {
      name: 'Lara Croft',
      username: 'lara_explores',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80'
    },
    text: 'Incredible speed! The pacing is perfect for short form. Loop is flawless.',
    timestamp: '2d ago',
    likes: 64
  }
];

export const mockNotifications: NotificationItem[] = [];

export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    type: 'earning',
    amount: 1450.00,
    status: 'completed',
    date: 'July 04, 2026',
    method: 'Ad Revenue Share'
  },
  {
    id: 't2',
    type: 'tip',
    amount: 250.00,
    status: 'completed',
    date: 'July 02, 2026',
    method: 'Elena Rostova (Tip)'
  },
  {
    id: 't3',
    type: 'withdraw',
    amount: -1500.00,
    status: 'completed',
    date: 'June 28, 2026',
    method: 'Bank Transfer (•••• 4321)'
  },
  {
    id: 't4',
    type: 'earning',
    amount: 1240.50,
    status: 'completed',
    date: 'June 15, 2026',
    method: 'Creator Fund Program'
  },
  {
    id: 't5',
    type: 'withdraw',
    amount: -800.00,
    status: 'pending',
    date: 'July 05, 2026',
    method: 'PayPal (dave••••@gmail.com)'
  }
];

export const mockCreatorAnalytics = {
  views: {
    total: '4.2M',
    growth: '+18.4%',
    chartData: [
      { label: 'Mon', value: 120000 },
      { label: 'Tue', value: 145000 },
      { label: 'Wed', value: 210000 },
      { label: 'Thu', value: 180000 },
      { label: 'Fri', value: 290000 },
      { label: 'Sat', value: 380000 },
      { label: 'Sun', value: 420000 }
    ]
  },
  likes: {
    total: '840K',
    growth: '+22.1%',
    chartData: [
      { label: 'Mon', value: 24000 },
      { label: 'Tue', value: 31000 },
      { label: 'Wed', value: 48000 },
      { label: 'Thu', value: 39000 },
      { label: 'Fri', value: 62000 },
      { label: 'Sat', value: 85000 },
      { label: 'Sun', value: 92000 }
    ]
  },
  revenue: {
    total: '$3,140.50',
    growth: '+12.7%',
    chartData: [
      { label: 'Mon', value: 110 },
      { label: 'Tue', value: 140 },
      { label: 'Wed', value: 195 },
      { label: 'Thu', value: 160 },
      { label: 'Fri', value: 275 },
      { label: 'Sat', value: 340 },
      { label: 'Sun', value: 390 }
    ]
  },
  watchTime: {
    total: '12.5 hrs',
    growth: '+15.2%',
    chartData: [
      { label: 'Mon', value: 45 },
      { label: 'Tue', value: 52 },
      { label: 'Wed', value: 68 },
      { label: 'Thu', value: 61 },
      { label: 'Fri', value: 89 },
      { label: 'Sat', value: 110 },
      { label: 'Sun', value: 125 }
    ]
  }
};
