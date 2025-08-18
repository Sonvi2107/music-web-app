// Playlist import by link logic for FlowPlay
// This script adds UI and logic to import a playlist from a public link
import { savePlaylist } from './api-client.playlist-ext.js';
import { showToast } from './ui.js';

function showImportPlaylistModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'import-playlist-modal';
  modal.innerHTML = `
    <div class="modal-card">
      <h2>Nhập Playlist từ Link</h2>
      <div class="row">
        <input id="import-playlist-link" placeholder="Dán link chia sẻ playlist..." style="flex:1;" />
        <button class="btn" id="btn-import-playlist-go">Nhập</button>
      </div>
      <div class="row" style="margin-top:14px; gap:8px;">
        <button class="btn ghost" id="btn-close-import-playlist">Đóng</button>
      </div>
      <div id="import-playlist-status" style="margin-top:10px;color:var(--muted);"></div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';

  document.getElementById('btn-close-import-playlist').onclick = () => {
    modal.remove();
  };
  document.getElementById('btn-import-playlist-go').onclick = async () => {
    const link = document.getElementById('import-playlist-link').value.trim();
    if (!link) return;
    const status = document.getElementById('import-playlist-status');
    status.textContent = 'Đang tải playlist...';
    try {
      // Extract playlist id from link
      const m = link.match(/playlists\/(\w+)/);
      if (!m) throw new Error('Link không hợp lệ.');
      const id = m[1];
      const res = await fetch(`/api/playlists/${id}`);
      if (!res.ok) throw new Error('Không tìm thấy playlist.');
      const playlist = await res.json();
      // Đảm bảo tracks là mảng id string, loại bỏ tiền tố mongo_ nếu có, không phải stringified array
      if (playlist.tracks && Array.isArray(playlist.tracks)) {
        playlist.tracks = playlist.tracks.map(t => {
          let id = typeof t === 'string' ? t : t.id || t._id;
          if (typeof id === 'string' && id.startsWith('mongo_')) id = id.replace('mongo_', '');
          return id;
        }).filter(Boolean);
      }
      await savePlaylist(playlist);
      status.textContent = 'Đã nhập playlist thành công!';
      showToast('Đã nhập playlist!', 'success');
      setTimeout(() => modal.remove(), 1200);
    } catch (e) {
      status.textContent = e.message || 'Lỗi khi nhập playlist.';
    }
  };
}

// Add import button to playlist view
document.addEventListener('DOMContentLoaded', () => {
  const toolbar = document.querySelector('#view-playlists .toolbar');
  if (toolbar && !document.getElementById('btn-import-playlist')) {
    const btn = document.createElement('button');
    btn.className = 'btn ghost';
    btn.id = 'btn-import-playlist';
    btn.innerHTML = '<img src="assets/icons/add.svg" width="16" height="16" /> Nhập playlist từ link';
    btn.onclick = showImportPlaylistModal;
    toolbar.appendChild(btn);
  }
});
