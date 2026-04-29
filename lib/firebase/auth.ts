import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from './config'
import { createUserProfile, getUserProfile } from './db'

export async function signIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  // Firestore ops are best-effort — auth succeeds regardless
  try {
    const existing = await getUserProfile(cred.user.uid)
    if (!existing) {
      await createUserProfile(cred.user.uid, {
        name: email.split('@')[0],
        email,
        role: 'dev',
      })
    }
  } catch (err) {
    console.warn('[DevTrack] Firestore unavailable during signIn (check rules):', err)
  }
  return cred.user
}

export async function signUp(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  // Firestore write is best-effort — auth account is always created first
  try {
    await createUserProfile(cred.user.uid, { name, email, role: 'dev' })
  } catch (err) {
    console.error('[DevTrack] Firestore profile write failed:', err)
  }
  return cred.user
}

export async function signOut() {
  await firebaseSignOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export { type User }
