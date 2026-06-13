# Galla

![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15%2B-blue)

## Overview
Galla is a modern web application built with **Next.js** (v15) and **TypeScript**. It uses **MongoDB** via **Mongoose** for data storage and provides an interactive UI powered by **React**, **Framer Motion**, **Lucide‑React**, **Recharts**, and **Zod** for schema validation. The project follows best practices for performance, type‑safety, and developer experience.

## Tech Stack
- **Framework:** Next.js (React) – server‑side rendering, file‑system routing
- **Language:** TypeScript (strict, `tsc --noEmit` for type‑checking)
- **Database:** MongoDB accessed through Mongoose
- **Styling & Animation:** Tailwind CSS (optional), Framer Motion
- **Icons:** Lucide‑React
- **Charts:** Recharts
- **Validation:** Zod
- **Build Tooling:** Vercel/Node, npm scripts

## Prerequisites
- **Node.js** >= 20.x (recommended)
- **npm** (comes with Node) or **yarn**
- **MongoDB** instance (local or remote) with a connection URI

## Getting Started
```bash
# Clone the repository (replace with actual repo URL)
git clone https://github.com/yourusername/Galla.git
cd Galla

# Install dependencies
npm install
```

### Environment Variables
Create a `.env.local` file at the project root and add the following variables:
```
MONGODB_URI=your-mongodb-connection-string
# Add any other env vars your app needs here
```
> **Note:** The `.env.local` file is ignored by Git and should never be committed.

## Database Connection
The helper `connectToMongoDB()` (see `src/lib/db/mongodb.ts`) establishes a cached Mongoose connection. It reads the `MONGODB_URI` from the environment and throws an informative error if the variable is missing.
```ts
import { connectToMongoDB } from "@/lib/db/mongodb";
await connectToMongoDB(); // Call early in your app (e.g., in a Next.js API route or _app.tsx)
```

## Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Starts the development server on **port 3000** (`next dev -p 3000`). |
| `npm run build` | Compiles the application for production (`next build`). |
| `npm start` | Runs the production build (`next start`). |
| `npm run typecheck` | Runs TypeScript's type checker without emitting files (`tsc --noEmit`). |

## Development Workflow
1. **Run the dev server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.
2. **Edit code** – Next.js hot‑reloads changes.
3. **Run type‑checking** occasionally:
   ```bash
   npm run typecheck
   ```
4. **Commit** your changes following conventional commits.

## Building for Production
```bash
npm run build   # Generates the `.next` folder
npm start       # Serves the built app
```
Deploy the `/.next` folder and static assets to your preferred host (Vercel, Netlify, Docker, etc.).

## Contributing
Contributions are welcome! Follow these steps:
1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/awesome-feature
   ```
3. Install dependencies and make your changes.
4. Ensure the code passes linting and type‑checking:
   ```bash
   npm run typecheck
   ```
5. Open a Pull Request with a clear description of your changes.

## License
This project is licensed under the **MIT License** – see the `LICENSE` file for details.

---