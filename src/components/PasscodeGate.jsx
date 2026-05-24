/* PasscodeGate — a lightweight shared-passcode screen shown before joining.
   NOT real security: the passcode is baked into the static bundle and can be
   bypassed by a determined user. It only deters casual access via a shared URL. */

import { useState } from "react";

export const PasscodeGate = ({ onUnlock }) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (onUnlock(value.trim())) return;
    setError(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "var(--neutral-99)",
      display: "grid", placeItems: "center", padding: 24,
    }}>
      <form onSubmit={submit} style={{
        background: "var(--neutral-100)", borderRadius: 16, padding: 28,
        width: 360, maxWidth: "90vw", boxShadow: "var(--shadow-normal)",
        border: "1px solid var(--line-normal-normal)",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="brand-mark">T</div>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>TodoMate</span>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>
            접속 암호
          </div>
          <div style={{ fontSize: 13, color: "var(--label-alternative)", lineHeight: 1.5 }}>
            팀에서 공유받은 암호를 입력하세요.
          </div>
        </div>
        <input
          autoFocus
          type="password"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          placeholder="암호"
          style={{
            height: 44, borderRadius: 10, padding: "0 14px",
            border: `1px solid ${error ? "var(--status-negative)" : "var(--line-normal-normal)"}`,
            outline: "none", fontFamily: "inherit", fontSize: 15, color: "var(--label-normal)",
          }}
        />
        {error && (
          <div style={{ fontSize: 12.5, color: "var(--status-negative)" }}>암호가 올바르지 않아요.</div>
        )}
        <button className="btn primary" type="submit" disabled={!value.trim()}
          style={{ height: 44, justifyContent: "center", fontSize: 14 }}>
          입장
        </button>
      </form>
    </div>
  );
};
