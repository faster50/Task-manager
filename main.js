import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

// Create or open the database
let db;
let mainWindow; // Declare mainWindow variable

app.whenReady().then(() => {
  try {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    const dbPath = path.join(userDataPath, 'notes.db');
    db = new Database(dbPath);

    // Create the `tasks` table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task TEXT NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        finished TEXT
      )
    `);
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    app.quit();
  }
});
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadFile('src/index.html');
  mainWindow.webContents.openDevTools();
}

function setupIpcHandlers() {
  ipcMain.handle('add-note', (_, note) => {
    console.log('Received note:', note);

    if (!note.task || !note.date || !note.time) {
      return { success: false, error: 'Missing required fields (task, date, time)' };
    }

    const stmt = db.prepare(`
      INSERT INTO tasks (task, date, time, finished)
      VALUES (?, ?, ?, ?)
    `);

    try {
      const info = stmt.run(note.task, note.date, note.time, "Not finished");
      const insertedId = info.lastInsertRowid;
      return { success: true, insertedId };
    } catch (error) {
      console.error('Failed to insert note:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('list-tasks', () => {
    try {
      const stmt = db.prepare(`SELECT * FROM tasks`);
      const tasks = stmt.all();
      return tasks;
    } catch (error) {
      console.error('Failed to fetch task list:', error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-task', (_, noteId) => {
    try {
      const stmt = db.prepare(`
        DELETE FROM tasks WHERE id = ?
      `);
      stmt.run(noteId);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete task:', error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-task', (_, noteId) => {
    try {
      const stmt = db.prepare(`SELECT * FROM tasks WHERE id = ?`);
      const task = stmt.get(noteId);
      return task;
    } catch (error) {
      console.error('Failed to fetch task:', error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('list-tasks-notcomplete', () => {
    try {
      const payload = db.prepare(`SELECT * FROM tasks WHERE finished = ?`);
      const response = payload.all("Not finished");
      return response;
    } catch (error) {
      console.error('Failed to fetch unfinished tasks:', error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('complete-task', (_, noteId) => {
    try {
      const payload = db.prepare('UPDATE tasks SET finished = ? WHERE id = ?');
      payload.run("Finished", noteId);
      return { success: true };
    } catch (error) {
      console.error('Failed to complete task:', error.message);
      return { success: false, error: error.message };
    }
  });

}


app.on('ready', () => {
  createMainWindow();
  setupIpcHandlers();
});

// Handle window-all-closed event
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle activate event for macOS
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
