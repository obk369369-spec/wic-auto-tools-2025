// /lib/kv_safe.ts
// Deno.openKv() 미사용. JSON 파일로 간단한 get/set 구현.
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";


const DATA_DIR = "/export"; // 퍼블릭 읽기 가능 경로
const STORE_FILE = join(DATA_DIR, "kv_store.json");


async function ensure(){ await Deno.mkdir(DATA_DIR, { recursive: true }).catch(()=>{}); }
async function readAll(): Promise<Record<string, unknown>>{
try { const t = await Deno.readTextFile(STORE_FILE); return JSON.parse(t); } catch { return {}; }
}
async function writeAll(obj: Record<string, unknown>){ await ensure(); await Deno.writeTextFile(STORE_FILE, JSON.stringify(obj, null, 2)); }


export async function kvGet<T=unknown>(key: string): Promise<T | null> {
const db = await readAll();
return (db[key] as T) ?? null;
}


export async function kvSet(key: string, value: unknown): Promise<void> {
const db = await readAll();
db[key] = value;
await writeAll(db);
}


export async function kvDelete(key: string): Promise<void> {
const db = await readAll();
delete db[key];
await writeAll(db);
}
