/* Supabase Realtime Presence — who is online on the board right now. */

import { supabase } from "./supabaseClient.js";

export function joinPresence(me, onSync) {
  const channel = supabase.channel("todomate-presence", {
    config: { presence: { key: me.id } },
  });

  channel.on("presence", { event: "sync" }, () => {
    const state = channel.presenceState();
    const seen = new Map();
    for (const key of Object.keys(state)) {
      for (const meta of state[key]) {
        const id = meta.id || key;
        seen.set(id, { id, name: meta.name, color: meta.color, initial: meta.initial });
      }
    }
    onSync([...seen.values()]);
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({ id: me.id, name: me.name, color: me.color, initial: me.initial });
    }
  });

  return () => supabase.removeChannel(channel);
}
