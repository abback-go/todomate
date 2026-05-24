/* TodoMate — realtime collaborative board backed by Supabase */

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { COLUMNS } from "./data.js";
import { isSupabaseConfigured } from "./supabaseClient.js";
import * as db from "./db.js";
import { joinPresence } from "./presence.js";
import { Icon } from "./components/Icon.jsx";
import { Avatar } from "./components/Avatar.jsx";
import { Column } from "./components/Column.jsx";
import { Drawer } from "./components/Drawer.jsx";
import { JoinModal } from "./components/JoinModal.jsx";
import { PasscodeGate } from "./components/PasscodeGate.jsx";

const ME_KEY = "todomate.me";
const GATE_KEY = "todomate.unlocked";
const PASSCODE = import.meta.env.VITE_BOARD_PASSCODE || "";

export default function App() {
  const [me, setMe] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ME_KEY) || "null"); }
    catch { return null; }
  });
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [unlocked, setUnlocked] = useState(
    () => !PASSCODE || localStorage.getItem(GATE_KEY) === PASSCODE
  );

  const unlock = (value) => {
    if (PASSCODE && value === PASSCODE) {
      localStorage.setItem(GATE_KEY, value);
      setUnlocked(true);
      return true;
    }
    return false;
  };

  const [users, setUsers] = useState([]);
  const [cards, setCards] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [openId, setOpenId] = useState(null);
  const [filterUser, setFilterUser] = useState(null); // 'me' | userId | null
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  const toastTimer = useRef(null);
  const reloadTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const usersMap = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users]
  );

  const loadAll = useCallback(async () => {
    const { users, cards } = await db.loadBoard();
    setUsers(users);
    setCards(cards);
    setLoaded(true);
  }, []);

  const scheduleReload = useCallback(() => {
    clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => { loadAll().catch(console.error); }, 120);
  }, [loadAll]);

  // Initial load + realtime + presence (once we have an identity)
  useEffect(() => {
    if (!isSupabaseConfigured || !me) return;
    loadAll().catch((e) => { console.error(e); showToast("데이터를 불러오지 못했어요"); });
    const unsubBoard = db.subscribeToBoard(scheduleReload);
    const unsubPresence = joinPresence(me, setOnlineUsers);
    return () => { unsubBoard(); unsubPresence(); };
  }, [me, loadAll, scheduleReload]);

  // Esc closes drawer
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") setOpenId(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // --- Join ---
  const join = async (name) => {
    setJoinBusy(true); setJoinError(null);
    try {
      const user = await db.findOrCreateUser(name);
      localStorage.setItem(ME_KEY, JSON.stringify(user));
      setMe(user);
    } catch (e) {
      console.error(e);
      setJoinError("입장에 실패했어요. Supabase 설정과 스키마를 확인해주세요.");
    } finally {
      setJoinBusy(false);
    }
  };

  // --- Drag & drop ---
  const onDragStart = (e, card) => {
    setDraggingId(card.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", card.id);
    const ghost = e.currentTarget.cloneNode(true);
    ghost.style.position = "absolute";
    ghost.style.top = "-1000px";
    ghost.style.left = "-1000px";
    ghost.style.width = e.currentTarget.offsetWidth + "px";
    ghost.style.transform = "rotate(-3deg)";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 20, 20);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };
  const onDragEnd = () => setDraggingId(null);
  const onDrop = async (columnId) => {
    const id = draggingId;
    setDraggingId(null);
    if (!id) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.column === columnId) return;
    // optimistic
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, column: columnId } : c)));
    const colName = COLUMNS.find((c) => c.id === columnId)?.title;
    showToast(`"${card.title}" → ${colName}`);
    try { await db.updateCard(id, { column: columnId }); }
    catch (e) { console.error(e); showToast("이동에 실패했어요"); }
    loadAll().catch(console.error);
  };

  // --- Mutations ---
  const addCard = async (columnId, text) => {
    try { await db.addCard(columnId, text, me.id); showToast("새 작업이 추가되었어요"); }
    catch (e) { console.error(e); showToast("추가에 실패했어요"); }
    loadAll().catch(console.error);
  };

  const updateCard = async (id, patch) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))); // optimistic
    try { await db.updateCard(id, patch); }
    catch (e) { console.error(e); showToast("수정에 실패했어요"); }
    loadAll().catch(console.error);
  };

  const deleteCard = async (id) => {
    setOpenId(null);
    try { await db.deleteCard(id); showToast("작업이 삭제되었어요"); }
    catch (e) { console.error(e); showToast("삭제에 실패했어요"); }
    loadAll().catch(console.error);
  };

  const addComment = async (cardId, text) => {
    try { await db.addComment(cardId, me.id, text); }
    catch (e) { console.error(e); showToast("코멘트 전송에 실패했어요"); }
    loadAll().catch(console.error);
  };

  // Create a brand-new person and assign them to a card
  const addUser = async (cardId, name) => {
    try {
      const user = await db.findOrCreateUser(name);
      const card = cards.find((c) => c.id === cardId);
      const next = Array.from(new Set([...(card?.assignees || []), user.id]));
      await db.updateCard(cardId, { assignees: next });
      showToast(`${user.name} 추가됨`);
    } catch (e) { console.error(e); showToast("담당자 추가에 실패했어요"); }
    loadAll().catch(console.error);
  };

  const invite = async () => {
    try { await navigator.clipboard.writeText(window.location.href); showToast("초대 링크가 복사되었어요"); }
    catch { showToast(window.location.href); }
  };

  // --- Derived ---
  const filteredCards = useMemo(() => {
    let out = cards;
    if (filterUser === "me" && me) {
      out = out.filter((c) => (c.assignees || []).includes(me.id) || c.authorId === me.id);
    } else if (filterUser) {
      out = out.filter((c) => (c.assignees || []).includes(filterUser));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        (c.comments || []).some((co) => co.text.toLowerCase().includes(q))
      );
    }
    return out;
  }, [cards, filterUser, search, me]);

  const cardsByColumn = useMemo(() => {
    const map = { todo: [], doing: [], done: [] };
    filteredCards.forEach((c) => { if (map[c.column]) map[c.column].push(c); });
    return map;
  }, [filteredCards]);

  const openCardData = cards.find((c) => c.id === openId) || null;
  const teammates = users.filter((u) => u.id !== me?.id);

  // --- Render gates ---
  if (!isSupabaseConfigured) return <SetupScreen />;
  if (!unlocked) return <PasscodeGate onUnlock={unlock} />;
  if (!me) return <JoinModal onJoin={join} busy={joinBusy} error={joinError} />;

  return (
    <div className="app-shell" data-density="default" data-fold="on">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark">T</div>
          TodoMate
        </div>

        <div className="topbar-board">
          <span className="topbar-board-meta">{cards.length}개의 작업</span>
        </div>

        <div className="topbar-spacer"></div>

        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px",
          border: "1px solid var(--line-normal-normal)",
          borderRadius: 10, background: "var(--neutral-99)", width: 200,
        }}>
          <Icon name="search" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="작업, 코멘트 검색…"
            style={{
              border: "none", background: "transparent", outline: "none",
              fontFamily: "inherit", fontSize: 13, width: "100%", color: "var(--label-normal)",
            }}
          />
        </div>

        <div className="presence" title="현재 보드를 보고 있는 팀원">
          <span className="presence-dot"></span>
          <div className="presence-stack">
            {onlineUsers.slice(0, 6).map((u) => (
              <Avatar key={u.id} user={u} title={u.name} />
            ))}
          </div>
          <span className="presence-label">{onlineUsers.length}명 접속 중</span>
        </div>

        <button className="btn" onClick={invite}>
          <Icon name="user-plus" size={14} />
          초대
        </button>
      </header>

      <div className="filterbar">
        <button
          className={"filter-chip" + (filterUser === null ? " active" : "")}
          onClick={() => setFilterUser(null)}
        >
          전체
        </button>
        <button
          className={"filter-chip" + (filterUser === "me" ? " active" : "")}
          onClick={() => setFilterUser("me")}
        >
          내 작업
        </button>
        {teammates.length > 0 && (
          <div style={{ width: 1, height: 16, background: "var(--line-normal-normal)" }}></div>
        )}
        {teammates.map((u) => {
          const active = filterUser === u.id;
          return (
            <button
              key={u.id}
              className={"filter-chip" + (active ? " active" : "")}
              onClick={() => setFilterUser(active ? null : u.id)}
            >
              <Avatar user={u} />
              {u.name}
            </button>
          );
        })}
        <div style={{ flex: 1 }}></div>
        {(filterUser || search) && (
          <button className="filter-chip" onClick={() => { setFilterUser(null); setSearch(""); }}>
            <Icon name="x" size={12} stroke={2.4} />
            필터 초기화
          </button>
        )}
      </div>

      <main className="board">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            column={col}
            cards={cardsByColumn[col.id] || []}
            users={usersMap}
            onCardClick={(card) => setOpenId(card.id)}
            onAddCard={addCard}
            drag={{ draggingId, onDragStart, onDragEnd, onDrop }}
          />
        ))}
      </main>

      <Drawer
        card={openCardData}
        columns={COLUMNS}
        users={usersMap}
        me={me}
        onClose={() => setOpenId(null)}
        onUpdate={updateCard}
        onDelete={deleteCard}
        onAddComment={addComment}
        onAddUser={addUser}
      />

      <div className={"toast" + (toast ? " show" : "")}>
        <Icon name="check" size={14} stroke={2.4} />
        {toast}
      </div>

      {!loaded && (
        <div style={{
          position: "fixed", bottom: 24, left: 24,
          fontSize: 12.5, color: "var(--label-alternative)",
        }}>
          불러오는 중…
        </div>
      )}
    </div>
  );
}

// Shown when .env is missing Supabase credentials.
function SetupScreen() {
  return (
    <div style={{
      minHeight: "100vh", display: "grid", placeItems: "center", padding: 24,
    }}>
      <div style={{
        maxWidth: 520, background: "var(--neutral-100)", border: "1px solid var(--line-normal-normal)",
        borderRadius: 16, padding: 32, boxShadow: "var(--shadow-normal)", lineHeight: 1.6,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div className="brand-mark">T</div>
          <span style={{ fontSize: 17, fontWeight: 700 }}>TodoMate</span>
        </div>
        <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>Supabase 설정이 필요해요</h2>
        <p style={{ fontSize: 14, color: "var(--label-neutral)", margin: "0 0 16px" }}>
          실시간 협업을 위해 Supabase 프로젝트의 키를 <code>.env</code> 파일에 입력하세요.
        </p>
        <ol style={{ fontSize: 13.5, color: "var(--label-neutral)", paddingLeft: 20, margin: 0 }}>
          <li><b>supabase.com</b>에서 프로젝트 생성 (무료)</li>
          <li>SQL Editor에서 <code>supabase/schema.sql</code> 실행</li>
          <li>Project Settings → API에서 <b>Project URL</b>과 <b>anon key</b> 복사</li>
          <li><code>.env</code>에 <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code> 입력</li>
          <li>개발 서버 재시작 (<code>npm run dev</code>)</li>
        </ol>
      </div>
    </div>
  );
}
