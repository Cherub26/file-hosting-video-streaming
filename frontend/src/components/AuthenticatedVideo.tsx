import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';

interface AuthenticatedVideoProps {
  src: string;
  className?: string;
  controls?: boolean;
  fallback?: React.ReactNode;
}

export default function AuthenticatedVideo({ src, className, controls = true, fallback }: AuthenticatedVideoProps) {
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchVideo() {
      if (!user?.token) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(src, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        if (isMounted) {
          setVideoUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch video:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchVideo();

    return () => {
      isMounted = false;
      // Clean up blob URL when component unmounts
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [src, user?.token]);

  // Clean up blob URL when videoUrl changes
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  if (loading) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return fallback || (
      <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-white text-center">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-xl">Video not available for playback</p>
        </div>
      </div>
    );
  }

  return (
    <video 
      ref={videoRef}
      controls={controls}
      className={className}
      src={videoUrl}
    >
      Your browser does not support the video tag.
    </video>
  );
} 