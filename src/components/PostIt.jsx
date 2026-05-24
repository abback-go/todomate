/* PostIt — draggable post-it card */

import { POSTIT_COLORS } from "../data.js";
import { Icon } from "./Icon.jsx";
import { Avatar } from "./Avatar.jsx";

export const PostIt = ({ card, users, onClick, onDragStart, onDragEnd, isDragging, isDropGhost }) => {
  const palette = POSTIT_COLORS.find(c => c.id === card.color) || POSTIT_COLORS[0];
  const author = users[card.authorId];
  const assignees = (card.assignees || []).map(id => users[id]).filter(Boolean);
  const cls = [
    "postit",
    isDragging ? "dragging" : "",
    isDropGhost ? "drop-ghost" : "",
  ].filter(Boolean).join(" ");

  // Last 2 comments preview, or summaryComment override
  const previewComments = card.summaryComment
    ? [{ authorId: null, text: card.summaryComment }]
    : (card.comments || []).slice(-2);

  return (
    <div
      className={cls}
      style={{ "--postit-bg": palette.bg, "--postit-ink": palette.ink }}
      draggable
      onDragStart={(e) => onDragStart(e, card)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(card)}
    >
      {card.column === "done" && (
        <div className="postit-done-badge" aria-label="완료">
          <Icon name="check" size={14} stroke={2.6} />
        </div>
      )}
      <div className="postit-title">{card.title}</div>

      <div className="postit-meta">
        {assignees.length > 1 ? (
          <div className="postit-multi-avatars">
            {assignees.slice(0, 4).map(u => <Avatar key={u.id} user={u} />)}
          </div>
        ) : (
          <Avatar user={assignees[0] || author} />
        )}
        <span className="postit-author-name">
          {assignees.length > 1 ? `${assignees[0]?.name} 외 ${assignees.length - 1}` : (assignees[0]?.name || author?.name)}
        </span>
        {card.column !== "done" && (
          <span className="postit-comment-badge">
            <Icon name="chat" size={14} stroke={1.8} />
            {(card.comments || []).length}
          </span>
        )}
        {card.column === "done" && (
          <span className="postit-comment-badge" style={{ marginRight: 26 }}>
            <Icon name="chat" size={14} stroke={1.8} />
            {(card.comments || []).length}
          </span>
        )}
      </div>

      {previewComments.length > 0 && (
        <div className="postit-comment-preview">
          {previewComments.map((c, i) => {
            const u = c.authorId ? users[c.authorId] : null;
            return (
              <div className="line" key={c.id || i}>
                {u ? <strong style={{ fontWeight: 600 }}>{u.name}: </strong> : null}
                {c.text}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
