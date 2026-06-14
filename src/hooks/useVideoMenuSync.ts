import { useEffect, useState, type CSSProperties, type RefObject } from "react";

/**
 * Sincroniza o fundo dos itens do menu com o progresso do vídeo.
 * - 0 a 33%:   rgba(255,255,255,0.05)
 * - 33 a 66%:  rgba(255,255,255,0.15)
 * - 66 a 100%: rgba(255,255,255,0.25)
 * Sem efeitos colaterais quando o vídeo não existe ou está pausado.
 */
export function useVideoMenuSync(
  videoRef: RefObject<HTMLVideoElement | null>
): CSSProperties {
  const [opacity, setOpacity] = useState(0.05);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.paused || !video.duration || Number.isNaN(video.duration)) return;
      const progress = video.currentTime / video.duration;
      if (progress < 0.33) setOpacity(0.05);
      else if (progress < 0.66) setOpacity(0.15);
      else setOpacity(0.25);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleTimeUpdate);
    };
  }, [videoRef]);

  return {
    background: `rgba(255, 255, 255, ${opacity})`,
    transition: "background 0.6s ease",
  };
}
