# Find the Spy — Frontend Handover

## What This Is

A World MiniApp frontend for the hackathon demo **"Find the Spy"** — a multi-agent AI simulation where one of 20 agents is a disinformation spy, detected and traced back to a human deployer via on-chain accountability (ERC-8004 + World ID).

---

## Running Locally

```bash
cd world-mini-app
npm install
npm run dev
# Open http://localhost:5173
```

The app renders as a 390×844 px phone shell centred in the browser on any screen wider than 500 px.

**Production build:**
```bash
npm run build
# Output: world-mini-app/dist/
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript |
| Build | Vite 5 |
| Styling | Custom CSS (`src/styles/global.css`) + Tailwind v4 utility reset |
| Fonts | Space Mono (headings) · DM Sans (body) · Source Code Pro (mono/tags) — Google Fonts CDN |
| World ID | `@worldcoin/minikit-js` v1.11 |
| Chain reads | `viem` v2 (Ethereum Sepolia) |
| Data storage | IPFS via Lighthouse (static CIDs — no runtime pinning needed) |
| Simulation data | Pre-generated JSON files in `public/data/` |

---

## Directory Structure

```
world-mini-app/
├── public/
│   ├── data/
│   │   ├── agents.json           ← 20 agent profiles (handle, bio, category, token ID, isSpy)
│   │   ├── detection_report.json ← OpenClaw output: flagged agent + trace chain
│   │   ├── cycle_01.json … cycle_10.json
│   │   ├── cleansed_corpus.json
│   │   └── ipfs_manifest.json
│   └── SKILL.md                  ← AgentRoot Detection skill documentation
│
├── src/
│   ├── App.tsx                   ← Root: 6-tab navigation + "i" info button
│   ├── styles/global.css         ← Design system (all CSS variables, layout, animations)
│   │
│   ├── components/
│   │   ├── TabBar.tsx            ← 6 icon-only tabs
│   │   ├── InfoModal.tsx         ← "How it Works" overlay (5 system components)
│   │   ├── AgentCard.tsx         ← Reusable agent profile card with deployer chain
│   │   ├── LinkButton.tsx        ← Orange pill buttons that open external URLs
│   │   └── StatusBadge.tsx       ← Verified / Spy / Flagged badges
│   │
│   ├── hooks/
│   │   └── useWorldId.ts         ← World ID verification hook (live + mock fallback)
│   │
│   └── screens/
│       ├── WorldIdScreen.tsx     ← Screen 1: Identity / verify to deploy
│       ├── AgentScreen.tsx       ← Screen 2: Agent profile + All 20 Agents roster
│       ├── SimulationScreen.tsx  ← Screen 3: OASIS simulation results + demo cycle
│       ├── DetectionScreen.tsx   ← Screen 4: OpenClaw detection results (94.7%)
│       ├── TraceScreen.tsx       ← Screen 5: Accountability chain to human deployer
│       └── ChatScreen.tsx        ← Screen 6: Prompt chat with verified agents
```

---

## Screen-by-Screen Summary

### 01 — World ID (`WorldIdScreen.tsx`)
Animated World ID orb, member tree (4 humans → 20 agents), nullifier hash display.

**Two buttons:**
- **"Verify with World ID"** — calls `useWorldId().verify()` → navigates to Agent screen on success
- **"Simulate for demo"** — same flow but always succeeds (mock mode)

On success, navigates to the Agent tab via `navigate('agent')` prop.

---

### 02 — Agent Profile (`AgentScreen.tsx`)
Shows the user's deployed agent (hardcoded: Diplomat Agent, Token #1).

Top button **"All 20 Agents →"** fetches `GET /data/agents.json` and renders a full-screen scrollable roster of all 20 agents with category badges, token IDs, and the spy marked in red.

---

### 03 — Simulation (`SimulationScreen.tsx`)
Displays completed OASIS simulation stats (10 cycles, 147 posts, 312 actions, 20 agents).

**"▶ Run Demo Cycle" button:**
- Currently: 2 s fake delay → appends a new CYCLE 11 post from `@def_analyst_sarah` to Thread #4 with a green "NEW · CYCLE 11" badge.
- **TODO for dev:** replace the `setTimeout` in `runDemoCycle()` with a real API call:
  ```ts
  // Line ~43 in SimulationScreen.tsx
  // TODO: replace with POST /api/run-cycle?key={API_KEY}
  setTimeout(() => { ... }, 2000)
  ```

---

### 04 — Detection (`DetectionScreen.tsx`)
OpenClaw (Claude Opus) analysis: 20-agent grid, @eli_cohen flagged at 94.7% confidence, 3 violations.

**"OpenClaw Skill" link** → opens `/SKILL.md` (served from `public/SKILL.md`).

---

### 05 — Accountability Trace (`TraceScreen.tsx`)
5-step chain: Agent → ERC-8004 Token → Wallet → World ID Nullifier → Verified Human (Member 4, GUILTY).

All addresses and IPFS CIDs are real values from `detection_report.json`.

---

### 06 — Verified Chat (`ChatScreen.tsx`)
Prompt interface backed by static keyword-matched responses from verified agents.

- Typing or sending a question → user bubble appears, then agent response bubble with tappable handle chips
- Tapping a handle chip → opens a centered `AgentProfileModal` (fetched from `agents.json`)
- Each response includes inline IPFS/source links
- 3 suggested prompts shown before first message

**No live LLM call** — all responses are static matches. To wire live responses, replace `matchResponse()` with an API call.

---

## What the Dev Needs to Wire Up

### 1. World ID Live Verification
**File:** `src/hooks/useWorldId.ts`

Currently the `verify()` function calls `MiniKit.commandsAsync.verify()` when inside the World App. This is already correct MiniKit API usage. The dev needs to:

1. Register an action in the [Worldcoin Developer Portal](https://developer.worldcoin.org)
2. Create a `.env` file in `world-mini-app/`:
   ```
   VITE_WORLD_ACTION=your-action-id-here
   ```
3. Register the app and get an **App ID** for MiniKit. In `src/main.tsx` (or wherever `MiniKitProvider` is initialised), set the app ID:
   ```tsx
   <MiniKitProvider appId="app_your_id_here">
   ```
4. The live button on WorldIdScreen calls `verify()` → if `MiniKit.isInstalled()` returns true (i.e. running inside World App), real Orb verification fires. If not installed, the mock flow runs automatically — no code change needed.

---

### 2. Demo Cycle API
**File:** `src/screens/SimulationScreen.tsx`, function `runDemoCycle()` (~line 43)

```ts
// Current placeholder:
setTimeout(() => {
  setDemoState('done')
  setPosts(prev => [...prev, newCyclePost])
}, 2000)

// Replace with:
const res = await fetch('/api/run-cycle', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_KEY}` },
})
const data = await res.json()
setDemoState('done')
// Optionally map data.posts to new Post objects and append
setPosts(prev => [...prev, newCyclePost])
```

The `newCyclePost` constant above the component can be replaced with data from the API response.

---

### 3. World Mini App Deployment

To deploy as an actual World Mini App:

1. Build: `npm run build` → outputs to `dist/`
2. Host `dist/` on any static host (Vercel, Netlify, GitHub Pages, etc.)
3. Register the hosted URL in the [Worldcoin Developer Portal](https://developer.worldcoin.org) → Mini Apps section
4. Ensure `VITE_WORLD_ACTION` is set in the build environment
5. Test inside the World App using the dev preview link from the portal

**Note:** The "Simulate for demo" button on the World ID screen allows judges/viewers to experience the full flow without the World App installed.

---

## Key Addresses & IPFS CIDs

| Resource | Value |
|----------|-------|
| Spy agent | `@eli_cohen` (Agent #20) |
| ERC-8004 Registry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` (Sepolia) |
| Spy token contract | `0xDA4ea461551c88d9c8c993f0765bee8e892Bdeb7` (Sepolia) |
| Deployer wallet | `0x29390B1ccDa9f99c6dd225773b7246F7515a7Bbe` |
| World ID Nullifier | `0x0c988e7b2b555a18808d0d1ca04ddd638dfcd0388f8db5233d82c1891348da18` |
| IPFS Detection Report | `QmSGrZWYuVdrqcYGxokSaMVG8kUFkKQ4sAeistZDJpiiRd` |
| IPFS Cleansed Corpus | `QmYpNUh6HPYthzXjJLJUqB2zrvCaCvzGTZ4toC4pdi8JxS` |
| IPFS Cycle 02 | `QmNPKDx6hthy3wEsqWwqW3WKNXtrdoJukVbuR5wNtPaCBg` |
| IPFS Agents JSON | `QmNxLtv8hz9s7rYQoKMrynnTKzjrHJCqLLuggWb2KhPJ2w` |
| IPFS Gateway | `https://gateway.lighthouse.storage/ipfs/{CID}` |

---

## Design System Reference

All design tokens are in `src/styles/global.css` under `:root`.

| Token | Value | Used for |
|-------|-------|----------|
| `--orange` | `#C2522B` | Primary brand colour |
| `--bg-cream` | `#F5F0E8` | App background |
| `--phone-text` | `#1A1A1F` | Primary text |
| `--spy-red` | `#E74C3C` | Spy / danger states |
| `--verified-green` | `#27AE60` | Verified / clean states |

Fonts loaded from Google Fonts CDN — ensure internet access or self-host for production.

---

## Environment Variables

Create `world-mini-app/.env`:

```env
VITE_WORLD_ACTION=your-worldcoin-action-id
```

That is the only env variable currently used. All blockchain addresses and IPFS CIDs are hardcoded in the screen files (they are stable, immutable values).

---

## Known Limitations / Notes

- **Chat responses are static.** `matchResponse()` in `ChatScreen.tsx` uses keyword matching. For live LLM responses, replace it with an API call to your backend.
- **SKILL.md is served as a static file** from `public/SKILL.md`. If deploying to a CDN that strips `.md` files, upload it to IPFS and update the URL in `DetectionScreen.tsx`.
- **Bundle size** is ~584 KB (gzipped: ~174 KB) due to `viem` and `@worldcoin/minikit-js`. This is expected for a crypto-integrated app.
- **The "Simulate for demo" button** always uses the mock nullifier `0x7f2a…d41e`. The real nullifier is only generated when running inside the World App with a real Orb-verified user.
