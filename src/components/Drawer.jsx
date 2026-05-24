/* Drawer — card detail with title edit, color, assignees, comments */

import { useState, useRef, useEffect } from "react";
import { POSTIT_COLORS, timeAgo } from "../data.js";
import { Icon } from "./Icon.jsx";
import { Avatar } from "./Avatar.jsx";

export const Drawer = ({ card, columns, users, me, onClose, onUpdate, onDelete, onAddComment, onAddUser }) => {
  const [composer, setComposer] = useState("");
  const taRef = useRef(null);
  const bodyRef = useRef(null);
  const [titleDraft, setTitleDraft] = useState(card?.title || "");
  const [newAssignee, setNewAssignee] = useState("");

  useEffect(() => { setTitleDraft(card?.title || ""); }, [card?.id]);
  // Scroll to bottom whenever comments grow
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [card?.comments?.length]);

  if (!card) return null;
  const column = columns.find(c => c.id === card.column);
  const author = users[card.authorId];

  const send = () => {
    const t = composer.trim();
    if (!t) return;
    onAddComment(card.id, t);
    setComposer("");
  };

  const toggleAssignee = (uid) => {
    const list = new Set(card.assignees || []);
    if (list.has(uid)) list.delete(uid); else list.add(uid);
    onUpdate(card.id, { assignees: Array.from(list) });
  };

  const moveToColumn = (cid) => onUpdate(card.id, { column: cid });

  return (
    <>
      <div className={"scrim" + (card ? " open" : "")} onClick={onClose}></div>
      <aside className={"drawer" + (card ? " open" : "")} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-chip">
            <span className="swatch" style={{
              background: column.id === "todo" ? "#FFB8C7" : column.id === "doing" ? "#FFD66B" : "#5BD49A"
            }}></span>
            {column.title}
          </span>
          <div style={{ flex: 1 }}></div>
          <button className="icon-btn" onClick={() => onDelete(card.id)} title="삭제">
            <Icon name="trash" size={16} />
          </button>
          <button className="icon-btn" onClick={onClose} title="닫기">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="drawer-body" ref={bodyRef}>
          <div>
            <input
              className="drawer-title"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => {
                if (titleDraft.trim() && titleDraft !== card.title) {
                  onUpdate(card.id, { title: titleDraft.trim() });
                }
              }}
              onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, color: "var(--label-alternative)", fontSize: 12 }}>
              <span>작성자</span>
              <Avatar user={author} />
              <span style={{ color: "var(--label-normal)", fontWeight: 500 }}>{author?.name || "—"}</span>
              <span style={{ marginLeft: "auto" }}>{timeAgo(card.createdAt)}</span>
            </div>
          </div>

          <div>
            <div className="field-label">담당자</div>
            <div className="assignees">
              {(card.assignees || []).map(uid => {
                const u = users[uid]; if (!u) return null;
                return (
                  <span className="chip" key={uid}>
                    <Avatar user={u} />
                    {u.name}
                    <button onClick={() => toggleAssignee(uid)} aria-label={`${u.name} 제거`}>
                      <Icon name="x" size={11} stroke={2.2} />
                    </button>
                  </span>
                );
              })}
              {/* People not yet assigned */}
              {Object.values(users).filter(u => u.id !== me?.id && !(card.assignees || []).includes(u.id)).map(u => (
                <button
                  key={u.id}
                  className="chip"
                  style={{ cursor: "pointer", background: "transparent" }}
                  onClick={() => toggleAssignee(u.id)}
                >
                  <Avatar user={u} />
                  + {u.name}
                </button>
              ))}
            </div>
            {/* Add a brand-new person to the roster + assign them */}
            <form
              style={{ display: "flex", gap: 6, marginTop: 10 }}
              onSubmit={async (e) => {
                e.preventDefault();
                const name = newAssignee.trim();
                if (!name) return;
                await onAddUser(card.id, name);
                setNewAssignee("");
              }}
            >
              <input
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                placeholder="새 담당자 이름 추가…"
                style={{
                  flex: 1, height: 30, borderRadius: 999, padding: "0 12px",
                  border: "1px solid var(--line-normal-normal)", outline: "none",
                  fontFamily: "inherit", fontSize: 12.5, color: "var(--label-normal)",
                  background: "var(--neutral-99)",
                }}
              />
              <button type="submit" className="btn" disabled={!newAssignee.trim()} style={{ height: 30 }}>
                <Icon name="user-plus" size={13} /> 추가
              </button>
            </form>
          </div>

          <div>
            <div className="field-label">상태</div>
            <div style={{ display: "flex", gap: 6 }}>
              {columns.map(c => (
                <button
                  key={c.id}
                  className={"filter-chip" + (c.id === card.column ? " active" : "")}
                  onClick={() => moveToColumn(c.id)}
                  style={{ height: 30 }}
                >
                  <span className="swatch" style={{
                    width: 8, height: 8, borderRadius: 2,
                    background: c.id === "todo" ? "#FFB8C7" : c.id === "doing" ? "#FFD66B" : "#5BD49A",
                    display: "inline-block",
                  }}></span>
                  {c.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="field-label">포스트잇 색상</div>
            <div className="color-swatches">
              {POSTIT_COLORS.map(c => (
                <button
                  key={c.id}
                  style={{ background: c.bg }}
                  aria-pressed={card.color === c.id}
                  aria-label={c.id}
                  onClick={() => onUpdate(card.id, { color: c.id })}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="field-label">코멘트 ({(card.comments || []).length})</div>
            <div className="comments-list">
              {(card.comments || []).length === 0 && (
                <div style={{ fontSize: 13, color: "var(--label-assistive)", padding: "8px 0" }}>
                  아직 코멘트가 없어요. 첫 코멘트를 남겨보세요.
                </div>
              )}
              {(card.comments || []).map(co => {
                const u = users[co.authorId];
                return (
                  <div className="comment" key={co.id}>
                    <Avatar user={u} size="lg" />
                    <div className="comment-body">
                      <div className="comment-head">
                        <span className="comment-author">{u?.name || "사용자"}</span>
                        <span className="comment-time">{timeAgo(co.time)}</span>
                      </div>
                      <div className="comment-text">{co.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="composer">
          <div className="composer-row">
            <Avatar user={me} size="lg" />
            <textarea
              ref={taRef}
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              placeholder="코멘트를 남기세요…  (⏎ 전송, ⇧⏎ 줄바꿈)"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault(); send();
                }
              }}
            />
            <button
              className="send"
              onClick={send}
              disabled={!composer.trim()}
              aria-label="전송"
            >
              <Icon name="send" size={16} stroke={2.2} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
