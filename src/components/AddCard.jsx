/* AddCard — inline new-task form at the bottom of each column */

import { useState, useRef, useEffect } from "react";
import { Icon } from "./Icon.jsx";

export const AddCard = ({ onAdd, columnId }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const taRef = useRef(null);

  useEffect(() => { if (open && taRef.current) taRef.current.focus(); }, [open]);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(columnId, t);
    setText("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button className="add-card" onClick={() => setOpen(true)}>
        <Icon name="plus" size={14} />
        새 작업 추가
      </button>
    );
  }
  return (
    <div className="add-card-form">
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="작업을 입력하세요…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          if (e.key === "Escape") { setOpen(false); setText(""); }
        }}
      />
      <div className="row">
        <button className="btn primary" onClick={submit}>추가</button>
        <button className="btn ghost" onClick={() => { setOpen(false); setText(""); }}>취소</button>
      </div>
    </div>
  );
};
