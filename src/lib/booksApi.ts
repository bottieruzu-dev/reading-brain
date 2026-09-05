// File: src/lib/booksApi.ts
export type Found = { title: string; author: string; coverUrl: string | null };

// openBD（日本の書籍・無料・キー不要）
export async function fetchByIsbn(isbnRaw: string): Promise<Found | null> {
  const isbn = isbnRaw.replace(/[^0-9Xx]/g, '');
  if (isbn.length < 10) return null;
  try {
    const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`);
    const json = await res.json();
    const s = json?.[0]?.summary;
    if (!s) return null;
    return { title: s.title || '', author: s.author || '', coverUrl: s.cover || null };
  } catch (e) {
    return null;
  }
}

// Google Books（書名検索・無料・キー不要）
export async function searchByTitle(q: string): Promise<Found[]> {
  if (!q.trim()) return [];
  try {
    const url =
      'https://www.googleapis.com/books/v1/volumes?country=JP&maxResults=5&q=' +
      encodeURIComponent(q);
    const res = await fetch(url);
    const json = await res.json();
    const items = json?.items || [];
    return items.map((it: any) => {
      const v = it.volumeInfo || {};
      const img = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || null;
      return {
        title: v.title || '',
        author: (v.authors || []).join(', '),
        coverUrl: img ? String(img).replace('http://', 'https://') : null,
      };
    });
  } catch (e) {
    return [];
  }
}