/* Static design constants for TodoMate.
   Users and cards now live in Supabase — see db.js. */

export const POSTIT_COLORS = [
  { id: "pink",   bg: "#FFE0E6", ink: "#3D1620" },
  { id: "yellow", bg: "#FFF3C2", ink: "#3D2F08" },
  { id: "lemon",  bg: "#E6F4B5", ink: "#28330A" },
  { id: "blue",   bg: "#D4E7FF", ink: "#0E2748" },
  { id: "lilac",  bg: "#E4DBFF", ink: "#241750" },
  { id: "mint",   bg: "#CDF1D8", ink: "#0E331C" },
  { id: "peach",  bg: "#FFE4CC", ink: "#3A1F08" },
];

export const COLUMNS = [
  { id: "todo",  title: "할일",   icon: "todo",  iconGlyph: "square" },
  { id: "doing", title: "진행중", icon: "doing", iconGlyph: "square" },
  { id: "done",  title: "완료",   icon: "done",  iconGlyph: "check"  },
];

// Avatar colors assigned to newly created users (round-robin / random).
export const AVATAR_COLORS = [
  "#F472B6", "#60A5FA", "#FB923C", "#34D399", "#0066FF",
  "#A78BFA", "#F87171", "#FBBF24", "#2DD4BF", "#FB7185",
];

// Time formatter
export function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "방금 전";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}분 전`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}시간 전`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 7) return `${days}일 전`;
  return new Date(ts).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
