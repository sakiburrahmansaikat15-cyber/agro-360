import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { getDb } from "../db";
import { supabase } from "../supabase";

/**
 * Offline submission queue.
 *
 * farmer/new.tsx and batch/new.tsx write a row to the local `farmers` /
 * `batches` SQLite tables with sync_status = 'PENDING' whenever the Supabase
 * insert fails (offline, or a transient server error) — see `payload` column,
 * which holds the exact row that still needs to reach Supabase. This module
 * is what actually retries those pending rows; previously nothing called the
 * equivalent function, so records could sit as "PENDING" forever with no
 * retry mechanism despite the app's UI claiming to work offline.
 */
export async function syncPendingSubmissions(): Promise<{
  farmersSynced: number;
  batchesSynced: number;
  farmersFailed: number;
  batchesFailed: number;
}> {
  const result = { farmersSynced: 0, batchesSynced: 0, farmersFailed: 0, batchesFailed: 0 };
  if (!supabase) return result;

  const db = await getDb();

  try {
    const pendingFarmers = await db.getAllAsync<any>(
      "SELECT * FROM farmers WHERE sync_status = 'PENDING'"
    );
    for (const f of pendingFarmers) {
      try {
        const payload = f.payload ? JSON.parse(f.payload) : null;
        if (!payload) continue;
        const { error } = await supabase.from("farmers").insert([payload]);
        if (error) {
          result.farmersFailed++;
          continue;
        }
        await db.runAsync("UPDATE farmers SET sync_status = 'SYNCED' WHERE id = ?", [f.id]);
        result.farmersSynced++;
      } catch (err) {
        console.error("Retry farmer sync failed:", err);
        result.farmersFailed++;
      }
    }
  } catch (err) {
    console.error("Reading pending farmers failed:", err);
  }

  try {
    const pendingBatches = await db.getAllAsync<any>(
      "SELECT * FROM batches WHERE sync_status = 'PENDING'"
    );
    for (const b of pendingBatches) {
      try {
        const payload = b.payload ? JSON.parse(b.payload) : null;
        if (!payload) continue;
        const { error } = await supabase.from("batches").insert([payload]);
        if (error) {
          result.batchesFailed++;
          continue;
        }
        await db.runAsync("UPDATE batches SET sync_status = 'SYNCED' WHERE id = ?", [b.id]);
        result.batchesSynced++;
      } catch (err) {
        console.error("Retry batch sync failed:", err);
        result.batchesFailed++;
      }
    }
  } catch (err) {
    console.error("Reading pending batches failed:", err);
  }

  return result;
}

export async function getPendingCount(): Promise<number> {
  try {
    const db = await getDb();
    const farmers = await db.getAllAsync<any>("SELECT id FROM farmers WHERE sync_status = 'PENDING'");
    const batches = await db.getAllAsync<any>("SELECT id FROM batches WHERE sync_status = 'PENDING'");
    return farmers.length + batches.length;
  } catch {
    return 0;
  }
}

/**
 * Drives automatic retry: on mount, whenever the app returns to the
 * foreground, and on a 30s interval while foregrounded. Also exposes the
 * current pending count and a manual trigger for a "Sync now" button.
 */
export function useSyncQueue() {
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshPendingCount = async () => {
    setPendingCount(await getPendingCount());
  };

  const runSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await syncPendingSubmissions();
      if (result.farmersSynced > 0) queryClient.invalidateQueries({ queryKey: ["farmers"] });
      if (result.batchesSynced > 0) queryClient.invalidateQueries({ queryKey: ["batches"] });
      await refreshPendingCount();
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    runSync();
    refreshPendingCount();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") runSync();
    });

    intervalRef.current = setInterval(runSync, 30_000);

    return () => {
      sub.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { pendingCount, syncing, runSync };
}
