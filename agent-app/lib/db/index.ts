import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface DBInterface {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string, ...params: any[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: any[]): Promise<T[]>;
  runAsync(sql: string, ...params: any[]): Promise<any>;
}

// In-memory + AsyncStorage fallback for Web platform where wa-sqlite WASM / OPFS is not supported
class WebStorageDB implements DBInterface {
  private farmers: Record<string, any> = {};
  private batches: Record<string, any> = {};
  private initialized = false;

  private async load() {
    if (this.initialized) return;
    try {
      const f = await AsyncStorage.getItem("@db_farmers");
      const b = await AsyncStorage.getItem("@db_batches");
      if (f) this.farmers = JSON.parse(f);
      if (b) this.batches = JSON.parse(b);
    } catch {}
    this.initialized = true;
  }

  private async save() {
    try {
      await AsyncStorage.setItem("@db_farmers", JSON.stringify(this.farmers));
      await AsyncStorage.setItem("@db_batches", JSON.stringify(this.batches));
    } catch {}
  }

  async execAsync(sql: string): Promise<void> {
    await this.load();
  }

  async getFirstAsync<T>(sql: string, ...params: any[]): Promise<T | null> {
    const all = await this.getAllAsync<T>(sql, ...params);
    return all.length > 0 ? all[0] : null;
  }

  async getAllAsync<T>(sql: string, ...params: any[]): Promise<T[]> {
    await this.load();
    const cleanSql = sql.trim().toLowerCase();

    if (cleanSql.includes("count(*) as count from farmers")) {
      return [{ count: Object.keys(this.farmers).length }] as unknown as T[];
    }

    if (cleanSql.includes("from farmers")) {
      let list = Object.values(this.farmers);
      if (cleanSql.includes("sync_status = 'pending'")) {
        list = list.filter((item) => item.sync_status === "PENDING");
      }
      return list as unknown as T[];
    }

    if (cleanSql.includes("from batches")) {
      let list = Object.values(this.batches);
      if (cleanSql.includes("sync_status = 'pending'")) {
        list = list.filter((item) => item.sync_status === "PENDING");
      }
      return list as unknown as T[];
    }

    return [];
  }

  async runAsync(sql: string, ...params: any[]): Promise<any> {
    await this.load();
    const cleanSql = sql.trim().toLowerCase();
    const actualParams = Array.isArray(params[0]) ? params[0] : params;

    if (cleanSql.startsWith("insert into farmers")) {
      const [id, display_id, agent_id, name, phone, village, union_name, district, landDecimal, crop, registeredDaysAgo, hasWallet, latitude, longitude, sync_status, payload] = actualParams;
      this.farmers[id] = {
        id,
        display_id,
        agent_id,
        name,
        phone,
        village,
        union_name,
        district,
        landDecimal,
        crop,
        registeredDaysAgo,
        hasWallet,
        latitude,
        longitude,
        sync_status: sync_status ?? "PENDING",
        payload,
      };
      await this.save();
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (cleanSql.startsWith("insert into batches")) {
      const [id, display_id, agent_id, farmerId, farmerName, crop, quantityKg, harvestDate, inputs, createdDaysAgo, sync_status, payload] = actualParams;
      this.batches[id] = {
        id,
        display_id,
        agent_id,
        farmerId,
        farmerName,
        crop,
        quantityKg,
        harvestDate,
        inputs,
        createdDaysAgo,
        sync_status: sync_status ?? "PENDING",
        payload,
      };
      await this.save();
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (cleanSql.startsWith("update farmers set sync_status = 'synced' where id = ?")) {
      const [id] = actualParams;
      if (this.farmers[id]) this.farmers[id].sync_status = "SYNCED";
      await this.save();
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (cleanSql.startsWith("update batches set sync_status = 'synced' where id = ?")) {
      const [id] = actualParams;
      if (this.batches[id]) this.batches[id].sync_status = "SYNCED";
      await this.save();
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (cleanSql.startsWith("update farmers set sync_status = 'synced'")) {
      Object.keys(this.farmers).forEach((id) => {
        if (this.farmers[id].sync_status === "PENDING") {
          this.farmers[id].sync_status = "SYNCED";
        }
      });
      await this.save();
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (cleanSql.startsWith("update batches set sync_status = 'synced'")) {
      Object.keys(this.batches).forEach((id) => {
        if (this.batches[id].sync_status === "PENDING") {
          this.batches[id].sync_status = "SYNCED";
        }
      });
      await this.save();
      return { lastInsertRowId: 1, changes: 1 };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }
}

let cachedDb: DBInterface | null = null;

export async function getDb(): Promise<DBInterface> {
  if (cachedDb) return cachedDb;

  if (Platform.OS === "web") {
    cachedDb = new WebStorageDB();
    return cachedDb;
  }

  try {
    const db = await SQLite.openDatabaseAsync("agro360.db");
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS farmers (
        id TEXT PRIMARY KEY NOT NULL,
        display_id TEXT,
        agent_id TEXT,
        name TEXT NOT NULL,
        phone TEXT,
        village TEXT,
        union_name TEXT,
        district TEXT,
        landDecimal REAL,
        crop TEXT,
        registeredDaysAgo INTEGER,
        hasWallet INTEGER DEFAULT 0,
        latitude REAL,
        longitude REAL,
        sync_status TEXT DEFAULT 'PENDING',
        payload TEXT
      );

      CREATE TABLE IF NOT EXISTS batches (
        id TEXT PRIMARY KEY NOT NULL,
        display_id TEXT,
        agent_id TEXT,
        farmerId TEXT NOT NULL,
        farmerName TEXT NOT NULL,
        crop TEXT,
        quantityKg REAL,
        harvestDate TEXT,
        inputs TEXT,
        createdDaysAgo INTEGER,
        sync_status TEXT DEFAULT 'PENDING',
        payload TEXT
      );
    `);

    // Defensive migration: devices that already have an older agro360.db
    // (from before display_id/agent_id/district/payload existed) keep their
    // table from the CREATE TABLE IF NOT EXISTS above as-is, so add any
    // missing columns explicitly. SQLite errors if a column already exists —
    // that's expected on fresh installs and is safe to ignore.
    const migrations = [
      "ALTER TABLE farmers ADD COLUMN display_id TEXT",
      "ALTER TABLE farmers ADD COLUMN agent_id TEXT",
      "ALTER TABLE farmers ADD COLUMN district TEXT",
      "ALTER TABLE farmers ADD COLUMN payload TEXT",
      "ALTER TABLE batches ADD COLUMN display_id TEXT",
      "ALTER TABLE batches ADD COLUMN agent_id TEXT",
      "ALTER TABLE batches ADD COLUMN payload TEXT",
    ];
    for (const stmt of migrations) {
      try {
        await db.execAsync(stmt);
      } catch {
        // Column already exists — ignore.
      }
    }

    cachedDb = db as unknown as DBInterface;
    return cachedDb;
  } catch (e) {
    console.warn("Failed to open SQLite database natively, falling back to WebStorageDB:", e);
    cachedDb = new WebStorageDB();
    return cachedDb;
  }
}


