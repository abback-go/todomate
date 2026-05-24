/* Avatar — colored initial bubble */

export const Avatar = ({ user, size = "sm", title }) => {
  if (!user) return null;
  const cls = size === "lg" ? "avatar lg" : size === "xl" ? "avatar xl" : "avatar";
  return (
    <span className={cls} style={{ background: user.color }} title={title ?? user.name}>
      {user.initial}
    </span>
  );
};
