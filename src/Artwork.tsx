export function Star({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M50 0l8 31L85 15 69 42l31 8-31 8 16 27-27-16-8 31-8-31-27 16 16-27L0 50l31-8-16-27 27 16z" />
    </svg>
  );
}
export function Artwork({ variant }: { variant?: string }) {
  const source =
    variant === "orbit"
      ? "/images/concrete.svg"
      : variant === "form"
        ? "/images/platform.svg"
        : "/images/void.svg";
  return (
    <div className="project-art" aria-hidden="true">
      <img src={source} alt="" loading="lazy" />
    </div>
  );
}
