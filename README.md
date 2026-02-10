# DevTree

A developer portfolio platform that showcases your live projects with automated performance metrics, tech stack detection, and GitHub integration.

**Live Demo:** [https://devtree.vercel.app](https://devtree.vercel.app)  
**Example Profile:** [/example](https://devtree.vercel.app/example)

## Features

### Profile & links
- **Custom profiles**: Username (unique URL), display name, bio, avatar, and background image
- **Theme customization**: Colors (background, text, button, button hover), Google Fonts, and background image
- **Link management**: Add, edit, and delete links (projects) with title, URL, description, tech stack, role (Frontend/Backend/Full Stack), and optional GitHub URL
- **Link ordering**: Links displayed in configurable order
- **Username availability**: Check availability before creating or updating profile
- **Public profile page**: Responsive profile at `/{username}` with theme applied and project cards
- **Project detail page**: Dedicated page per project at `/{username}/projects/{projectId}` with full metrics

### Projects & metrics
- **Project showcase**: Display live projects with screenshot previews and status (live/down/slow/unknown)
- **Lighthouse integration**: Performance, accessibility, best practices, and SEO scores (run via “Validate” on a link)
- **GitHub metrics**: Stars, last commit date, and last commit message (optional GitHub URL on link)
- **Tech stack detection**: From repository (e.g. package.json, requirements.txt, go.mod)
- **Screenshot capture**: Visual previews stored in Cloudflare R2
- **Link validation**: Validate project URL (screenshot + optional Lighthouse + GitHub fetch)

### Analytics & tracking
- **Profile view tracking**: Increment view count when public profile is loaded
- **Link click tracking**: Increment click count when a link is opened
- **Analytics dashboard**: Total profile views, total link clicks, and per-link click counts

### Auth & media
- **Authentication**: Sign up, login, and session via NextAuth.js (JWT from backend)
- **Image upload**: Avatar and background image upload to R2
- **Image delete**: Remove avatar or background image and clear from profile

## Tech stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI**: Radix UI (Label, Slot) + custom components (Button, Card, Input, Modal, ColorPicker, AvatarUpload, BackgroundUpload, ProjectCard)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Drag and drop**: @dnd-kit (core, sortable, utilities)
- **Auth**: NextAuth.js

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript (ESM)
- **Database**: MongoDB with Mongoose
- **Auth**: JWT (jsonwebtoken), bcrypt for passwords
- **Storage**: Cloudflare R2 (S3-compatible, via @aws-sdk/client-s3)
- **Screenshot**: Puppeteer
- **Lighthouse**: lighthouse
- **GitHub**: GitHub API (fetch repo metrics)
- **Logging**: Pino

### Infrastructure
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas
- **Object storage**: Cloudflare R2

## Project structure

```
linktree/
├── frontend/                 # Next.js app
│   ├── app/
│   │   ├── [username]/       # Public profile & project detail
│   │   ├── api/auth/        # NextAuth route
│   │   ├── dashboard/       # Dashboard, profile, links, analytics
│   │   ├── login/ signup/
│   │   └── ...
│   ├── components/ui/        # Reusable UI components
│   └── lib/api.ts            # Backend API client
├── backend/
│   └── src/
│       ├── config/          # DB connection
│       ├── controllers/     # Auth, profile, link, upload, GitHub
│       ├── middleware/      # JWT auth
│       ├── models/          # User, Profile, Link (Mongoose)
│       ├── routes/          # API routes
│       ├── services/        # Screenshot, R2, Lighthouse, GitHub
│       └── utils/           # Logger, types
├── PRD.md
├── DEVELOPMENT_SCHEDULE.md
└── README.md
```

## Getting started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Cloudflare R2 bucket (or any S3-compatible storage)
- (Optional) GitHub Personal Access Token for higher rate limits

### Frontend

```bash
cd frontend
npm install

# .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

```bash
npm run dev
```

Runs at `http://localhost:3000`.

### Backend

```bash
cd backend
npm install

# .env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/devtree
JWT_SECRET=your-jwt-secret

# R2 (S3-compatible)
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=devtree-images
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Optional
GITHUB_API_TOKEN=your-github-token
```

```bash
npm run dev
```

Runs at `http://localhost:3001`.

### Production build

**Frontend**
```bash
cd frontend && npm run build && npm start
```

**Backend**
```bash
cd backend && npm run build && npm start
```

## Environment variables

### Frontend (`.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API base URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret | Yes |
| `NEXTAUTH_URL` | App URL for auth callbacks | Yes |

### Backend (`.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default 3001) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID | Yes |
| `R2_ACCESS_KEY_ID` | R2 access key | Yes |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | Yes |
| `R2_BUCKET_NAME` | R2 bucket name | No |
| `R2_PUBLIC_URL` | Public URL for R2 objects | No |
| `GITHUB_API_TOKEN` | GitHub token (higher limits) | No |

## API reference

### Health
- `GET /health` – Service and MongoDB status

### Auth
- `POST /api/auth/signup` – Register
- `POST /api/auth/login` – Login
- `GET /api/auth/me` – Current user (requires auth)

### Profile
- `GET /api/profile/check/username?username=...` – Check username availability
- `POST /api/profile` – Create profile (auth)
- `GET /api/profile` – Get own profile (auth)
- `PUT /api/profile` – Update profile (auth)
- `GET /api/profile/track/:username` – Track profile view (public)
- `GET /api/profile/:username` – Get public profile by username

### Links
- `GET /api/links/public/:username` – Public links for username
- `GET /api/links/track/:id` – Track link click (public)
- `POST /api/links` – Create link (auth)
- `GET /api/links` – List own links (auth)
- `PUT /api/links/:id` – Update link (auth)
- `DELETE /api/links/:id` – Delete link (auth)
- `POST /api/links/:id/validate` – Run screenshot + optional Lighthouse + GitHub (auth)

### GitHub
- `POST /api/github/fetch` – Fetch repo metrics (auth, body: `{ githubUrl }`)

### Upload
- `POST /api/upload?type=avatar|background` – Upload image (auth, multipart)
- `DELETE /api/upload` – Delete image by URL (auth, body: `{ url }`)

## How it works

### Screenshot
1. User adds/edits a link with a URL and triggers “Validate”.
2. Backend uses Puppeteer to open the URL and capture a screenshot.
3. Image is uploaded to R2; public URL is saved on the link.

### Lighthouse
1. Triggered from “Validate” on a link (optional, or part of validation flow).
2. Puppeteer + Lighthouse produce Performance, Accessibility, Best Practices, SEO scores.
3. Scores and timestamp are stored on the link.

### GitHub metrics
1. User optionally adds a GitHub repo URL to a link.
2. “Validate” or GitHub fetch calls the backend with that URL.
3. Backend fetches repo info (stars, recent commit) and tech stack from dependency files/topics.
4. Results are stored on the link.

### Tech stack detection
- Scans repo for `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml`, etc.
- Supports monorepos (multiple package files).
- Infers role (Frontend/Backend/Full Stack) from dependencies and structure.

## Documentation

- **[PRD.md](./PRD.md)** – Product requirements and feature scope
- **[DEVELOPMENT_SCHEDULE.md](./DEVELOPMENT_SCHEDULE.md)** – Learning-focused development plan

## Development

- **Lint/format**: Biome (`npm run lint`, `npm run format` in frontend or backend)
- **TypeScript**: Strict typing in both apps

## Known limitations

- **Render free tier**: Backend can cold start (e.g. 30–60s after idle).
- **GitHub**: Without token, 60 req/h; with token, 5,000 req/h.
- **Lighthouse**: Can take 10–30s per run; run via “Validate” when needed.
- **Puppeteer**: Needs enough memory (e.g. 512MB+).

## License

MIT

## Author

**Abhinav Verma**  
- GitHub: [@myselfabhi](https://github.com/myselfabhi)  
- DevTree: [devtree.vercel.app/myselfabhi](https://devtree.vercel.app/myselfabhi)

---

**Note:** The backend on Render’s free tier may take 30–60 seconds to respond after a period of inactivity.
