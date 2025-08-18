
import { $, $$, toast } from './utils.js';
import { session, data, demo } from './storage.js';
import { Player } from './player.js';
import { createVisualizer } from './visualizer.js';
import { PlaylistsUI } from './playlists.js';
import './api-client.playlist-ext.js';
import { UI } from './ui.js';

const player = Player();
const playlists = PlaylistsUI(player);
const ui = UI(player, playlists);
window.currentUI = ui;
window.player = player; 

async function onLoggedIn(username) {

  window.currentUser = username;

  if (window.apiClient && window.apiClient.isLoggedIn()) {
    try {
      const res = await window.apiClient.getMyPlaylists();
      if (res && Array.isArray(res.playlists)) {
        const playlistsObj = {};
        for (const pl of res.playlists) {
          playlistsObj[pl.id || pl._id] = pl;
        }
        const d = data.get(username);
        d.playlists = playlistsObj;
        data.set(username, d);
      }
    } catch (e) {
      console.warn('Không thể đồng bộ playlist từ DB:', e);
    }
  }

  player.setUser(username);
  playlists.setUser(username);
  ui.setUser(username);
  await demo.ensureDemo(username);
  ui.renderLibrary();

  const d = data.get(username);
  document.documentElement.setAttribute('data-theme', d.settings.theme || 'dark');
  document.getElementById('volume').value = d.settings.volume ?? 0.8;
  document.getElementById('audio').volume = parseFloat(document.getElementById('volume').value);
  document.getElementById('hello-name').textContent = d.settings.name || username;

  session.set({ username });

  document.getElementById('btn-logout').onclick = () => {
    if (window.authUI) {
      window.authUI.handleLogout();
    } else {
      localStorage.removeItem('flowplay.session');
      location.reload();
    }
  };

  createVisualizer(document.getElementById('audio'), document.getElementById('viz'));

  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const r = btn.dataset.route;
      ['home', 'library', 'playlists', 'settings'].forEach(name =>
        document.getElementById('view-' + name).hidden = (name !== r)
      );
    });
  });
}

function init() {
  const s = session.current();
  if (s?.username) {
    onLoggedIn(s.username);
  } else {
    onLoggedIn('guest');
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-sync-playlists');
    if (btn) {
      btn.onclick = () => {
        if (window.syncAllPlaylistsToDB) window.syncAllPlaylistsToDB();
      };
    }
  });
}

init();

// --- SHARE LIBRARY & PLAYLISTS ---
import { showShareModal } from './share.js';

// Share library
$('#btn-share-library')?.addEventListener('click', async () => {
  const user = window.currentUser || 'guest';
  const d = data.get(user);
  const tracks = [];
  for (const id of d.library) {
    const t = await idb.getTrack(id);
    if (t) tracks.push(t);
  }
  const blob = new Blob([JSON.stringify(tracks, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  showShareModal(url);
});

// Share all playlists
$('#btn-share-playlists')?.addEventListener('click', () => {
  const user = window.currentUser || 'guest';
  const d = data.get(user);
  const playlists = d.playlists || {};
  const blob = new Blob([JSON.stringify(playlists, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  showShareModal(url);
});


// Share current playlist (detail view)
$('#pl-share')?.addEventListener('click', () => {
  const user = window.currentUser || 'guest';
  const d = data.get(user);
  const plId = document.querySelector('#playlist-detail').dataset.id;
  if (!plId || !d.playlists[plId]) return toast('Không tìm thấy playlist!');
  const playlist = d.playlists[plId];
  // Nếu playlist có trường isPublic=true và có _id (đã sync lên DB), chia sẻ link public
  if (playlist.isPublic && playlist._id) {
    const url = `${window.location.origin}/api/playlists/${playlist._id}`;
    showShareModal(url);
  } else {
    // Nếu chưa public hoặc chưa có _id, fallback về blob như cũ
    const blob = new Blob([JSON.stringify(playlist, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    showShareModal(url);
  }
});

// Save playlist to MongoDB
async function savePlaylistToDB() {
  const user = window.currentUser || 'guest';
  const d = data.get(user);
  const plId = document.querySelector('#playlist-detail').dataset.id;
  if (!plId || !d.playlists[plId]) return toast('Không tìm thấy playlist!');
  const playlist = d.playlists[plId];
  try {
    if (!window.apiClient.isLoggedIn()) {
      toast('Bạn cần đăng nhập để lưu playlist lên MongoDB!');
      return;
    }
    await window.apiClient.savePlaylist(playlist);
    toast('Đã lưu playlist lên MongoDB!');
  } catch (e) {
    toast('Lỗi khi lưu playlist lên MongoDB: ' + (e.message || e));
  }
}

$('#pl-save-db')?.addEventListener('click', savePlaylistToDB);
