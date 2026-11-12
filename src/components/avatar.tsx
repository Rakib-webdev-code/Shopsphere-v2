/* eslint-disable @next/next/no-img-element -- avatars are protected,
   user-specific responses; next/image optimisation would not help here. */
type UserAvatarProps = {
  name: string;
  image: string | null;
  className?: string;
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/**
 * Round avatar with an initials fallback. `className` controls the size
 * (for example `h-10 w-10 text-sm`).
 */
export function UserAvatar({
  name,
  image,
  className = "h-10 w-10 text-sm",
}: UserAvatarProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft font-semibold text-accent ring-1 ring-accent-border ${className}`}
    >
      {image ? (
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
    </span>
  );
}
