# Deploy RepoMind as a live website

RepoMind uses a **Node.js server** and **Ollama** (local AI). It can’t run as a fully static site like [ResumeForge on GitHub Pages](https://babaswift2005.github.io/resumeforge/), but you can still host it so others can try the UI.

---

## Deploy to Vercel (free)

1. Push this repo to GitHub: `github.com/babaswift2005/repomind`
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
3. Import **babaswift2005/repomind**
4. In **Configure Project**:
   - **Root Directory:** click **Edit** and set to **`apps/web`**
   - Leave Framework Preset as **Next.js**
   - Deploy

Your app will be live at `https://repomind-*.vercel.app` (or a custom domain if you add one).

---

## What works on the live site

- **Home page** — paste a URL and see the form (analysis will fail in the cloud because there’s no Ollama).
- **Try the live demo** — link on the home page opens a **pre-loaded sample repo** (ResumeForge). Visitors can explore:
  - Overview and AI summary  
  - Files and summaries  
  - Architecture / dependency graph  
- **Chat & Docs** — on the demo page we show a short message: “Available when you run RepoMind locally.”

So people can **try the product** (UI + sample data) before cloning. To **analyze their own repos**, they need to clone and run RepoMind locally with Ollama.

---

## Optional: custom domain

In the Vercel project → **Settings** → **Domains**, add e.g. `repomind.babaswift2005.github.io` or your own domain.

---

## Why not GitHub Pages?

GitHub Pages only serves **static** files (HTML/CSS/JS). RepoMind needs a **server** (to clone repos and call Ollama). So we use Vercel (or any Node host) for the live app and use a **static demo** (pre-built JSON) for the “Try demo” experience.
