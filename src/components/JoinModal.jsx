/* JoinModal — name-entry gate shown before joining the board. */

import { useState } from "react";

export const JoinModal = ({ onJoin, busy, error }) => {
  const [name, setName] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const t = name.trim();
    if (t && !busy) onJoin(t);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(20,20,20,0.45)",
      display: "grid", placeItems: "center", zIndex: 300,
    }}>
      <form onSubmit={submit} style={{
        background: "var(--neutral-100)", borderRadius: 16, padding: 28,
        width: 360, maxWidth: "90vw", boxShadow: "var(--shadow-heavy)",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="brand-mark">T</div>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>TodoMate</span>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>
            보드에 참여하기
          </div>
          <div style={{ fontSize: 13, color: "var(--label-alternative)", lineHeight: 1.5 }}>
            이름을 입력하면 그 이름으로 함께 작업해요. 같은 이름이 있으면 그 사람으로 입장합니다.
          </div>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름 (예: 지민)"
          style={{
            height: 44, borderRadius: 10, padding: "0 14px",
            border: "1px solid var(--line-normal-normal)", outline: "none",
            fontFamily: "inherit", fontSize: 15, color: "var(--label-normal)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--primary-normal)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--line-normal-normal)")}
        />
        {error && (
          <div style={{ fontSize: 12.5, color: "var(--status-negative)" }}>{error}</div>
        )}
        <button
          className="btn primary"
          type="submit"
          disabled={!name.trim() || busy}
          style={{ height: 44, justifyContent: "center", fontSize: 14 }}
        >
          {busy ? "참여 중…" : "입장"}
        </button>
      </form>
    </div>
  );
};
