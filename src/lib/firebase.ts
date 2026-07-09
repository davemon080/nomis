/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  limit,
  deleteDoc
} from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Sign in with Google function
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Sync user data to Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    
    if (!userSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        name: user.displayName || 'Nomis Creator',
        username: (user.email ? user.email.split('@')[0] : 'user') + '_' + Math.floor(Math.random() * 1000),
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80',
        bio: 'Freshly joined the Nomis visual revolution! ⚡',
        followersCount: '0',
        followingCount: '0',
        totalLikes: '0',
        isFollowing: false,
        isVerified: false,
        email: user.email,
        createdAt: new Date().toISOString()
      });
    }
    
    return user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Log out function
export const logOut = async () => {
  await signOut(auth);
};

// Database helper functions for video and creator interactions
// 1. Like / Unlike a video
export const toggleLikeVideoInDb = async (videoId: string, userId: string, currentlyLiked: boolean) => {
  const videoRef = doc(db, 'videos', videoId);
  const userLikesRef = doc(db, 'users', userId, 'likes', videoId);
  
  if (currentlyLiked) {
    // Unlike
    await updateDoc(videoRef, {
      likes: increment(-1)
    });
    await setDoc(userLikesRef, { liked: false });
  } else {
    // Like
    await updateDoc(videoRef, {
      likes: increment(1)
    });
    await setDoc(userLikesRef, { liked: true, timestamp: new Date().toISOString() });

    try {
      // Create notification
      const videoSnap = await getDoc(videoRef);
      if (videoSnap.exists()) {
        const videoData = videoSnap.data();
        const creatorId = videoData.creator?.id;
        if (creatorId && creatorId !== userId) {
          const userSnap = await getDoc(doc(db, 'users', userId));
          const userData = userSnap.exists() ? userSnap.data() : null;
          
          await addDoc(collection(db, 'notifications'), {
            type: 'like',
            recipientId: creatorId,
            sender: {
              id: userId,
              name: userData?.name || 'Nomis Creator',
              username: userData?.username || 'user',
              avatar: userData?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80'
            },
            message: `liked your post: "${videoData.title || ''}"`,
            isRead: false,
            videoId: videoId,
            videoThumbnail: videoData.url || '',
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.warn("Could not create like notification:", err);
    }
  }
};

// 1.5 Save / Unsave a video (Bookmark)
export const toggleSaveVideoInDb = async (videoId: string, userId: string, currentlySaved: boolean) => {
  const videoRef = doc(db, 'videos', videoId);
  const userSavesRef = doc(db, 'users', userId, 'saves', videoId);
  
  if (currentlySaved) {
    // Unsave
    await updateDoc(videoRef, {
      savesCount: increment(-1)
    });
    await setDoc(userSavesRef, { saved: false });
  } else {
    // Save
    await updateDoc(videoRef, {
      savesCount: increment(1)
    });
    await setDoc(userSavesRef, { saved: true, timestamp: new Date().toISOString() });
  }
};

// 2. Follow / Unfollow a creator
export const toggleFollowCreatorInDb = async (currentUserId: string, targetCreatorId: string, currentlyFollowing: boolean) => {
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetCreatorId);
  
  // Also track inside subcollections
  const followingRef = doc(db, 'users', currentUserId, 'following', targetCreatorId);
  const followersRef = doc(db, 'users', targetCreatorId, 'followers', currentUserId);

  if (currentlyFollowing) {
    await setDoc(followingRef, { active: false });
    await setDoc(followersRef, { active: false });
  } else {
    await setDoc(followingRef, { active: true, timestamp: new Date().toISOString() });
    await setDoc(followersRef, { active: true, timestamp: new Date().toISOString() });

    try {
      // Create notification
      const userSnap = await getDoc(doc(db, 'users', currentUserId));
      const userData = userSnap.exists() ? userSnap.data() : null;
      
      await addDoc(collection(db, 'notifications'), {
        type: 'follow',
        recipientId: targetCreatorId,
        sender: {
          id: currentUserId,
          name: userData?.name || 'Nomis Creator',
          username: userData?.username || 'user',
          avatar: userData?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80'
        },
        message: 'started following you',
        isRead: false,
        actionText: 'Follow Back',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Could not create follow notification:", err);
    }
  }
};

// 3. Add a comment
export const addCommentToDb = async (videoId: string, userId: string, userName: string, userAvatar: string, text: string) => {
  const commentsCollection = collection(db, 'videos', videoId, 'comments');
  const commentDoc = await addDoc(commentsCollection, {
    user: {
      name: userName,
      username: userName.toLowerCase().replace(/\s+/g, '_'),
      avatar: userAvatar
    },
    text,
    timestamp: 'Just now',
    likes: 0,
    createdAt: new Date().toISOString()
  });

  // Increment comments count on video doc
  const videoRef = doc(db, 'videos', videoId);
  await updateDoc(videoRef, {
    commentsCount: increment(1)
  });

  try {
    // Create comment notification
    const videoSnap = await getDoc(videoRef);
    if (videoSnap.exists()) {
      const videoData = videoSnap.data();
      const creatorId = videoData.creator?.id;
      if (creatorId && creatorId !== userId) {
        const userSnap = await getDoc(doc(db, 'users', userId));
        const userData = userSnap.exists() ? userSnap.data() : null;
        
        await addDoc(collection(db, 'notifications'), {
          type: 'comment',
          recipientId: creatorId,
          sender: {
            id: userId,
            name: userName,
            username: userData?.username || userName.toLowerCase().replace(/\s+/g, '_'),
            avatar: userAvatar
          },
          message: `commented on your post: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`,
          isRead: false,
          videoId: videoId,
          videoThumbnail: videoData.url || '',
          createdAt: new Date().toISOString()
        });
      }

      // Also process mentions inside the comment text!
      const words = text.split(/\s+/);
      const mentionedUsernames = words
        .filter(w => w.startsWith('@'))
        .map(w => w.substring(1).replace(/[^\w]/g, '').toLowerCase())
        .filter(w => w.length > 0);

      const uniqueUsernames = Array.from(new Set(mentionedUsernames));
      for (const username of uniqueUsernames) {
        const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const targetUserId = qSnap.docs[0].id;
          if (targetUserId !== userId) {
            await addDoc(collection(db, 'notifications'), {
              type: 'mention',
              recipientId: targetUserId,
              sender: {
                id: userId,
                name: userName,
                username: userName.toLowerCase().replace(/\s+/g, '_'),
                avatar: userAvatar
              },
              message: `mentioned you in a comment: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`,
              isRead: false,
              videoId: videoId,
              videoThumbnail: videoData.url || '',
              createdAt: new Date().toISOString()
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("Could not create comment notification:", err);
  }

  return {
    id: commentDoc.id,
    user: {
      name: userName,
      username: userName.toLowerCase().replace(/\s+/g, '_'),
      avatar: userAvatar
    },
    text,
    timestamp: 'Just now',
    likes: 0,
    isLiked: false
  };
};

// 3.5 Handle Mentions in Caption
export const handleMentionsInPost = async (
  captionText: string,
  videoId: string,
  videoThumbnail: string,
  senderId: string
) => {
  try {
    if (!captionText) return;
    
    // Parse mentions like @username
    const words = captionText.split(/\s+/);
    const usernames = words
      .filter(w => w.startsWith('@'))
      .map(w => w.substring(1).replace(/[^\w]/g, '').toLowerCase())
      .filter(w => w.length > 0);
      
    if (usernames.length === 0) return;
    
    const uniqueUsernames = Array.from(new Set(usernames));
    
    // Fetch sender details
    const senderSnap = await getDoc(doc(db, 'users', senderId));
    const senderData = senderSnap.exists() ? senderSnap.data() : null;
    const senderInfo = {
      id: senderId,
      name: senderData?.name || 'Nomis Creator',
      username: senderData?.username || 'user',
      avatar: senderData?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80'
    };
    
    // For each username, look up user and create notification
    for (const username of uniqueUsernames) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username), limit(1));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        const targetUserDoc = querySnap.docs[0];
        const targetUserId = targetUserDoc.id;
        
        // Don't notify yourself
        if (targetUserId === senderId) continue;
        
        await addDoc(collection(db, 'notifications'), {
          type: 'mention',
          recipientId: targetUserId,
          sender: senderInfo,
          message: `mentioned you in a post: "${captionText.slice(0, 50)}${captionText.length > 50 ? '...' : ''}"`,
          isRead: false,
          videoId: videoId,
          videoThumbnail: videoThumbnail,
          createdAt: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.warn("Error processing mentions in post:", error);
  }
};

// Seed initial videos to firestore if database is empty
export const seedInitialVideosIfEmpty = async (initialVideos: any[]) => {
  try {
    const videosCol = collection(db, 'videos');
    const q = query(videosCol, limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("Seeding database with initial videos...");
      for (const video of initialVideos) {
        await setDoc(doc(db, 'videos', video.id), {
          ...video,
          createdAt: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.error("Error seeding initial videos:", err);
  }
};

// 4. Like / Unlike a comment
export const toggleLikeCommentInDb = async (videoId: string, commentId: string, userId: string, currentlyLiked: boolean) => {
  try {
    const commentRef = doc(db, 'videos', videoId, 'comments', commentId);
    const userCommentLikesRef = doc(db, 'users', userId, 'commentLikes', commentId);
    
    if (currentlyLiked) {
      await updateDoc(commentRef, {
        likes: increment(-1)
      });
      await setDoc(userCommentLikesRef, { liked: false });
    } else {
      await updateDoc(commentRef, {
        likes: increment(1)
      });
      await setDoc(userCommentLikesRef, { liked: true, timestamp: new Date().toISOString() });
    }
  } catch (err) {
    console.error("Error toggling comment like:", err);
  }
};

// 5. Add a comment reply
export const addCommentReplyToDb = async (
  videoId: string,
  commentId: string,
  userId: string,
  userName: string,
  userAvatar: string,
  text: string
) => {
  try {
    const repliesCollection = collection(db, 'videos', videoId, 'comments', commentId, 'replies');
    const replyDoc = await addDoc(repliesCollection, {
      user: {
        name: userName,
        username: userName.toLowerCase().replace(/\s+/g, '_'),
        avatar: userAvatar
      },
      text,
      createdAt: new Date().toISOString()
    });

    // Optionally increment a replies count on the comment document itself
    const commentRef = doc(db, 'videos', videoId, 'comments', commentId);
    await updateDoc(commentRef, {
      repliesCount: increment(1)
    }).catch(() => {}); // Optional, ignore if comment doc schema doesn't have it

    return {
      id: replyDoc.id,
      user: {
        name: userName,
        username: userName.toLowerCase().replace(/\s+/g, '_'),
        avatar: userAvatar
      },
      text,
      createdAt: new Date().toISOString()
    };
  } catch (err) {
    console.error("Error adding comment reply:", err);
    throw err;
  }
};

// 6. Share a video
export const incrementShareCountInDb = async (videoId: string) => {
  try {
    const videoRef = doc(db, 'videos', videoId);
    await updateDoc(videoRef, {
      sharesCount: increment(1)
    });
  } catch (err) {
    console.error("Error incrementing share count:", err);
  }
};

// 7. Delete a video from Firestore
export const deleteVideoFromDb = async (videoId: string) => {
  try {
    const videoRef = doc(db, 'videos', videoId);
    const snap = await getDoc(videoRef);
    if (snap.exists()) {
      const data = snap.data();
      const url = data.url;
      if (url && url.startsWith('/uploads/')) {
        try {
          await fetch(`/api/uploads?url=${encodeURIComponent(url)}`, {
            method: 'DELETE'
          });
        } catch (err) {
          console.warn("Failed to delete physical file on server:", err);
        }
      }
    }
    await deleteDoc(videoRef);
  } catch (err) {
    console.error("Error deleting video from DB:", err);
    throw err;
  }
};

// 8. Increment views count on a video doc
export const incrementVideoViewsInDb = async (videoId: string) => {
  try {
    const videoRef = doc(db, 'videos', videoId);
    await updateDoc(videoRef, {
      views: increment(1)
    });
  } catch (err) {
    console.error("Error incrementing video views in Firestore:", err);
  }
};

// 8.5 Record watch time event in Firestore for a video creator
export const recordWatchTimeInDb = async (videoId: string, creatorId: string, durationInSeconds: number) => {
  try {
    if (durationInSeconds <= 0) return;
    const watchEventsCol = collection(db, 'watch_events');
    await addDoc(watchEventsCol, {
      videoId,
      creatorId,
      duration: durationInSeconds,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error recording watch time in Firestore:", err);
  }
};

// 8.6 Get aggregated watch time for a creator (with option to delay by 24 hours)
export const getCreatorWatchTime = async (creatorId: string, delay24Hours: boolean = true): Promise<number> => {
  try {
    const watchEventsCol = collection(db, 'watch_events');
    const q = query(watchEventsCol, where('creatorId', '==', creatorId));
    const snap = await getDocs(q);
    
    let totalSeconds = 0;
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const duration = data.duration || 0;
      const timestampStr = data.timestamp;
      
      if (timestampStr) {
        const timestamp = new Date(timestampStr).getTime();
        if (delay24Hours) {
          // Exclude any events that happened in the last 24 hours
          if (timestamp < twentyFourHoursAgo) {
            totalSeconds += duration;
          }
        } else {
          totalSeconds += duration;
        }
      } else {
        // If no timestamp, default to older than 24h
        totalSeconds += duration;
      }
    });

    return totalSeconds;
  } catch (err) {
    console.error("Error fetching creator watch time from DB:", err);
    return 0;
  }
};

// 9. Clean up any dummy/test users from Firestore
export const deleteDummyUsersFromDb = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    querySnapshot.forEach(async (docSnap) => {
      const id = docSnap.id;
      const data = docSnap.data();
      const isDummyId = id.startsWith('c') && id.length <= 3; // e.g. c1, c2, c3
      const isDummyEmail = data.email && (data.email.includes('test') || data.email.includes('dummy') || data.email.includes('example.com'));
      const isDummyUsername = data.username && (data.username.includes('test') || data.username.includes('dummy'));
      const isGuest = id === 'guest';

      if (isDummyId || isDummyEmail || isDummyUsername || isGuest) {
        console.log(`Deleting dummy user from DB: ${id}`);
        await deleteDoc(doc(db, 'users', id));
      }
    });
  } catch (err) {
    console.error("Error deleting dummy users:", err);
  }
};

// 10. Email and Password Auth Helpers
export const registerWithEmail = async (email: string, password: string, name: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Sync user data to Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      name: name || 'Nomis Creator',
      username: (email ? email.split('@')[0] : 'user') + '_' + Math.floor(Math.random() * 1000),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80',
      bio: 'Freshly joined the Nomis visual revolution! ⚡',
      followersCount: '0',
      followingCount: '0',
      totalLikes: '0',
      isFollowing: false,
      isVerified: false,
      email: email,
      createdAt: new Date().toISOString()
    });
    
    return user;
  } catch (error) {
    console.error("Error in registerWithEmail:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error in loginWithEmail:", error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error in resetPassword:", error);
    throw error;
  }
};

// 11. Purge all dummy/seeded videos, fake accounts, and sample assets
export const purgeAllDummyAndSeededData = async () => {
  try {
    console.log("Purging all dummy and seeded data from database...");
    
    // Purge all documents from the videos collection
    const videosCol = collection(db, 'videos');
    const videosSnapshot = await getDocs(videosCol);
    for (const docSnap of videosSnapshot.docs) {
      const id = docSnap.id;
      console.log(`Purging video document: ${id}`);
      await deleteDoc(doc(db, 'videos', id));
    }

    // Purge all dummy/seeded creators and fake accounts from users collection
    const usersCol = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCol);
    for (const docSnap of usersSnapshot.docs) {
      const id = docSnap.id;
      const data = docSnap.data();
      const isDummyId = (id.startsWith('c') && id.length <= 3) || id === 'guest';
      const isDummyEmail = data.email && (
        data.email.includes('test') || 
        data.email.includes('dummy') || 
        data.email.includes('example.com') || 
        data.email.includes('elena') || 
        data.email.includes('marcus') || 
        data.email.includes('nomis')
      );
      const isDummyUsername = data.username && (
        data.username.includes('test') || 
        data.username.includes('dummy') ||
        data.username.includes('elena') || 
        data.username.includes('marcus') || 
        data.username.includes('nomis')
      );

      if (isDummyId || isDummyEmail || isDummyUsername) {
        console.log(`Purging dummy user document: ${id}`);
        await deleteDoc(doc(db, 'users', id));
      }
    }
    console.log("Database purged successfully!");
  } catch (err) {
    console.error("Error in purgeAllDummyAndSeededData:", err);
  }
};


