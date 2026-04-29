import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './config'

export async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  const photoRef = ref(storage, `profiles/${uid}/avatar`)
  await uploadBytes(photoRef, file)
  return getDownloadURL(photoRef)
}
