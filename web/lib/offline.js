// web/lib/offline.js
import { openDB } from "idb";

const DB_NAME = "mynavw-db";
const DB_VERSION = 2;
const SNAPSHOT_STORE = "todoSnapshots";
const PENDING_CREATE_STORE = "pendingCreates";

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // snapshot todos + stats
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        const store = db.createObjectStore(SNAPSHOT_STORE, { keyPath: "key" });
        store.createIndex("userId", "userId");
      }

      // outbox offline
      if (!db.objectStoreNames.contains(PENDING_CREATE_STORE)) {
        const store = db.createObjectStore(PENDING_CREATE_STORE, {
          keyPath: "id",
          autoIncrement: true
        });
        store.createIndex("userId", "userId");
      }
    }
  });
}

// ================= SNAPSHOT TODOS + STATS =================

export async function saveTodosSnapshot(userId, todos, stats) {
  try {
    const db = await getDb();
    const key = `user-${userId}`;
    await db.put(SNAPSHOT_STORE, {
      key,
      userId,
      todos,
      stats,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to save snapshot", err);
  }
}

export async function loadTodosSnapshot(userId) {
  try {
    const db = await getDb();
    const key = `user-${userId}`;
    return await db.get(SNAPSHOT_STORE, key);
  } catch (err) {
    console.error("Failed to load snapshot", err);
    return null;
  }
}

// ================= OUTBOX: PENDING CREATE TODOS =================

export async function queueCreateTodo(userId, text) {
  try {
    const db = await getDb();
    await db.add(PENDING_CREATE_STORE, {
      userId,
      text,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to queue create todo", err);
  }
}

export async function getPendingCreates(userId) {
  try {
    const db = await getDb();
    return await db.getAllFromIndex(PENDING_CREATE_STORE, "userId", userId);
  } catch (err) {
    console.error("Failed to get pending creates", err);
    return [];
  }
}

export async function clearPendingCreates(userId) {
  try {
    const db = await getDb();
    const keys = await db.getAllKeysFromIndex(
      PENDING_CREATE_STORE,
      "userId",
      userId
    );
    await Promise.all(keys.map((key) => db.delete(PENDING_CREATE_STORE, key)));
  } catch (err) {
    console.error("Failed to clear pending creates", err);
  }
}

export async function updateTodoId(userId, oldId, newTodo) {
  const snap = await loadTodosSnapshot(userId);
  if (!snap) return;

  const updatedTodos = snap.todos.map(t =>
    t.id === oldId ? newTodo : t
  );

  const updatedStats = snap.stats || {};
  await saveTodosSnapshot(userId, updatedTodos, updatedStats);
}
