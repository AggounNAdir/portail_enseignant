import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ProfPilot API', timestamp: new Date().toISOString() });
});

// Serve frontend static assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start listening unconditionally on 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur ProfPilot actif sur http://0.0.0.0:${PORT}`);
});

export default app;
