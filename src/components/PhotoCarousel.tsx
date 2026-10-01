const ROW_CONFIG: { direction: "left" | "right"; duration: number }[] = [
  { direction: "left", duration: 50 },
  { direction: "right", duration: 58 },
  { direction: "left", duration: 44 },
];

const MIN_TILES_ON_SCREEN = 7;

function distributeIntoRows(photos: string[], rowCount: number): string[][] {
  const rows: string[][] = Array.from({ length: rowCount }, () => []);
  photos.forEach((photo, i) => rows[i % rowCount].push(photo));
  return rows.filter((row) => row.length > 0);
}

function CarouselRow({
  photos,
  direction,
  duration,
}: {
  photos: string[];
  direction: "left" | "right";
  duration: number;
}) {
  // Repeat the row's photos until there are enough tiles to cover the
  // screen, then duplicate once more so the marquee loops seamlessly at
  // translateX(-50%) regardless of how many photos exist.
  const repeatCount = Math.max(1, Math.ceil(MIN_TILES_ON_SCREEN / photos.length));
  const filled = Array.from({ length: repeatCount }, () => photos).flat();
  const looped = [...filled, ...filled];

  return (
    <div
      className={`flex w-max gap-8 ${
        direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
      }`}
      style={{ animationDuration: `${duration}s` }}
    >
      {looped.map((src, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={idx}
          src={src}
          alt=""
          className="h-40 w-40 shrink-0 rounded-2xl object-cover sm:h-56 sm:w-56 md:h-64 md:w-64"
        />
      ))}
    </div>
  );
}

export default function PhotoCarousel({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;

  const rows = distributeIntoRows(photos, ROW_CONFIG.length);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex -rotate-2 scale-110 flex-col justify-around gap-8 overflow-hidden opacity-20 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
    >
      {rows.map((rowPhotos, i) => (
        <CarouselRow key={i} photos={rowPhotos} {...ROW_CONFIG[i % ROW_CONFIG.length]} />
      ))}
    </div>
  );
}
