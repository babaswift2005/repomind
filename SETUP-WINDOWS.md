# RepoMind — Windows setup

Use this if you're on Windows and ran into `'ollama' is not recognized` or path errors.

---

## 1. Install Ollama (required for AI)

- **Ollama is an application**, not a pip package. Do **not** run `pip install ollama` or `pip install llama3.2`.
- Go to **[https://ollama.ai](https://ollama.ai)** and download the **Windows** installer.
- Run the installer, then **close and reopen** Command Prompt (or PowerShell) so `ollama` is on your PATH.
- In a **new** terminal, run:
  ```cmd
  ollama pull llama3.2
  ollama pull nomic-embed-text
  ```
- If you still get `'ollama' is not recognized`, add Ollama to PATH or run:
  ```cmd
  "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" pull llama3.2
  "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" pull nomic-embed-text
  ```

---

## 2. Run the web app

You are already in the repo root: `C:\Users\Administrator\Documents\Projects\repomind`.

From there, run (note: `apps\web` with backslash on Windows):

```cmd
cd apps\web
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## 3. Optional: use pnpm from repo root

From `C:\Users\Administrator\Documents\Projects\repomind`:

```cmd
pnpm install
pnpm dev
```

This runs the web app from the root (pnpm runs the `web` workspace).

---

## Quick reference

| You want to…           | Command (from repo root)     |
|------------------------|------------------------------|
| Go to web app folder   | `cd apps\web`                |
| Install deps           | `npm install` (inside `apps\web`) |
| Start dev server       | `npm run dev`                |
| Pull Ollama models     | `ollama pull llama3.2` and `ollama pull nomic-embed-text` (after installing Ollama app) |
