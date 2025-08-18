// scripts/api-client.js - Frontend API client để connect với MongoDB backend
// ...existing code...

// Add playlist to MongoDB
export async function savePlaylist(playlist) {
  // Đảm bảo tracks là mảng id string, loại bỏ tiền tố mongo_ nếu có, không phải stringified array
  if (playlist.tracks && Array.isArray(playlist.tracks)) {
    playlist.tracks = playlist.tracks.map(t => {
      let id = typeof t === 'string' ? t : t.id || t._id;
      if (typeof id === 'string' && id.startsWith('mongo_')) id = id.replace('mongo_', '');
      return id;
    }).filter(Boolean);
  }
  return await window.apiClient.apiCall('/playlists', {
    method: 'POST',
    body: JSON.stringify(playlist)
  });
}

// Update playlist in MongoDB
ApiClient.prototype.updatePlaylist = async function(playlistId, playlist) {
  return await this.apiCall(`/playlists/${playlistId}`, {
    method: 'PUT',
    body: JSON.stringify(playlist)
  });
};

// Get user's playlists from MongoDB
ApiClient.prototype.getMyPlaylists = async function() {
  return await this.apiCall('/playlists/my');
};
