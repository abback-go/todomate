/* Supabase data access for TodoMate.
   Maps DB rows (snake_case) to the shape components expect (camelCase). */

import { supabase } from "./supabaseClient.js";
import { AVATAR_COLORS } from "./data.js";

const mapUser = (r) => ({ id: r.id, name: r.name, color: r.color, initial: r.initial });

const mapComment = (r) => ({
  id: r.id,
  authorId: r.author_id,
  text: r.text,
  time: new Date(r.created_at).getTime(),
});

const mapCard = (r) => ({
  id: r.id,
  column: r.column,
  color: r.color,
  title: r.title,
  authorId: r.author_id,
  assignees: r.assignees || [],
  summaryComment: r.summary_comment || undefined,
  createdAt: new Date(r.created_at).getTime(),
  sort: r.sort,
  comments: [],
});

// ---------- Reads ----------
export async function loadBoard() {
  const [usersRes, cardsRes, commentsRes] = await Promise.all([
    supabase.from("users").select("*").order("created_at", { ascending: true }),
    supabase.from("cards").select("*").order("sort", { ascending: true }),
    supabase.from("comments").select("*").order("created_at", { ascending: true }),
  ]);
  if (usersRes.error) throw usersRes.error;
  if (cardsRes.error) throw cardsRes.error;
  if (commentsRes.error) throw commentsRes.error;

  const cards = cardsRes.data.map(mapCard);
  const byId = new Map(cards.map((c) => [c.id, c]));
  for (const row of commentsRes.data) {
    const card = byId.get(row.card_id);
    if (card) card.comments.push(mapComment(row));
  }
  return { users: usersRes.data.map(mapUser), cards };
}

// ---------- Users ----------
export async function findOrCreateUser(rawName) {
  const name = rawName.trim();
  if (!name) throw new Error("이름이 비어 있습니다.");

  const { data: existing, error: selErr } = await supabase
    .from("users").select("*").eq("name", name).limit(1);
  if (selErr) throw selErr;
  if (existing && existing.length) return mapUser(existing[0]);

  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const { data, error } = await supabase
    .from("users")
    .insert({ name, color, initial: [...name][0] })
    .select()
    .single();
  if (error) throw error;
  return mapUser(data);
}

// ---------- Cards ----------
const CARD_COLORS = ["pink", "yellow", "blue", "lilac", "lemon", "mint", "peach"];

export async function addCard(columnId, title, authorId) {
  const { error } = await supabase.from("cards").insert({
    column: columnId,
    color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)],
    title,
    author_id: authorId,
    assignees: authorId ? [authorId] : [],
    sort: Date.now(),
  });
  if (error) throw error;
}

export async function updateCard(id, patch) {
  const row = {};
  if ("column" in patch) row.column = patch.column;
  if ("color" in patch) row.color = patch.color;
  if ("title" in patch) row.title = patch.title;
  if ("assignees" in patch) row.assignees = patch.assignees;
  const { error } = await supabase.from("cards").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteCard(id) {
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Comments ----------
export async function addComment(cardId, authorId, text) {
  const { error } = await supabase
    .from("comments")
    .insert({ card_id: cardId, author_id: authorId, text });
  if (error) throw error;
}

// ---------- Realtime ----------
// Fires `onChange` whenever any board table changes (on any client).
export function subscribeToBoard(onChange) {
  const channel = supabase
    .channel("todomate-board-db")
    .on("postgres_changes", { event: "*", schema: "public", table: "cards" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "users" }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
