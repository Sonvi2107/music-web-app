// Dong bo tat ca playlist len MongoDB
import { data, session } from './storage.js';
import { savePlaylist } from './api-client.playlist-ext.js';
import { toast } from './utils.js';

export async function syncAllPlaylistsToDB() {
  const s = session.current();
  if (!s?.username) {
    toast('Bạn cần đăng nhập để đồng bộ playlist!', 'error');
    return;
  }
  const d = data.get(s.username);
  const playlists = Object.values(d.playlists || {});
  let ok = 0, fail = 0;
  for (const pl of playlists) {
    try {
      const tracks = (pl.trackIds || []).map(t => typeof t === 'string' ? t : t.id || t._id).filter(Boolean);
      await savePlaylist({
        name: pl.name,
        description: pl.description || '',
        tracks,
        isPublic: !!pl.isPublic,
        thumbnail: pl.thumbnail || ''
      });
      ok++;
    } catch (e) {
      fail++;
    }
  }
  toast(`Đã đồng bộ ${ok} playlist lên DB${fail ? ', lỗi ' + fail : ''}`);
}

// Gắn vào nút trên UI nếu muốn
window.syncAllPlaylistsToDB = syncAllPlaylistsToDB;
