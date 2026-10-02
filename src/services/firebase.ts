import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Classroom,
  Student,
  Assessment,
  Grade,
  AttendanceSession,
  AttendanceRecord,
  Teacher
} from '../types';

// Initialisation de Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Base de données Firestore avec l'ID provisionné
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

// Test de connexion obligatoire selon la directive
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Client Firestore hors-ligne ou configuration à vérifier.");
    }
  }
}

// Lancer le test au démarrage
testFirestoreConnection();

// Identifiant unique d'appareil pour éviter les boucles d'écho locales
export function getDeviceId(): string {
  let id = localStorage.getItem('profpilot_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('profpilot_device_id', id);
  }
  return id;
}

export interface CloudWorkspacePayload {
  teacher?: Teacher;
  classes: Classroom[];
  students: Student[];
  assessments: Assessment[];
  grades: Grade[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  lastUpdated: string;
  senderDeviceId: string;
}

// Authentification
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

export async function logoutCloud(): Promise<void> {
  await signOut(auth);
}

// Enregistrement vers le Cloud Firestore
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function pushWorkspaceToCloud(
  userId: string,
  data: {
    teacher?: Teacher;
    classes: Classroom[];
    students: Student[];
    assessments: Assessment[];
    grades: Grade[];
    attendanceSessions: AttendanceSession[];
    attendanceRecords: AttendanceRecord[];
  }
): void {
  if (saveTimeout) clearTimeout(saveTimeout);

  // Debounce léger (300ms) pour regrouper les frappes rapides tout en restant en temps réel
  saveTimeout = setTimeout(async () => {
    try {
      const deviceId = getDeviceId();
      const userRef = doc(db, 'teachers', userId);
      const payload: CloudWorkspacePayload = {
        ...data,
        lastUpdated: new Date().toISOString(),
        senderDeviceId: deviceId,
      };

      await setDoc(userRef, payload, { merge: true });
    } catch (err) {
      console.error("Erreur lors de l'envoi vers Cloud Firestore:", err);
    }
  }, 300);
}

// Écoute des mises à jour en direct (temps réel)
export function listenToCloudWorkspace(
  userId: string,
  onRemoteUpdate: (data: CloudWorkspacePayload) => void
): () => void {
  const userRef = doc(db, 'teachers', userId);
  const currentDeviceId = getDeviceId();

  const unsubscribe = onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CloudWorkspacePayload;
        // Si la mise à jour vient d'un AUTRE appareil (ex: téléphone vers PC ou PC vers téléphone), on met à jour
        if (data.senderDeviceId !== currentDeviceId) {
          onRemoteUpdate(data);
        }
      }
    },
    (err) => {
      console.warn("Erreur d'écoute Firestore:", err);
    }
  );

  return unsubscribe;
}

// Récupération initiale lors de la première connexion
export async function fetchInitialCloudWorkspace(userId: string): Promise<CloudWorkspacePayload | null> {
  try {
    const userRef = doc(db, 'teachers', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as CloudWorkspacePayload;
    }
    return null;
  } catch (err) {
    console.error("Erreur lors de la récupération initiale:", err);
    return null;
  }
}
