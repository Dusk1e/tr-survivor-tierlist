# 🇹🇷 TR - SURVİVOR TİERLİST

A bright, **Transformice-styled** tier list for the Turkish **Transformice
Survivor** community — sky-to-grass background, cream rounded cards, cheese &
teal accents, chocolate text, and a game-logo title. Animated rank bands,
player logins + voting, and a protected admin dashboard for full CRUD.

Built with **Next.js 14 · TypeScript · Tailwind CSS · Framer Motion**, with an
**optional Supabase** backend. It runs out of the box with **zero backend
config** (data saved in the browser), and upgrades to a real shared database
when you add Supabase keys.

---

## ✨ Features

- **Public tier list** — Solo Leveling ranks: `NATIONAL / MONARCH → S → A → B → C → D/E`.
  - Custom rank colors, neon glow, animated entrance.
  - **Mouse cards** with the classic **Transformice mouse** avatar (or a pasted
    image URL); hover shows a quick **System** peek, click opens the full
    detail + voting modal.
- **Player logins & voting** (Local Mode):
  - The admin creates a **username + password** for each mouse and hands it to
    the player — no e-mail, no self sign-up.
  - A logged-in player shows a **“Giriş Yapıldı”** badge under their own card.
  - Qualitative voting (no points): **Çok İyi · İyi · Orta · Kötü · Çok Kötü**.
    Any logged-in player can rate others; **self-voting is disabled**.
  - Each card shows a live rating summary bar.
- **Admin dashboard** (`/admin`) behind a password:
  - **Add / Edit / Delete** mice, set their login, **move** between ranks, and
    **reorder** within a rank. Login credentials are shown per row (click to copy).
  - **📊 Oy Kayıtları** panel: who voted what, for whom — grouped by voter
    (“Kim ne verdi”) or by target (“Kim ne aldı”).
- **Read-only for the public** — roster writes are gated by a signed, httpOnly
  session cookie and (in cloud mode) the server-only service key.
- Fully **responsive** (mobile / tablet / desktop).

> **Custom mouse image:** drop your own PNG at `public/mouse.png` and it is
> used as the default avatar automatically. Otherwise a built-in SVG mouse is
> drawn.

---

## 🚀 Quick start (Local Demo Mode — no backend needed)

```bash
npm install
npm run dev
```

Open **http://localhost:3000**.

- The public tier list is seeded with example mice.
- **Admin:** go to **/admin** and log in with the demo password: **`survivor2024`**
- **Play as a mouse:** click **🔓 Fare Girişi** (top-right). Every seed mouse
  uses username = its nick and password **`1234`** (e.g. `Igris` / `1234`).
  Then click any other mouse and vote.
- Everything you add / edit / vote is saved in **your browser** (localStorage).

> Local Demo Mode is per-browser — great for trying it out. For a real,
> shared tier list that everyone sees, enable Supabase below.

---

## ☁️ Enable the shared database (Supabase)

1. Create a free project at <https://supabase.com>.
2. Open the **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql).
3. In **Project Settings → API**, copy your keys.
4. Copy `.env.local.example` → `.env.local` and fill in:

   ```bash
   ADMIN_PASSWORD=your-strong-password
   AUTH_SECRET=<random 32+ char string>

   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...     # server-only, never exposed
   ```

   Generate a secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. Restart `npm run dev`. The footer badge flips to **“System Online”** and the
   table auto-seeds on first load. Admin edits now persist for everyone.

**Security model:** the public/anon key is read-only (enforced by Row Level
Security). All writes happen in Next.js API routes that (a) verify the admin
session cookie and (b) use the **service role key**, which lives only on the
server and is never sent to the browser.

---

## 🌐 Deploy

### Vercel (recommended)
1. Push this folder to a Git repo and import it at <https://vercel.com/new>.
2. Add the same environment variables (from `.env.local`) in **Project
   Settings → Environment Variables**.
3. Deploy. Done.

### Netlify
1. Import the repo; Netlify auto-detects Next.js (`@netlify/plugin-nextjs`).
2. Add the environment variables in **Site settings → Environment variables**.
3. Deploy.

> Without Supabase env vars, a deployed site still works but runs in Local
> Demo Mode (each visitor has their own browser copy). Add the Supabase vars
> for a single shared tier list.

---

## 🗂️ Project structure

```
.
├── app/
│   ├── layout.tsx              # Fonts (Orbitron/Rajdhani) + ambient background
│   ├── globals.css             # System theme: grid, glow, glass, scanlines
│   ├── page.tsx                # Public tier list page
│   ├── admin/page.tsx          # Auth-gated admin (login OR dashboard)
│   └── api/
│       ├── auth/{login,logout,me}/route.ts
│       └── mice/route.ts       # GET (public) · POST (admin)
│           └── [id]/route.ts   # PATCH · DELETE (admin)
├── components/
│   ├── PublicApp.tsx           # Session provider + public shell
│   ├── Header.tsx  Footer.tsx  TurkishFlag.tsx  ModeBadge.tsx
│   ├── HeaderAuthControls.tsx  SessionProvider.tsx
│   ├── Tierlist.tsx  TierRow.tsx  MouseCard.tsx  SystemWindow.tsx
│   ├── MouseAvatar.tsx  DefaultMouse.tsx   # TFM mouse avatar
│   ├── MouseLoginModal.tsx  MouseDetailModal.tsx
│   ├── RatingSummary.tsx  VotePanel.tsx    # voting UI
│   ├── AdminLogin.tsx  AdminPanel.tsx  MouseForm.tsx  AdminVotesPanel.tsx
├── lib/
│   ├── types.ts  tiers.ts  ratings.ts  seed.ts  config.ts
│   ├── api.ts                  # Client data layer: roster + logins + votes
│   ├── store.ts                # Server data layer (Supabase)
│   ├── supabase.ts  auth.ts
├── supabase/schema.sql
├── .env.local.example
└── tailwind.config.ts  next.config.js  tsconfig.json
```

---

## ⚙️ Customization

- **Ranks / colors:** edit [`lib/tiers.ts`](lib/tiers.ts).
- **Starter roster:** edit [`lib/seed.ts`](lib/seed.ts).
- **Theme:** tweak CSS variables and utilities in [`app/globals.css`](app/globals.css)
  and colors in [`tailwind.config.ts`](tailwind.config.ts).
- **Admin password:** set `ADMIN_PASSWORD` in `.env.local`.

---

*Fan project for the Transformice Survivor community. Not affiliated with
Atelier 801.*
