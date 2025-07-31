import React, { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function AuthenticatedImage({ src, alt, className, fallback }: AuthenticatedImageProps) {
  const { user } = useAuth();
  const [imageData, setImageData] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchImage() {
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
        const reader = new FileReader();
        
        reader.onload = () => {
          if (isMounted) {
            setImageData(reader.result as string);
            setLoading(false);
          }
        };
        
        reader.onerror = () => {
          if (isMounted) {
            setError(true);
            setLoading(false);
          }
        };
        
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Failed to fetch image:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [src, user?.token]);

  if (loading) {
    return (
      <div className={`bg-gray-200 animate-pulse ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !imageData) {
    return fallback || (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-gray-400">Image not available</div>
      </div>
    );
  }

  return (
    <img 
      src={imageData} 
      alt={alt} 
      className={className}
    />
  );
} 