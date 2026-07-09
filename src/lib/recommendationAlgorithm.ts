/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Video } from '../types';
import { collection, getDocs, query, where, addDoc, limit, orderBy } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface UserActivity {
  id?: string;
  userId: string;
  videoId: string;
  activityType: 'like' | 'save' | 'comment' | 'share' | 'watch';
  tags: string[];
  creatorId: string;
  watchDuration?: number; // In seconds
  timestamp: string;
}

/**
 * 1. Log a user activity in Firestore for the recommendation engine
 */
export const logUserActivity = async (
  videoId: string,
  activityType: 'like' | 'save' | 'comment' | 'share' | 'watch',
  tags: string[],
  creatorId: string,
  watchDuration?: number
) => {
  try {
    const user = auth.currentUser;
    const userId = user ? user.uid : 'guest';
    
    // Save locally to localStorage for instant guest customization or fast lookup
    const localKey = `nomis_activities_${userId}`;
    const localActivities: UserActivity[] = JSON.parse(localStorage.getItem(localKey) || '[]');
    const newActivity: UserActivity = {
      userId,
      videoId,
      activityType,
      tags: tags || [],
      creatorId,
      watchDuration,
      timestamp: new Date().toISOString()
    };
    localActivities.push(newActivity);
    // Keep only last 100 activities locally
    if (localActivities.length > 100) {
      localActivities.shift();
    }
    localStorage.setItem(localKey, JSON.stringify(localActivities));

    // Also persist in Firestore if logged in
    if (user) {
      await addDoc(collection(db, 'user_activities'), {
        ...newActivity,
        createdAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn("Could not log activity in Firestore:", err);
  }
};

/**
 * 2. Fetch all activities for a user to build their interest profile
 */
export const getUserActivities = async (userId: string): Promise<UserActivity[]> => {
  try {
    // Start with local storage for instant loads
    const localKey = `nomis_activities_${userId}`;
    const localList: UserActivity[] = JSON.parse(localStorage.getItem(localKey) || '[]');

    if (userId === 'guest') {
      return localList;
    }

    // Try fetching from Firestore
    const q = query(
      collection(db, 'user_activities'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    const dbActivities: UserActivity[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      dbActivities.push({
        id: docSnap.id,
        userId: data.userId,
        videoId: data.videoId,
        activityType: data.activityType,
        tags: data.tags || [],
        creatorId: data.creatorId,
        watchDuration: data.watchDuration,
        timestamp: data.timestamp || data.createdAt
      });
    });

    // Merge & deduplicate by videoId + activityType to ensure precise signal vectors
    const merged = [...dbActivities, ...localList];
    const uniqueMap = new Map<string, UserActivity>();
    merged.forEach(act => {
      const key = `${act.videoId}_${act.activityType}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, act);
      }
    });

    return Array.from(uniqueMap.values());
  } catch (err) {
    console.warn("Error getting user activities from Firestore, using local fallback:", err);
    const localKey = `nomis_activities_${userId}`;
    return JSON.parse(localStorage.getItem(localKey) || '[]');
  }
};

/**
 * 3. Core Recommendation Algorithm
 * Matches videos with user's behavioral patterns, tags preferences, and discovery factors.
 */
export const personalizeFeed = async (
  allVideos: Video[],
  userId: string
): Promise<Video[]> => {
  if (!allVideos || allVideos.length === 0) return [];

  // Deduplicate input videos list just in case
  const videos = Array.from(new Map(allVideos.map(v => [v.id, v])).values());

  const activities = await getUserActivities(userId);

  // If no activity yet, serve videos sorted by global engagement with dynamic discovery noise
  if (activities.length === 0) {
    return [...videos].sort((a, b) => {
      const scoreA = (a.likes || 0) * 2 + (a.views || 0) + Math.random() * 50;
      const scoreB = (b.likes || 0) * 2 + (b.views || 0) + Math.random() * 50;
      return scoreB - scoreA;
    });
  }

  // --- BUILD THE USER PROFILE VECTORS ---
  const tagScores: Record<string, number> = {};
  const creatorScores: Record<string, number> = {};
  const watchedVideoIds = new Set<string>();

  // Signal weights representing user intent / behavior importance
  const weights = {
    like: 15,
    save: 25,
    comment: 10,
    share: 20,
    watchShort: -10, // Swiped away fast
    watchNormal: 15, // Watched some portion
    watchFull: 35,   // Loop or 100%+ completion
  };

  activities.forEach((act) => {
    let scoreBoost = 0;
    
    if (act.activityType === 'like') scoreBoost = weights.like;
    else if (act.activityType === 'save') scoreBoost = weights.save;
    else if (act.activityType === 'comment') scoreBoost = weights.comment;
    else if (act.activityType === 'share') scoreBoost = weights.share;
    else if (act.activityType === 'watch') {
      watchedVideoIds.add(act.videoId);
      const duration = act.watchDuration || 0;
      if (duration < 3) {
        scoreBoost = weights.watchShort; // Penalty for skipping
      } else if (duration > 15) {
        scoreBoost = weights.watchFull;  // Massive boost for high watch duration
      } else {
        scoreBoost = weights.watchNormal;
      }
    }

    // Apply score boost to video tags
    if (act.tags && Array.isArray(act.tags)) {
      act.tags.forEach((tag) => {
        const cleanTag = tag.replace('#', '').trim().toLowerCase();
        if (cleanTag) {
          tagScores[cleanTag] = (tagScores[cleanTag] || 0) + scoreBoost;
        }
      });
    }

    // Apply score boost to creators
    if (act.creatorId) {
      creatorScores[act.creatorId] = (creatorScores[act.creatorId] || 0) + scoreBoost;
    }
  });

  // --- SCORE ALL VIDEOS ---
  const scoredVideos = videos.map((video) => {
    let score = 0;

    // 1. Tag Preference Overlap (Topic Match)
    if (video.tags && Array.isArray(video.tags)) {
      video.tags.forEach((tag) => {
        const cleanTag = tag.replace('#', '').trim().toLowerCase();
        if (tagScores[cleanTag]) {
          score += tagScores[cleanTag]; // Add cumulative preference score
        }
      });
    }

    // 2. Creator Affinity (Creator Match)
    if (video.creator?.id && creatorScores[video.creator.id]) {
      score += creatorScores[video.creator.id];
    }

    // 3. Global Popularity (Views/Likes base weight)
    const totalEngagements = (video.likes || 0) * 3 + (video.savesCount || 0) * 4 + (video.sharesCount || 0) * 2;
    const popularityScore = Math.min(totalEngagements / ( (video.views || 1) + 1 ) * 50, 100);
    score += popularityScore;

    // 4. Recency Boost (Fresh new content gets prioritized)
    if (video.createdAt) {
      const ageInMs = Date.now() - new Date(video.createdAt).getTime();
      const ageInHours = ageInMs / (1000 * 60 * 60);
      const recencyBoost = Math.max(50 - ageInHours * 0.5, 0); // Decays over time (50 points max)
      score += recencyBoost;
    }

    // 5. Deduplication/Freshness Penalty
    // If they have already watched this exact video, deprioritize it slightly to avoid stale loops
    if (watchedVideoIds.has(video.id)) {
      score -= 80;
    }

    // 6. Controlled Serendipity & Exploration Noise (TikTok style discovery mechanism)
    // This allows the algorithm to learn new tastes as users interact with random suggested tags
    const serendipityNoise = Math.random() * 45; 
    score += serendipityNoise;

    return {
      video,
      score
    };
  });

  // Sort by calculated preference score descending
  scoredVideos.sort((a, b) => b.score - a.score);

  return scoredVideos.map(sv => sv.video);
};
