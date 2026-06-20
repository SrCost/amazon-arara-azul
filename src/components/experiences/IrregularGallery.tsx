import { Search } from "lucide-react";
import { useInViewAnimation } from "@/hooks/useInViewAnimation";

interface Image {
  src: string;
  alt: string;
}

interface IrregularGalleryProps {
  images: Image[];
  onOpen: (index: number) => void;
}

const GalleryTile = ({
  image,
  index,
  span,
  onClick,
}: {
  image: Image;
  index: number;
  span: boolean;
  onClick: () => void;
}) => {
  const { ref, inView } = useInViewAnimation<HTMLDivElement>();
  return (
    <div
      ref={ref}
      onClick={onClick}
      style={{
        animationDelay: inView ? `${(index % 12) * 60}ms` : undefined,
        opacity: inView ? undefined : 0,
      }}
      className={`relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group ${
        span ? "sm:col-span-2 row-span-1" : ""
      } ${inView ? "animate-fade-in-up" : ""}`}
      data-span={span}
    >
      <img
        src={image.src}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-colors duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/95 rounded-full p-3 shadow-strong">
          <Search className="h-5 w-5 text-foreground" />
        </div>
      </div>
    </div>
  );
};

const IrregularGallery = ({ images, onOpen }: IrregularGalleryProps) => {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[180px] sm:auto-rows-[200px]"
    >
      {images.map((image, index) => {
        // Rhythm: every 5th item spans 2 columns
        const span = index % 5 === 0;
        return (
          <GalleryTile
            key={index}
            image={image}
            index={index}
            span={span}
            onClick={() => onOpen(index)}
          />
        );
      })}
    </div>
  );
};

export default IrregularGallery;
