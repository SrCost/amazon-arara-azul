import { useEffect, useRef, useState } from 'react';

interface HeroVideoProps {
  desktopSrc?: string;
  mobileSrc?: string;
  fallbackImage?: string;
  children?: React.ReactNode;
}

const HeroVideo = ({ 
  desktopSrc = '/media/home-hero-video.mp4',
  mobileSrc = '/media/home-hero-video-mobile.mp4',
  fallbackImage = '/hero-amazon.jpg',
  children 
}: HeroVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;

    const playVideo = async () => {
      try {
        await video.play();
      } catch (error) {
        console.log('Autoplay prevented, video will play on user interaction');
      }
    };

    playVideo();
  }, [hasError, isMobile]);

  const handleError = () => {
    console.warn('Video failed to load, using fallback image');
    setHasError(true);
  };

  const videoSrc = isMobile ? mobileSrc : desktopSrc;

  return (
    <div className="relative w-full h-[600px] md:h-[700px] overflow-hidden">
      {!hasError ? (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={handleError}
            poster={fallbackImage}
          >
            <source src={videoSrc} type="video/mp4" />
            <source src={videoSrc.replace('.mp4', '.webm')} type="video/webm" />
          </video>
          
          {/* Overlay escuro sutil para melhorar legibilidade do texto */}
          <div className="absolute inset-0 bg-black/15" />
        </>
      ) : (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      )}

      {/* Conteúdo sobreposto */}
      <div className="absolute inset-0 z-10">
        {children}
      </div>
    </div>
  );
};

export default HeroVideo;
