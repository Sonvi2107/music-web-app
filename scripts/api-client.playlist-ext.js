// scripts/api-client.js - Frontend API client để connect với MongoDB backend
// ...existing code...

// Add playlist to MongoDB
export async function savePlaylist(playlist) {
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
