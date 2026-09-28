import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory or database store for backend demonstration
let mockDB = {
  teacher: {
    id: 'teacher-1',
    name: 'M. Thomas Bernard',
    email: 't.bernard@education.gouv.fr',
    school: 'Collège & Lycée Victor Hugo',
    subject: 'Mathématiques & Sciences',
  },
  classes: [
    {
      id: 'class-3b',
      name: '3ème B',
      level: '3ème',
      subject: 'Mathématiques',
      academicYear: '2024-2025',
      room: 'Salle 204',
      color: '#3B82F6',
    },
    {
      id: 'class-4a',
      name: '4ème A',
      level: '4ème',
      subject: 'Mathématiques',
      academicYear: '2024-2025',
      room: 'Salle 204',
      color: '#10B981',
    }
  ],
  students: [],
  assessments: [],
  grades: [],
  attendance: []
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ProfPilot API', timestamp: new Date().toISOString() });
});

// Classes
app.get('/api/classes', (req, res) => {
  res.json(mockDB.classes);
});

app.post('/api/classes', (req, res) => {
  const newClass = { id: `class-${Date.now()}`, ...req.body };
  mockDB.classes.push(newClass);
  res.status(201).json(newClass);
});

// Authentification
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    res.json({
      token: 'jwt-mock-token-profpilot',
      teacher: mockDB.teacher
    });
  } else {
    res.status(400).json({ error: 'Identifiants requis' });
  }
});

// Serve frontend in production if built
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Standalone start if run directly
if (process.env.RUN_SERVER === 'true') {
  app.listen(PORT, () => {
    console.log(`Serveur ProfPilot actif sur le port ${PORT}`);
  });
}

export default app;
