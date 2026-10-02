import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
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

// Clé de synchronisation Cloud inter-appareils (Téléphone ⇄ PC)
const SYNC_KEY_STORAGE = 'profpilot_cloud_sync_key';
const SYNC_ENABLED_STORAGE = 'profpilot_cloud_sync_enabled';

export function getStoredSyncKey(): string {
  let key = localStorage.getItem(SYNC_KEY_STORAGE);
  if (!key) {
    // Clé mémorisable par défaut pour M. Nadir Aggoun
    key = 'AGGOUN-2026';
    localStorage.setItem(SYNC_KEY_STORAGE, key);
  }
  return key;
}

export function setStoredSyncKey(key: string): string {
  const clean = key.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') || 'AGGOUN-2026';
  localStorage.setItem(SYNC_KEY_STORAGE, clean);
  return clean;
}

export function isCloudSyncEnabled(): boolean {
  return localStorage.getItem(SYNC_ENABLED_STORAGE) === 'true';
}

export function setCloudSyncEnabled(enabled: boolean): void {
  localStorage.setItem(SYNC_ENABLED_STORAGE, enabled ? 'true' : 'false');
}

export interface CloudWorkspacePayload {
  syncKey: string;
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

// Enregistrement vers le Cloud Firestore (debounced 300ms)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function pushWorkspaceToCloud(
  syncKey: string,
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
  if (!syncKey) return;
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(async () => {
    try {
      const deviceId = getDeviceId();
      const workspaceRef = doc(db, 'workspaces', syncKey);
      const payload: CloudWorkspacePayload = {
        syncKey,
        ...data,
        lastUpdated: new Date().toISOString(),
        senderDeviceId: deviceId,
      };

      await setDoc(workspaceRef, payload, { merge: true });
    } catch (err) {
      console.error("Erreur lors de l'envoi vers Cloud Firestore:", err);
    }
  }, 300);
}

// Écoute des modifications en temps réel (onSnapshot) depuis l'autre appareil
export function listenToCloudWorkspace(
  syncKey: string,
  onRemoteUpdate: (data: CloudWorkspacePayload) => void
): () => void {
  if (!syncKey) return () => {};

  const workspaceRef = doc(db, 'workspaces', syncKey);
  const currentDeviceId = getDeviceId();

  const unsubscribe = onSnapshot(
    workspaceRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CloudWorkspacePayload;
        // Mettre à jour uniquement si la modification vient de l'autre appareil
        if (data.senderDeviceId !== currentDeviceId) {
          onRemoteUpdate(data);
        }
      }
    },
    (err) => {
      console.warn("Erreur d'écoute temps réel Firestore:", err);
    }
  );

  return unsubscribe;
}

// Récupération initiale lors de la connexion
export async function fetchInitialCloudWorkspace(syncKey: string): Promise<CloudWorkspacePayload | null> {
  if (!syncKey) return null;
  try {
    const workspaceRef = doc(db, 'workspaces', syncKey);
    const snap = await getDoc(workspaceRef);
    if (snap.exists()) {
      return snap.data() as CloudWorkspacePayload;
    }
    return null;
  } catch (err) {
    console.error("Erreur lors de la récupération initiale:", err);
    return null;
  }
}
