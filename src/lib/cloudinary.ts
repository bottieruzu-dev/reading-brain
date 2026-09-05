// File: src/lib/cloudinary.ts
import { Platform } from 'react-native';

const CLOUD = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET;

export const cloudinaryReady = !!CLOUD && !!PRESET;

export async function uploadImage(uri: string): Promise<string> {
  if (!cloudinaryReady) throw new Error('Cloudinaryの設定（.env）が未入力です');
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, 'cover.jpg');
  } else {
    form.append('file', { uri, type: 'image/jpeg', name: 'cover.jpg' } as any);
  }
  form.append('upload_preset', PRESET as string);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const json = await res.json();
  if (!json.secure_url) throw new Error(json?.error?.message || 'アップロードに失敗しました');
  return json.secure_url as string;
}