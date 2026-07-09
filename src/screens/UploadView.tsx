/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Film, 
  ChevronRight, 
  ChevronLeft,
  Eye, 
  Globe, 
  Lock, 
  Users, 
  Sparkles, 
  Check, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Trash2,
  AtSign,
  Hash,
  Info,
  Calendar,
  Sparkle,
  ArrowLeft,
  X,
  FileVideo,
  Camera,
  Plus,
  Image as ImageIcon,
  Circle,
  SwitchCamera,
  SlidersHorizontal,
  Music,
  Smile,
  Mic,
  ChevronDown,
  MapPin,
  FolderClosed,
  Send
} from 'lucide-react';
import { ScreenId } from '../types';
import { GlassCard, GlassInput, GlassButton, GlassProgressBar, GlassSwitch } from '../components/GlassDesignSystem';
import { generateVideoThumbnail } from '../lib/thumbnailCache';
import { auth, db } from '../lib/firebase';
import { collection, query, onSnapshot, limit } from 'firebase/firestore';

interface UploadViewProps {
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (message: string) => void;
  onAddMockVideo: (videoData: { 
    title: string; 
    description: string; 
    tags: string[]; 
    visibility: string; 
    videoUrl: string; 
    rawFile?: File | Blob;
    mediaType?: 'video' | 'image' | 'carousel';
    images?: string[];
  }) => void;
}

type Stage = 'record' | 'preview' | 'configure';

export const UploadView: React.FC<UploadViewProps> = ({
  onNavigate,
  onShowToast,
  onAddMockVideo
}) => {
  // Navigation Flow Stage
  const [currentStage, setCurrentStage] = useState<Stage>('record');

  // Mentions selection state
  const [showMentionSelector, setShowMentionSelector] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [allCreators, setAllCreators] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (docSnap.id !== auth.currentUser?.uid) {
          loaded.push({
            id: docSnap.id,
            name: data.name || 'Nomis Creator',
            username: data.username || 'user',
            avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80'
          });
        }
      });
      setAllCreators(loaded);
    }, (error) => {
      console.warn("Could not fetch creators for mentions list:", error);
    });
    return unsubscribe;
  }, []);

  // Form states
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState('Public');
  
  // Media configuration
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'carousel'>('video');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isCameraSupported, setIsCameraSupported] = useState(true);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [captureMode, setCaptureMode] = useState<'video' | 'photo'>('photo');
  const [selectedAudioUrl, setSelectedAudioUrl] = useState<string | null>(null);
  const [selectedAudioName, setSelectedAudioName] = useState<string>('Add sound');

  // Selection/Progress states
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transferSpeed, setTransferSpeed] = useState('0.0 MB/s');

  // Cover frame selection
  const [coverPosition, setCoverPosition] = useState(25); // Percentage or index of image
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  // Interactive Permissions & Advanced states
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuet, setAllowDuet] = useState(true);
  const [allowStitch, setAllowStitch] = useState(true);
  const [aiGeneratedLabel, setAiGeneratedLabel] = useState(false);
  const [highQualityUpload, setHighQualityUpload] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('2026-07-08T18:00');

  // Preview interactive states
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [previewMuted, setPreviewMuted] = useState(false);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [showSidePanel, setShowSidePanel] = useState(false);

  // Advanced interactive flow states
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showMoreOptionsModal, setShowMoreOptionsModal] = useState(false);
  const [showVisibilitySelector, setShowVisibilitySelector] = useState(false);

  // New states for interactive overlays (Text, Stickers, and Sound Editing)
  const [isSoundPanelOpen, setIsSoundPanelOpen] = useState(false);
  const [isTextPanelOpen, setIsTextPanelOpen] = useState(false);
  const [isStickersPanelOpen, setIsStickersPanelOpen] = useState(false);
  const [texts, setTexts] = useState<Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    size: number;
    bgStyle: 'none' | 'solid' | 'frosted';
  }>>([]);
  const [stickers, setStickers] = useState<Array<{
    id: string;
    emoji: string;
    x: number;
    y: number;
    scale: number;
  }>>([]);
  const [musicVolume, setMusicVolume] = useState(80);
  const [videoVolume, setVideoVolume] = useState(50);
  const [currentText, setCurrentText] = useState('');
  const [currentTextColor, setCurrentTextColor] = useState('#ffffff');
  const [currentTextBgStyle, setCurrentTextBgStyle] = useState<'none' | 'solid' | 'frosted'>('none');
  const [currentTextSize, setCurrentTextSize] = useState(18);
  const [isEditingTextId, setIsEditingTextId] = useState<string | null>(null);

  // Suggestion mentions states
  const [mentionSearchQuery, setMentionSearchQuery] = useState<string | null>(null);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);

  // Smooth dragging & delete zone states
  const [draggingItemId, setDraggingItemId] = useState<{ id: string; type: 'text' | 'sticker' } | null>(null);
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);



  const handleCaptionChange = (val: string) => {
    setCaption(val);
    const lastWord = val.split(/\s+/).pop() || '';
    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1);
      setMentionSearchQuery(query);
      setShowMentionDropdown(true);
    } else {
      setMentionSearchQuery(null);
      setShowMentionDropdown(false);
    }
  };

  const selectMention = (username: string) => {
    const words = caption.split(/\s+/);
    words.pop(); // remove incomplete @word
    words.push(`@${username}`);
    const nextCaption = words.join(' ') + ' ';
    setCaption(nextCaption);
    setShowMentionDropdown(false);
    setMentionSearchQuery(null);
    onShowToast(`Mentioned @${username}!`, 'success');
  };

  const mediaContainerRef = useRef<HTMLDivElement>(null);

  const isPointInDeleteZone = (point: { x: number; y: number }) => {
    const zone = document.getElementById('drag-delete-zone');
    if (!zone) return false;
    const rect = zone.getBoundingClientRect();
    return (
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom
    );
  };

  // Synchronize audio and video volumes
  useEffect(() => {
    if (previewVideoRef.current) {
      previewVideoRef.current.volume = videoVolume / 100;
    }
  }, [videoVolume]);

  useEffect(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.volume = musicVolume / 100;
    }
  }, [musicVolume]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Popular hashtags standard to creators
  const popularHashtags = [
    'fyp', 'foryou', 'motion', '3dart', 'vibe', 'cyberpunk', 'sounddesign', 'loop', 'refraction', 'scifi'
  ];

  // Camera activation and recording logic
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      setCameraStream(stream);
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera failed or denied:', err);
      setIsCameraSupported(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (currentStage === 'record') {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [currentStage, facingMode]);

  // Handle timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startRecording = () => {
    if (!cameraStream && isCameraSupported) {
      onShowToast('Wait for camera preview to initialize.');
      return;
    }
    recordedChunksRef.current = [];
    try {
      const options = { mimeType: 'video/webm;codecs=vp9' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(cameraStream!, options);
      } catch (e) {
        recorder = new MediaRecorder(cameraStream!);
      }
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const objectUrl = URL.createObjectURL(blob);
        setMediaType('video');
        setUploadedImages([]);
        setSelectedVideoUrl(objectUrl);
        setSelectedFile(new File([blob], 'recorded_video.webm', { type: 'video/webm' }));
        onShowToast('Recording captured! Opening preview...');
        setCurrentStage('preview');
      };
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (err) {
      console.error('Failed to start recorder:', err);
      // Simulate recording if we are in a headless environment without recording support
      setIsRecording(true);
      setRecordingSeconds(0);
      onShowToast('Recording simulation started...');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // Fallback simulation
        const simulatedUrl = 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skating-on-the-street-40134-large.mp4';
        setMediaType('video');
        setUploadedImages([]);
        setSelectedVideoUrl(simulatedUrl);
        onShowToast('Recording captured!');
        setCurrentStage('preview');
      }
      setIsRecording(false);
    } else if (isRecording) {
      // Direct simulation stop
      setIsRecording(false);
      const simulatedUrl = 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skating-on-the-street-40134-large.mp4';
      setMediaType('video');
      setUploadedImages([]);
      setSelectedVideoUrl(simulatedUrl);
      onShowToast('Recording captured from emulator!');
      setCurrentStage('preview');
    }
  };

  const takePhoto = () => {
    if (cameraVideoRef.current && cameraStream) {
      try {
        const video = cameraVideoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 1136;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setMediaType('image');
          setUploadedImages([dataUrl]);
          setSelectedVideoUrl(dataUrl);
          // Convert dataurl to file
          fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
              setSelectedFile(new File([blob], 'captured_photo.jpg', { type: 'image/jpeg' }));
            });
          onShowToast('Photo captured!');
          setCurrentStage('preview');
        }
      } catch (err) {
        console.error('Canvas capture failed:', err);
        captureSimulatedPhoto();
      }
    } else {
      captureSimulatedPhoto();
    }
  };

  const captureSimulatedPhoto = () => {
    const fallbackPhotos = [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'
    ];
    const chosen = fallbackPhotos[Math.floor(Math.random() * fallbackPhotos.length)];
    setMediaType('image');
    setUploadedImages([chosen]);
    setSelectedVideoUrl(chosen);
    onShowToast('Captured photo from emulator!');
    setCurrentStage('preview');
  };

  const formatRecordTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Sync video and audio elements when playing/muted states change
  useEffect(() => {
    if (previewVideoRef.current && selectedVideoUrl && mediaType === 'video' && currentStage === 'preview') {
      if (previewPlaying) {
        previewVideoRef.current.play().catch(() => {});
      } else {
        previewVideoRef.current.pause();
      }
    }

    if (previewAudioRef.current && selectedAudioUrl && currentStage === 'preview') {
      previewAudioRef.current.muted = previewMuted;
      if (previewPlaying) {
        previewAudioRef.current.play().catch(() => {});
      } else {
        previewAudioRef.current.pause();
      }
    }
  }, [previewPlaying, selectedVideoUrl, selectedAudioUrl, previewMuted, mediaType, currentStage]);

  // Handle simulated upload progress with realistic details
  const handleSimulatedDrop = (videoUrl: string, file?: File, type: 'video' | 'image' | 'carousel' = 'video', images: string[] = []) => {
    setIsUploading(true);
    setUploadProgress(0);
    setSelectedVideoUrl(videoUrl);
    setSelectedFile(file || null);
    setMediaType(type);
    setUploadedImages(images);
    setPreviewPlaying(true);

    if (type === 'video') {
      generateVideoThumbnail(videoUrl, videoUrl).catch(() => {});
    }

    const speedOptions = ['14.2 MB/s', '18.5 MB/s', '12.9 MB/s', '21.0 MB/s'];
    const interval = setInterval(() => {
      setTransferSpeed(speedOptions[Math.floor(Math.random() * speedOptions.length)]);
      setUploadProgress((old) => {
        const nextValue = old + Math.floor(Math.random() * 15) + 10;
        if (nextValue >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            onShowToast('Media processed successfully! Redirecting to preview...');
            setCurrentStage('preview');
          }, 400);
          return 100;
        }
        return nextValue;
      });
    }, 100);
  };

  const handleManualSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);
      if (file.type.startsWith('video/')) {
        handleSimulatedDrop(objectUrl, file, 'video');
      } else if (file.type.startsWith('image/')) {
        handleSimulatedDrop(objectUrl, file, 'image', [objectUrl]);
      }
    } else {
      // Multiple files -> Carousel!
      const urls: string[] = [];
      const imageFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          urls.push(URL.createObjectURL(files[i]));
          imageFiles.push(files[i]);
        }
      }
      if (urls.length > 0) {
        handleSimulatedDrop(urls[0], imageFiles[0], 'carousel', urls);
      } else {
        onShowToast('Please select multiple images to create a carousel.');
      }
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (selectedAudioUrl) {
      URL.revokeObjectURL(selectedAudioUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setSelectedAudioUrl(objectUrl);
    setSelectedAudioName(file.name);
    onShowToast(`Sound added: ${file.name}`, 'success');
  };

  // Overlaid elements managers
  const handleAddText = () => {
    if (!currentText.trim()) return;
    if (isEditingTextId) {
      setTexts((prev) =>
        prev.map((t) =>
          t.id === isEditingTextId
            ? { ...t, text: currentText, color: currentTextColor, size: currentTextSize, bgStyle: currentTextBgStyle }
            : t
        )
      );
      setIsEditingTextId(null);
    } else {
      const newText = {
        id: `t-${Date.now()}`,
        text: currentText,
        x: 10 + Math.random() * 20, // slightly random offset so they don't stack perfectly
        y: 30 + Math.random() * 20,
        color: currentTextColor,
        size: currentTextSize,
        bgStyle: currentTextBgStyle,
      };
      setTexts((prev) => [...prev, newText]);
    }
    setCurrentText('');
    setIsTextPanelOpen(false);
  };

  const handleEditExistingText = (textItem: any) => {
    setIsEditingTextId(textItem.id);
    setCurrentText(textItem.text);
    setCurrentTextColor(textItem.color);
    setCurrentTextSize(textItem.size);
    setCurrentTextBgStyle(textItem.bgStyle);
    setIsTextPanelOpen(true);
  };

  const handleRemoveText = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTexts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddSticker = (emoji: string) => {
    const newSticker = {
      id: `s-${Date.now()}`,
      emoji,
      x: 30 + Math.random() * 30,
      y: 40 + Math.random() * 20,
      scale: 1,
    };
    setStickers((prev) => [...prev, newSticker]);
    setIsStickersPanelOpen(false);
    onShowToast(`Sticker added: ${emoji}`, 'success');
  };

  const handleRemoveSticker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  // Append hash or mention coordinates
  const appendText = (text: string) => {
    setCaption((prev) => {
      const spacing = prev.length === 0 || prev.endsWith(' ') ? '' : ' ';
      return `${prev}${spacing}${text}`;
    });
  };

  const handleAddHashtag = (tag: string) => {
    appendText(`#${tag}`);
    if (!tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideoUrl) {
      onShowToast('Please provide media content first.');
      return;
    }
    if (!caption.trim()) {
      onShowToast('Please provide a caption / title.');
      return;
    }

    const extractedTags = caption
      .split(/\s+/)
      .filter((word) => word.startsWith('#'))
      .map((word) => word.replace('#', '').trim())
      .filter((word) => word.length > 0);

    const finalTags = extractedTags.length > 0 ? extractedTags : (tags.length ? tags : ['nomis', 'creator']);

    onAddMockVideo({
      title: caption,
      description: aiGeneratedLabel ? 'AI-Generated Visual Art' : 'Original Creator Content',
      tags: finalTags,
      visibility,
      videoUrl: selectedVideoUrl,
      rawFile: selectedFile || undefined,
      mediaType: mediaType,
      images: mediaType === 'carousel' ? uploadedImages : (mediaType === 'image' ? uploadedImages : []),
      music: selectedAudioName !== 'Add sound' ? selectedAudioName : undefined,
      texts: texts,
      stickers: stickers
    });

    onShowToast('Post published successfully to feed!');
    
    // Reset state & navigate home
    setCaption('');
    setTags([]);
    setSelectedVideoUrl(null);
    setSelectedFile(null);
    setUploadedImages([]);
    setMediaType('video');
    setTexts([]);
    setStickers([]);
    if (selectedAudioUrl) {
      URL.revokeObjectURL(selectedAudioUrl);
    }
    setSelectedAudioUrl(null);
    setSelectedAudioName('Add sound');
    setCurrentStage('record');
    onNavigate('home');
  };

  const togglePreviewPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewPlaying(!previewPlaying);
  };

  const togglePreviewMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewMuted(!previewMuted);
  };

  const handleTimeUpdate = () => {
    if (previewVideoRef.current) {
      setPreviewCurrentTime(previewVideoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (previewVideoRef.current) {
      setPreviewDuration(previewVideoRef.current.duration);
    }
  };

  const handleDiscard = () => {
    setCaption('');
    setTags([]);
    setSelectedVideoUrl(null);
    setSelectedFile(null);
    setUploadedImages([]);
    setMediaType('video');
    if (selectedAudioUrl) {
      URL.revokeObjectURL(selectedAudioUrl);
    }
    setSelectedAudioUrl(null);
    setSelectedAudioName('Add sound');
    setCurrentStage('record');
  };

  return (
    <div className="w-full h-full bg-black flex flex-col text-left overflow-hidden relative select-none">
      
      {/* 1. Camera / Capture Full Page Stage */}
      {currentStage === 'record' && (
        <div className="absolute inset-0 w-full h-full bg-black flex flex-col justify-center items-center p-4 z-20 overflow-hidden">
          {/* Main 9:16 Camera Container */}
          <div className="relative w-full max-w-[360px] aspect-[9/16] rounded-[28px] overflow-hidden bg-neutral-900 border-[10px] border-zinc-900 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex flex-col justify-between p-4">
            <video
              ref={cameraVideoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover rounded-2xl ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* Emulated screen message when physical camera stream is offline */}
            {!cameraStream && isCameraSupported && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center z-10">
                <Camera className="w-10 h-10 text-white/40 mb-3 animate-pulse" />
                <p className="text-xs font-black text-white uppercase tracking-wider">Accessing Studio Camera</p>
                <p className="text-[10px] text-white/40 mt-1 max-w-xs">Approve device camera & microphone permission prompts.</p>
              </div>
            )}
            {!isCameraSupported && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center z-10">
                <Camera className="w-10 h-10 text-white/30 mb-3" />
                <p className="text-xs font-black text-white/70 uppercase">Camera Blocked or Unsupported</p>
                <p className="text-[10px] text-white/40 max-w-xs mt-1">We will emulate your creative device camera. Use the capture action to record a gorgeous preset stream instantly!</p>
              </div>
            )}

            {/* Top Row: Go back / Info */}
            <div className="relative z-10 flex items-center justify-between w-full">
              <button
                onClick={() => onNavigate('home')}
                className="p-2.5 rounded-full bg-black/55 hover:bg-black/85 text-white/90 border border-white/10 hover:scale-105 cursor-pointer transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-[9px] uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {isRecording ? 'LIVE REC' : 'STUDIO MODE'}
                </div>
                {isRecording && (
                  <span className="font-mono text-[10px] font-black text-white bg-black/60 border border-white/10 px-2 py-0.5 rounded-full">
                    {formatRecordTime(recordingSeconds)}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextMode = facingMode === 'user' ? 'environment' : 'user';
                  setFacingMode(nextMode);
                }}
                className="p-2.5 rounded-full bg-black/55 hover:bg-black/85 text-white/90 border border-white/10 hover:scale-105 cursor-pointer transition-all"
                title="Switch Camera (Front/Back)"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Actions Block */}
            <div className="relative z-10 w-full flex flex-col items-center mt-auto pb-2">
              {/* Photo Mode Indicator */}
              <div className="flex items-center justify-center mb-4 bg-black/50 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FE2C55]">
                  Photo Mode
                </span>
              </div>

              {/* Action HUD Row: Plus button, Record/Photo Button, Switch button */}
              <div className="w-full flex items-center justify-between px-2">
                {/* Bottom Left: Plus button to open device system */}
                <button
                  type="button"
                  onClick={handleManualSelect}
                  className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/15 hover:border-white/30 text-white flex items-center justify-center hover:scale-110 active:scale-95 cursor-pointer transition-all shadow-xl"
                  title="Select video/images from device"
                >
                  <Plus className="w-5.5 h-5.5 text-white" />
                </button>

                {/* Bottom Center: Record / Capture Button */}
                <button
                  type="button"
                  onClick={captureMode === 'video' ? (isRecording ? stopRecording : startRecording) : takePhoto}
                  className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 cursor-pointer
                    ${isRecording ? 'bg-red-500 animate-pulse border-red-400/40' : 'bg-white'}
                  `}
                >
                  <div className={`transition-all duration-300
                    ${isRecording ? 'w-5 h-5 bg-white rounded-md' : (captureMode === 'photo' ? 'w-9 h-9 rounded-full bg-white border border-black/10' : 'w-9 h-9 bg-transparent')}
                  `} />
                </button>

                {/* Thumbnail indicator placeholder */}
                <div className="w-11 h-11 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                    <ImageIcon className="w-4 h-4 text-white/35" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/*,image/*"
            multiple
            className="hidden"
          />

          {/* Upload progress overlays if files chosen */}
          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm z-30 p-6">
              <div className="w-full max-w-xs text-center space-y-5">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-red-500/25 animate-ping" />
                  <div className="relative w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-red-500 animate-spin" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-white uppercase tracking-widest">Processing Media Assets</p>
                  <p className="text-[10px] text-white/50">{transferSpeed}</p>
                </div>
                <div className="space-y-2">
                  <GlassProgressBar value={uploadProgress} />
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest block">{uploadProgress}% COMPLETE</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Full Screen Media Preview Stage */}
      {currentStage === 'preview' && (
        <div className="absolute inset-0 w-full h-full bg-black flex flex-col justify-between z-20 overflow-hidden pb-24 pt-20 px-4">
          
          {/* Media container with curved interior edges - Black frame container around it */}
          <div ref={mediaContainerRef} className="relative flex-1 w-full max-w-[360px] aspect-[9/16] mx-auto rounded-[32px] overflow-hidden bg-neutral-950 border-[12px] border-zinc-950 shadow-[0_24px_50px_rgba(0,0,0,0.9)] z-10 flex items-center justify-center">
            {mediaType === 'video' ? (
              <video
                ref={previewVideoRef}
                src={selectedVideoUrl!}
                className="w-full h-full object-cover rounded-[20px]"
                muted={previewMuted}
                loop
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePreviewPlay}
              />
            ) : mediaType === 'image' ? (
              <img
                src={selectedVideoUrl!}
                className="w-full h-full object-cover rounded-[20px]"
                alt="Captured template"
              />
            ) : (
              <div className="w-full h-full bg-neutral-950 flex items-center justify-center relative rounded-[20px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={carouselIndex}
                    src={uploadedImages[carouselIndex]}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="w-full h-full object-cover"
                    alt={`Carousel slide ${carouselIndex + 1}`}
                  />
                </AnimatePresence>

                {/* Left navigation arrow */}
                {uploadedImages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCarouselIndex((prev) => (prev > 0 ? prev - 1 : uploadedImages.length - 1));
                    }}
                    className="absolute left-4 p-3 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 text-white cursor-pointer active:scale-90 transition-all z-20"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Right navigation arrow */}
                {uploadedImages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCarouselIndex((prev) => (prev < uploadedImages.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-4 p-3 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 text-white cursor-pointer active:scale-90 transition-all z-20"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                {/* Indicators dots list */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                  {uploadedImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCarouselIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer
                        ${idx === carouselIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}
                      `}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Draggable and editable Overlaid Texts */}
            {texts.map((textItem) => (
              <motion.div
                key={textItem.id}
                drag
                dragConstraints={mediaContainerRef}
                dragElastic={0}
                dragMomentum={false}
                onDragStart={() => {
                  setDraggingItemId({ id: textItem.id, type: 'text' });
                }}
                onDrag={(event, info) => {
                  const isOver = isPointInDeleteZone(info.point);
                  setIsOverDeleteZone(isOver);
                }}
                onDragEnd={(event, info) => {
                  const isOver = isPointInDeleteZone(info.point);
                  if (isOver) {
                    setTexts((prev) => prev.filter((t) => t.id !== textItem.id));
                    onShowToast("Removed text overlay", "info");
                  } else if (mediaContainerRef.current) {
                    const rect = mediaContainerRef.current.getBoundingClientRect();
                    const nextX = Math.min(Math.max(((info.point.x - rect.left) / rect.width) * 100, 0), 80);
                    const nextY = Math.min(Math.max(((info.point.y - rect.top) / rect.height) * 100, 0), 90);
                    setTexts((prev) =>
                      prev.map((t) => (t.id === textItem.id ? { ...t, x: nextX, y: nextY } : t))
                    );
                  }
                  setDraggingItemId(null);
                  setIsOverDeleteZone(false);
                }}
                className="absolute z-30 px-3 py-1.5 rounded-xl cursor-grab active:cursor-grabbing font-bold text-center select-none group/text transition-shadow duration-200 active:scale-105"
                style={{
                  left: `${textItem.x}%`,
                  top: `${textItem.y}%`,
                  color: textItem.color,
                  fontSize: `${textItem.size}px`,
                  backgroundColor: textItem.bgStyle === 'solid' ? 'rgba(0, 0, 0, 0.7)' : textItem.bgStyle === 'frosted' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                  backdropFilter: textItem.bgStyle === 'frosted' ? 'blur(8px)' : 'none',
                  border: textItem.bgStyle === 'frosted' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                  textShadow: textItem.bgStyle === 'none' ? '0 2px 4px rgba(0,0,0,0.8)' : 'none',
                }}
              >
                <span onClick={() => handleEditExistingText(textItem)} className="hover:underline">{textItem.text}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveText(textItem.id, e)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold opacity-0 group-hover/text:opacity-100 transition-opacity cursor-pointer shadow"
                >
                  ×
                </button>
              </motion.div>
            ))}

            {/* Draggable Overlaid Stickers */}
            {stickers.map((stickerItem) => (
              <motion.div
                key={stickerItem.id}
                drag
                dragConstraints={mediaContainerRef}
                dragElastic={0}
                dragMomentum={false}
                onDragStart={() => {
                  setDraggingItemId({ id: stickerItem.id, type: 'sticker' });
                }}
                onDrag={(event, info) => {
                  const isOver = isPointInDeleteZone(info.point);
                  setIsOverDeleteZone(isOver);
                }}
                onDragEnd={(event, info) => {
                  const isOver = isPointInDeleteZone(info.point);
                  if (isOver) {
                    setStickers((prev) => prev.filter((s) => s.id !== stickerItem.id));
                    onShowToast("Removed sticker overlay", "info");
                  } else if (mediaContainerRef.current) {
                    const rect = mediaContainerRef.current.getBoundingClientRect();
                    const nextX = Math.min(Math.max(((info.point.x - rect.left) / rect.width) * 100, 0), 85);
                    const nextY = Math.min(Math.max(((info.point.y - rect.top) / rect.height) * 100, 0), 85);
                    setStickers((prev) =>
                      prev.map((s) => (s.id === stickerItem.id ? { ...s, x: nextX, y: nextY } : s))
                    );
                  }
                  setDraggingItemId(null);
                  setIsOverDeleteZone(false);
                }}
                className="absolute z-30 cursor-grab active:cursor-grabbing select-none group/sticker transition-transform duration-200 active:scale-110"
                style={{
                  left: `${stickerItem.x}%`,
                  top: `${stickerItem.y}%`,
                  fontSize: `${48 * stickerItem.scale}px`,
                }}
              >
                {stickerItem.emoji}
                <button
                  type="button"
                  onClick={(e) => handleRemoveSticker(stickerItem.id, e)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold opacity-0 group-hover/sticker:opacity-100 transition-opacity cursor-pointer shadow"
                >
                  ×
                </button>
              </motion.div>
            ))}

            {/* Beautiful glowing Red Corner Delete Drop Zone */}
            <AnimatePresence>
              {draggingItemId && (
                <motion.div
                  id="drag-delete-zone"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isOverDeleteZone ? 1.3 : 1,
                    backgroundColor: isOverDeleteZone ? 'rgba(239, 68, 68, 0.95)' : 'rgba(220, 38, 38, 0.85)',
                    boxShadow: isOverDeleteZone ? '0 0 25px rgba(239, 68, 68, 0.8)' : '0 4px 15px rgba(220, 38, 38, 0.5)'
                  }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="absolute bottom-4 right-4 z-40 text-white rounded-full p-4 flex items-center justify-center border border-red-400/30 transition-all duration-150"
                >
                  <Trash2 className="w-5 h-5 text-white animate-bounce" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Top Bar Overlay - Matching TikTok preview image */}
          <div className="absolute top-5 left-5 right-5 z-30 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setCurrentStage('record');
                setPreviewPlaying(false);
              }}
              className="p-2.5 rounded-full bg-black/45 backdrop-blur-md text-white border border-white/10 hover:scale-105 active:scale-95 cursor-pointer transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Music track pill centered - Keep as "Add sound" */}
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-black/45 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-xs font-semibold text-white hover:bg-black/65 transition-all cursor-pointer max-w-[150px]"
              title="Add sound from your device"
            >
              <Music className="w-3.5 h-3.5 text-white mr-1 flex-shrink-0 animate-pulse" />
              <span className="truncate max-w-[100px]">{selectedAudioName}</span>
            </button>

            {/* Right Action Switch to toggle side bar dynamically */}
            <button
              type="button"
              onClick={() => setShowSidePanel(!showSidePanel)}
              className={`p-2.5 rounded-full backdrop-blur-md text-white border transition-all hover:scale-105 active:scale-95 cursor-pointer
                ${showSidePanel ? 'bg-[#FE2C55] border-[#FE2C55] shadow-[0_0_12px_rgba(254,44,85,0.4)]' : 'bg-black/45 border-white/10'}
              `}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive controls overlays in right edge toolbar - dynamically falling down */}
          <AnimatePresence>
            {showSidePanel && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: { opacity: 0, y: -20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.02
                    }
                  }
                }}
                className="absolute right-5 top-[80px] z-30 flex flex-col items-center gap-4 bg-black/30 p-2.5 rounded-2xl border border-white/5 backdrop-blur-md"
              >
                {[
                  { icon: <Music className="w-5 h-5" />, label: 'Sound', onClick: () => {
                    setIsSoundPanelOpen(true);
                    setIsTextPanelOpen(false);
                    setIsStickersPanelOpen(false);
                  }},
                  { icon: <span className="font-sans font-bold text-base leading-none">Aa</span>, label: 'Text', onClick: () => {
                    setIsTextPanelOpen(true);
                    setIsSoundPanelOpen(false);
                    setIsStickersPanelOpen(false);
                    setIsEditingTextId(null);
                    setCurrentText('');
                  }},
                  { icon: <Smile className="w-5 h-5" />, label: 'Stickers', onClick: () => {
                    setIsStickersPanelOpen(true);
                    setIsSoundPanelOpen(false);
                    setIsTextPanelOpen(false);
                  }},
                  { icon: <Volume2 className="w-5 h-5" />, label: 'Volume', onClick: togglePreviewMute },
                  { icon: <SlidersHorizontal className="w-5 h-5" />, label: 'Adjust' },
                  { icon: <ChevronDown className="w-5 h-5" />, label: 'More' }
                ].map((btn, idx) => (
                  <motion.button
                    key={idx}
                    variants={{
                      hidden: { opacity: 0, scale: 0.8, y: -15 },
                      visible: { opacity: 1, scale: 1, y: 0 }
                    }}
                    type="button"
                    onClick={btn.onClick}
                    className="flex flex-col items-center justify-center text-white group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-black/60 group-hover:scale-105 transition-all shadow-md">
                      {btn.icon}
                    </div>
                    <span className="text-[10px] font-semibold text-white/90 mt-1 drop-shadow-md">{btn.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Very Bottom Center Next Button - completely outside the curved media container on the black frame */}
          <div className="absolute bottom-5 left-4 right-4 z-30 flex justify-center">
            <button
              type="button"
              onClick={() => setCurrentStage('configure')}
              className="w-full max-w-sm bg-[#FE2C55] text-white font-extrabold rounded-full py-4 px-8 flex items-center justify-center gap-1 hover:brightness-110 cursor-pointer active:scale-95 transition-all shadow-xl text-sm"
            >
              <span>Next</span>
            </button>
          </div>

          {/* Hidden inputs & dynamic preview player for device audio integration */}
          <input
            type="file"
            ref={audioInputRef}
            onChange={handleAudioSelect}
            accept="audio/*"
            className="hidden"
          />
          {selectedAudioUrl && (
            <audio
              ref={previewAudioRef}
              src={selectedAudioUrl}
              loop
              muted={previewMuted}
            />
          )}

          {/* A. Sound Editing Section Panel */}
          <AnimatePresence>
            {isSoundPanelOpen && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="absolute inset-x-0 bottom-0 z-50 bg-zinc-950/95 border-t border-white/10 rounded-t-[32px] p-6 pb-10 shadow-[0_-15px_30px_rgba(0,0,0,0.8)] text-left"
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Sound Engineering</h3>
                  <button
                    type="button"
                    onClick={() => setIsSoundPanelOpen(false)}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Music selection row */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] flex items-center justify-center border border-white/10">
                        <Music className="w-5 h-5 text-white" />
                      </div>
                      <div className="max-w-[180px]">
                        <p className="text-xs font-bold text-white uppercase tracking-wider truncate">Selected Track</p>
                        <p className="text-[11px] text-white/60 truncate mt-0.5">{selectedAudioName}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="bg-white/10 hover:bg-white/15 border border-white/10 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                    >
                      Choose Sound
                    </button>
                  </div>

                  {/* Volume mixers */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-white/70 uppercase">
                        <span>Original Soundtrack (Video)</span>
                        <span>{videoVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={videoVolume}
                        onChange={(e) => setVideoVolume(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FE2C55]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-white/70 uppercase">
                        <span>Added Device Audio</span>
                        <span>{musicVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={musicVolume}
                        onChange={(e) => setMusicVolume(Number(e.target.value))}
                        disabled={!selectedAudioUrl}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FE2C55] disabled:opacity-40"
                      />
                      {!selectedAudioUrl && (
                        <p className="text-[9px] font-medium text-white/40">Select a sound file to enable added music controls.</p>
                      )}
                    </div>
                  </div>

                  {/* Done button */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => setIsSoundPanelOpen(false)}
                      className="w-full bg-[#FE2C55] text-white font-extrabold uppercase text-xs tracking-widest rounded-xl py-3 hover:brightness-110 cursor-pointer active:scale-95 transition-all"
                    >
                      Done Editing Sound
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* B. Add Text Overlay Panel */}
          <AnimatePresence>
            {isTextPanelOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-center p-6 text-left"
              >
                <div className="w-full max-w-sm mx-auto space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {isEditingTextId ? 'Edit Annotation' : 'Add Text'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTextPanelOpen(false);
                        setIsEditingTextId(null);
                        setCurrentText('');
                      }}
                      className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Live typing input container with selected style */}
                  <div className="flex justify-center py-4">
                    <textarea
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      placeholder="Enter overlay text..."
                      maxLength={60}
                      className="w-full bg-transparent border-0 text-center font-black focus:outline-none focus:ring-0 placeholder-white/30 resize-none text-xl"
                      style={{
                        color: currentTextColor,
                        backgroundColor: currentTextBgStyle === 'solid' ? 'rgba(0, 0, 0, 0.7)' : currentTextBgStyle === 'frosted' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                        borderRadius: '16px',
                        padding: '16px',
                        backdropFilter: currentTextBgStyle === 'frosted' ? 'blur(8px)' : 'none',
                        border: currentTextBgStyle === 'frosted' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                        textShadow: currentTextBgStyle === 'none' ? '0 2px 4px rgba(0,0,0,0.8)' : 'none',
                      }}
                      rows={2}
                      autoFocus
                    />
                  </div>

                  {/* Adjustments options */}
                  <div className="space-y-4">
                    {/* Text Size Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-white/60 uppercase">
                        <span>Font Size</span>
                        <span>{currentTextSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="32"
                        value={currentTextSize}
                        onChange={(e) => setCurrentTextSize(Number(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FE2C55]"
                      />
                    </div>

                    {/* Color selections */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">Select Color</span>
                      <div className="flex gap-2.5">
                        {['#ffffff', '#ffcc00', '#ff3b30', '#30d158', '#0a84ff', '#bf5af2', '#000000'].map((color) => (
                          <button
                            type="button"
                            key={color}
                            onClick={() => setCurrentTextColor(color)}
                            className={`w-6 h-6 rounded-full border transition-transform
                              ${currentTextColor === color ? 'scale-125 border-white ring-2 ring-[#FE2C55]/50' : 'border-white/15 hover:scale-110'}
                            `}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Style selector */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">Background Style</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'none', label: 'None' },
                          { id: 'solid', label: 'Solid Card' },
                          { id: 'frosted', label: 'Frosted' }
                        ].map((style) => (
                          <button
                            type="button"
                            key={style.id}
                            onClick={() => setCurrentTextBgStyle(style.id as any)}
                            className={`text-[10px] font-black uppercase tracking-wider py-2 border rounded-xl transition-all
                              ${currentTextBgStyle === style.id ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/15 hover:bg-white/5'}
                            `}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Add action */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAddText}
                      disabled={!currentText.trim()}
                      className="w-full bg-[#FE2C55] text-white font-extrabold uppercase text-xs tracking-widest rounded-xl py-3.5 hover:brightness-110 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isEditingTextId ? 'Save Annotation' : 'Add Annotation to Canvas'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* C. Stickers Selector Overlay Panel */}
          <AnimatePresence>
            {isStickersPanelOpen && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="absolute inset-x-0 bottom-0 z-50 bg-zinc-950/95 border-t border-white/10 rounded-t-[32px] p-6 pb-10 shadow-[0_-15px_30px_rgba(0,0,0,0.8)] text-left"
              >
                <div className="flex justify-between items-center mb-5">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Canvas Stickers</h3>
                    <p className="text-[10px] text-white/50 uppercase font-mono">Select an emoji sticker to drag and drop</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStickersPanelOpen(false)}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Stickers Grid */}
                <div className="grid grid-cols-6 gap-4 max-h-[220px] overflow-y-auto custom-scrollbar p-2">
                  {[
                    '🔥', '😂', '❤️', '👑', '🚀', '✨', '💯', '👾', '🎉', '🎬', '👀', '⚡',
                    '🍟', '🍕', '🎧', '🌟', '🌈', '👾', '🤖', '🛸', '🦄', '🍭', '🎈', '🧸',
                    '💎', '💩', '😎', '💀', '😱', '🥳', '👻', '🍻', '🍿', '🎸', '🎮', '💡'
                  ].map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => handleAddSticker(emoji)}
                      className="aspect-square flex items-center justify-center text-4xl hover:scale-125 transition-transform cursor-pointer active:scale-95 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* 3. Publication & Configurations Full Page Stage - MATCHING IMAGE 1 */}
      {currentStage === 'configure' && (
        <div className="absolute inset-0 w-full h-full bg-[#050505] overflow-y-auto custom-scrollbar flex flex-col z-20 text-white">
          
          {/* Minimal pristine Header */}
          <div className="flex-shrink-0 px-4 py-4 flex items-center bg-transparent sticky top-0 z-10">
            <button
              type="button"
              onClick={() => setCurrentStage('preview')}
              className="p-1 text-white hover:opacity-70 transition-opacity cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center w-10 h-10"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Form Content Wrapper */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedVideoUrl) return;
              const finalCaption = caption.trim() || 'Visual Inspiration';
              const extractedTags = finalCaption
                .split(/\s+/)
                .filter((word) => word.startsWith('#'))
                .map((word) => word.replace('#', '').trim())
                .filter((word) => word.length > 0);
              const finalTags = extractedTags.length > 0 ? extractedTags : ['nomis'];

              onAddMockVideo({
                title: finalCaption,
                description: aiGeneratedLabel ? 'AI-Generated Visual Art' : 'Original Creator Content',
                tags: finalTags,
                visibility,
                videoUrl: selectedVideoUrl,
                rawFile: selectedFile || undefined,
                mediaType: mediaType,
                images: mediaType === 'carousel' ? uploadedImages : (mediaType === 'image' ? uploadedImages : []),
                texts: texts,
                stickers: stickers
              });

              // Clear state and return home
              setCaption('');
              setTags([]);
              setSelectedVideoUrl(null);
              setSelectedFile(null);
              setUploadedImages([]);
              setMediaType('video');
              setTexts([]);
              setStickers([]);
              setCurrentStage('record');
              onNavigate('home');
            }} 
            className="flex-1 px-5 flex flex-col"
          >
            {/* Description area & Thumbnail card inline */}
            <div className="flex gap-4 items-start border-b border-white/5 pb-6">
              <div className="flex-1 relative">
                <textarea
                  placeholder="Add description..."
                  value={caption}
                  onChange={(e) => handleCaptionChange(e.target.value)}
                  maxLength={2200}
                  className="w-full bg-transparent border-none text-base text-white placeholder-white/30 focus:outline-none resize-none min-h-[140px] leading-relaxed"
                />

                {showMentionDropdown && (
                  <div className="absolute left-0 right-0 mt-1 bg-zinc-950 border border-white/10 rounded-2xl p-2.5 shadow-2xl z-40 max-h-[180px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-white/40 uppercase px-2 mb-1.5 tracking-wider">Suggested Creators</p>
                    {allCreators
                      .filter((creator) => {
                        if (!mentionSearchQuery) return true;
                        return (
                          creator.username.toLowerCase().includes(mentionSearchQuery.toLowerCase()) ||
                          creator.name.toLowerCase().includes(mentionSearchQuery.toLowerCase())
                        );
                      })
                      .map((creator) => (
                        <button
                          type="button"
                          key={creator.username}
                          onClick={() => selectMention(creator.username)}
                          className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl text-left transition-colors cursor-pointer w-full"
                        >
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-7 h-7 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <p className="text-xs font-bold text-white">@{creator.username}</p>
                            <p className="text-[10px] text-white/50">{creator.name}</p>
                          </div>
                        </button>
                      ))}
                    {allCreators.filter((creator) => {
                      if (!mentionSearchQuery) return true;
                      return (
                        creator.username.toLowerCase().includes(mentionSearchQuery.toLowerCase()) ||
                        creator.name.toLowerCase().includes(mentionSearchQuery.toLowerCase())
                      );
                    }).length === 0 && (
                      <p className="text-[11px] text-white/40 px-2 py-1.5 font-mono">No matching creators found.</p>
                    )}
                  </div>
                )}
              </div>

              {/* High Fidelity Interactive Thumbnail Card on Right */}
              <div className="w-[110px] h-[160px] rounded-xl overflow-hidden relative border border-white/10 bg-white/5 flex-shrink-0 shadow-lg">
                {mediaType === 'video' ? (
                  <video src={selectedVideoUrl!} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={selectedVideoUrl!} className="w-full h-full object-cover" alt="Thumbnail" />
                )}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[10px] font-bold text-white px-2 py-0.5 rounded-md border border-white/5">
                  Preview
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm py-2 text-center text-[10px] font-bold text-white select-none border-t border-white/5">
                  Edit cover
                </div>
              </div>
            </div>

            {/* Hashtags and Mention interactive pills */}
            <div className="flex gap-2.5 pt-4 pb-6">
              <button
                type="button"
                onClick={() => appendText('#')}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className="font-bold text-white/50 text-base">#</span> Hashtags
              </button>
              <button
                type="button"
                onClick={() => setShowMentionSelector(!showMentionSelector)}
                className={`px-4 py-2 hover:bg-white/10 text-white border text-sm font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all
                  ${showMentionSelector ? 'bg-white/15 border-white/30 shadow-md text-[#FE2C55]' : 'bg-white/5 border-white/10'}
                `}
              >
                <span className="font-bold text-white/50 text-base">@</span> Mention
              </button>
            </div>

            {/* Mention Selector Popover */}
            <AnimatePresence>
              {showMentionSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-zinc-950 border border-white/15 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_10px_35px_rgba(0,0,0,0.8)] mb-6 max-h-[320px] overflow-hidden"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                      <AtSign className="w-3.5 h-3.5 text-[#FE2C55]" /> MENTION CREATOR
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowMentionSelector(false)}
                      className="text-white/40 hover:text-white px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider"
                    >
                      Close
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Search creators by name or @username..."
                    value={mentionSearch}
                    onChange={(e) => setMentionSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FE2C55]/50 transition-all font-medium"
                    autoFocus
                  />
                  
                  <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1 max-h-[200px]">
                    {allCreators
                      .filter(c => 
                        c.name.toLowerCase().includes(mentionSearch.toLowerCase()) || 
                        c.username.toLowerCase().includes(mentionSearch.toLowerCase())
                      )
                      .map(creator => (
                        <div
                          key={creator.id}
                          onClick={() => {
                            setCaption(prev => {
                              const spacing = prev.length === 0 || prev.endsWith(' ') ? '' : ' ';
                              return `${prev}${spacing}@${creator.username} `;
                            });
                            setShowMentionSelector(false);
                            setMentionSearch('');
                            onShowToast(`Mentioned @${creator.username}`);
                          }}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.06] cursor-pointer transition-all border border-transparent hover:border-white/5 group"
                        >
                          <img src={creator.avatar} className="w-7 h-7 rounded-full object-cover border border-white/10" alt="" />
                          <div className="flex flex-col text-left flex-1 min-w-0">
                            <span className="text-xs font-bold text-white truncate">{creator.name}</span>
                            <span className="text-[10px] text-white/40 truncate">@{creator.username}</span>
                          </div>
                          <span className="text-[9px] font-bold text-[#FE2C55] opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                            Select
                          </span>
                        </div>
                      ))}
                    {allCreators.filter(c => 
                      c.name.toLowerCase().includes(mentionSearch.toLowerCase()) || 
                      c.username.toLowerCase().includes(mentionSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="text-center py-6 text-xs text-white/30 font-medium">
                        No creators found. Type to search!
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Divider */}
            <div className="h-[1px] bg-white/5 -mx-5" />

            {/* Settings Rows */}
            <div className="flex-1 flex flex-col">
              
              {/* Row 1: Location selection */}
              <div className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-white/85" />
                    <span className="text-base font-bold text-white">Location</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/30" />
                </div>
                
                {/* Scrollable Location presets */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
                  {[
                    'Lafia', 
                    'Federal University of Lafia', 
                    'GRA Lafia', 
                    'Lafia Beri-Beri'
                  ].map((loc) => {
                    const isSelected = selectedLocation === loc;
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setSelectedLocation(isSelected ? '' : loc)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all border cursor-pointer
                          ${isSelected 
                            ? 'bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] text-white border-transparent shadow-[0_4px_12px_rgba(255,59,48,0.3)] font-semibold' 
                            : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                          }
                        `}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Visibility settings */}
              <div className="h-[1px] bg-white/5 -mx-5" />
              <div 
                onClick={() => setShowVisibilitySelector(true)}
                className="py-5 flex items-center justify-between cursor-pointer hover:bg-white/5 -mx-5 px-5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-white/85" />
                  <span className="text-base font-bold text-white">
                    {visibility === 'Public' ? 'Everyone can view this post' : visibility === 'Friends' ? 'Friends can view this post' : 'Only you can view this post'}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
              </div>

              {/* Row 3: More options modal trigger */}
              <div className="h-[1px] bg-white/5 -mx-5" />
              <div 
                onClick={() => setShowMoreOptionsModal(true)}
                className="py-5 flex items-center justify-between cursor-pointer hover:bg-white/5 -mx-5 px-5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-5 h-5 text-white/85" />
                  <span className="text-base font-bold text-white">More options</span>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
              </div>

              {/* Row 4: Share to */}
              <div className="h-[1px] bg-white/5 -mx-5" />
              <div 
                className="py-5 flex items-center justify-between cursor-pointer hover:bg-white/5 -mx-5 px-5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5 text-white/85" />
                  <span className="text-base font-bold text-white">Share to</span>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
              </div>
              <div className="h-[1px] bg-white/5 -mx-5" />

            </div>

            {/* Bottom Actions Block - Post Only */}
            <div className="mt-auto pt-8 pb-6 bg-transparent sticky bottom-0 z-10 border-t border-white/5">
              <button
                type="submit"
                className="w-full bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] text-white font-black text-sm uppercase tracking-wider rounded-full py-4 px-8 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-[#FF3B30]/20 hover:brightness-110"
              >
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                <span>Post</span>
              </button>
            </div>

          </form>

          {/* Visibility Bottom Sheet Selector Overlay */}
          <AnimatePresence>
            {showVisibilitySelector && (
              <div className="fixed inset-0 bg-black/75 z-50 flex flex-col justify-end">
                {/* Backdrop closer */}
                <div className="absolute inset-0" onClick={() => setShowVisibilitySelector(false)} />
                
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="relative bg-zinc-950 border-t border-white/10 rounded-t-3xl p-6 text-white z-10 space-y-5 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase tracking-wide text-white">Who can watch this</h3>
                    <button 
                      onClick={() => setShowVisibilitySelector(false)} 
                      className="p-1 text-white/45 hover:text-white cursor-pointer bg-white/5 rounded-full"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-2 pb-6">
                    {[
                      { val: 'Public', desc: 'Everyone', icon: <Globe className="w-5 h-5 text-white/85" /> },
                      { val: 'Friends', desc: 'Friends Only', icon: <Users className="w-5 h-5 text-white/85" /> },
                      { val: 'Private', desc: 'Only Me', icon: <Lock className="w-5 h-5 text-white/85" /> }
                    ].map((opt) => {
                      const isSel = visibility === opt.val;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => {
                            setVisibility(opt.val);
                            setShowVisibilitySelector(false);
                          }}
                          className={`w-full p-4 rounded-xl flex items-center justify-between border transition-all cursor-pointer
                            ${isSel 
                              ? 'bg-white/10 border-white/30 text-white font-extrabold shadow-md' 
                              : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/70'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            {opt.icon}
                            <span className="text-sm font-bold">{opt.desc}</span>
                          </div>
                          {isSel && <Check className="w-5 h-5 text-white stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* More Options Settings Sheet Overlay */}
          <AnimatePresence>
            {showMoreOptionsModal && (
              <div className="fixed inset-0 bg-black/75 z-50 flex flex-col justify-end">
                {/* Backdrop closer */}
                <div className="absolute inset-0" onClick={() => setShowMoreOptionsModal(false)} />
                
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="relative bg-zinc-950 border-t border-white/10 rounded-t-3xl p-6 text-white z-10 space-y-5 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase tracking-wide text-white">More Options</h3>
                    <button 
                      onClick={() => setShowMoreOptionsModal(false)} 
                      className="p-1 text-white/45 hover:text-white cursor-pointer bg-white/5 rounded-full"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Switch toggles styled beautifully */}
                  <div className="space-y-4 pb-6 overflow-y-auto max-h-[70vh]">
                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-white">Allow Comments</p>
                        <p className="text-xs text-white/45">Enable viewers to reply and share opinions.</p>
                      </div>
                      <GlassSwitch checked={allowComments} onChange={setAllowComments} />
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-white">Allow Duet</p>
                        <p className="text-xs text-white/45">Allow users to record split-screen video with yours.</p>
                      </div>
                      <GlassSwitch checked={allowDuet} onChange={setAllowDuet} />
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-white">Allow Stitch</p>
                        <p className="text-xs text-white/45">Allow other creators to use clips of this post.</p>
                      </div>
                      <GlassSwitch checked={allowStitch} onChange={setAllowStitch} />
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-white">AI-generated content</p>
                        <p className="text-xs text-white/45">Label your visual creations accurately.</p>
                      </div>
                      <GlassSwitch checked={aiGeneratedLabel} onChange={setAiGeneratedLabel} />
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-white">High-Quality Uploads</p>
                        <p className="text-xs text-white/45">Always preserve full resolution and frame rate.</p>
                      </div>
                      <GlassSwitch checked={highQualityUpload} onChange={setHighQualityUpload} />
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-white">Schedule Post</p>
                          <p className="text-xs text-white/45">Publish your video at a specific future time.</p>
                        </div>
                        <GlassSwitch checked={isScheduled} onChange={setIsScheduled} />
                      </div>

                      {isScheduled && (
                        <div className="pt-2 border-t border-white/5">
                          <input
                            type="datetime-local"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMoreOptionsModal(false)}
                    className="w-full py-4 bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] text-white text-xs font-black uppercase tracking-widest rounded-full cursor-pointer hover:opacity-90 shadow-lg shadow-[#FF3B30]/20"
                  >
                    Save & Close
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

    </div>
  );
};
