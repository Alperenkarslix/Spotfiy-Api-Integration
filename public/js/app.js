document.getElementById('spotifyConnect').onclick = () => {
    window.location.href = '/spotify/auth';
};

// Show error message if present in URL
const urlParams = new URLSearchParams(window.location.search);
const error = urlParams.get('error');
if (error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.display = 'block';
    errorDiv.textContent = decodeURIComponent(error);
    document.querySelector('.container').insertBefore(errorDiv, document.querySelector('.container').firstChild);
}

// Get playlist select element
const playlistSelect = document.getElementById('playlistSelect');
const addToPlaylistButton = document.getElementById('addToPlaylist');

// Enable/disable Add to Playlist button based on selection
playlistSelect.addEventListener('change', () => {
    addToPlaylistButton.disabled = !playlistSelect.value;
});

// Action button event listeners
document.getElementById('playTrack').onclick = async () => {
    try {
        const response = await fetch('/spotify/play-track', { method: 'POST' });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        showSuccess('Playing track...');
        // Wait a moment for the track to start playing
        setTimeout(updateTrackInfo, 1000);
    } catch (error) {
        showError(error.message);
    }
};

document.getElementById('addToPlaylist').onclick = async () => {
    const selectedPlaylistId = playlistSelect.value;
    if (!selectedPlaylistId) {
        showError('Please select a playlist first');
        return;
    }

    try {
        const response = await fetch('/spotify/add-to-playlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                playlistId: selectedPlaylistId
            })
        });
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        
        showSuccess(data.message || 'Track added to playlist successfully!');
        // Refresh playlists display after successful addition
        setTimeout(updateData, 1000);
    } catch (error) {
        showError(error.message);
    }
};

document.getElementById('followArtist').onclick = async () => {
    try {
        const response = await fetch('/spotify/follow-artist', { method: 'POST' });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        showSuccess('Artist followed!');
    } catch (error) {
        showError(error.message);
    }
};

document.getElementById('followPlaylist').onclick = async () => {
    try {
        const response = await fetch('/spotify/follow-playlist', { method: 'POST' });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        showSuccess('Playlist followed!');
    } catch (error) {
        showError(error.message);
    }
};

document.getElementById('addToFavorites').onclick = async () => {
    try {
        const response = await fetch('/spotify/add-to-favorites', { method: 'POST' });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        showSuccess('Added to favorites!');
    } catch (error) {
        showError(error.message);
    }
};

function showError(message) {
    const errorDiv = document.querySelector('.error-message') || document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    if (!document.querySelector('.error-message')) {
        document.querySelector('.container').insertBefore(errorDiv, document.querySelector('.container').firstChild);
    }
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.querySelector('.success-message') || document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    if (!document.querySelector('.success-message')) {
        document.querySelector('.container').insertBefore(successDiv, document.querySelector('.container').firstChild);
    }
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

function displayProfile(profile) {
    const container = document.getElementById('profileData');
    container.innerHTML = `
        <div class="profile-info">
            <img src="${profile.images[0]?.url || '/default-avatar.png'}" alt="Profile Picture">
            <div class="profile-details">
                <h3>${profile.display_name}</h3>
                <p>${profile.email}</p>
                <p>Followers: ${profile.followers.total}</p>
                <p>Country: ${profile.country}</p>
            </div>
        </div>
    `;
}

function displayCurrentTrack(track) {
    const container = document.getElementById('spotifyData');
    if (!track) {
        container.innerHTML = '<p>No music is currently playing.</p>';
        return;
    }

    const progress = track.progress_ms / track.duration_ms * 100;
    const minutes = Math.floor(track.progress_ms / 60000);
    const seconds = Math.floor((track.progress_ms % 60000) / 1000);
    const totalMinutes = Math.floor(track.duration_ms / 60000);
    const totalSeconds = Math.floor((track.duration_ms % 60000) / 1000);

    container.innerHTML = `
        <div class="track-info">
            <img src="${track.image}" alt="Album Art">
            <div class="track-details">
                <p class="track-name">${track.name}</p>
                <p class="track-artist">by ${track.artist}</p>
                <p class="track-album">on ${track.album}</p>
                <div class="track-progress">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${progress}%"></div>
                    </div>
                    <div class="time-info">
                        <span>${minutes}:${seconds.toString().padStart(2, '0')}</span>
                        <span>${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}</span>
                    </div>
                    <p class="playback-state">${track.is_playing ? 'Playing' : 'Paused'}</p>
                </div>
            </div>
        </div>
    `;
}

function displayPlaylists(playlists) {
    // Update playlist dropdown
    playlistSelect.innerHTML = '<option value="">Select a playlist...</option>' +
        playlists.map(playlist => 
            `<option value="${playlist.id}">${playlist.name} (${playlist.tracks.total} tracks)</option>`
        ).join('');

    // Update playlists display
    const container = document.getElementById('playlistsData');
    if (!playlists || playlists.length === 0) {
        container.innerHTML = '<p>No playlists found.</p>';
        return;
    }

    container.innerHTML = '<div class="grid-list">' + 
        playlists.map(playlist => `
            <div class="grid-item">
                <img src="${playlist.images[0]?.url || '/default-playlist.png'}" alt="${playlist.name}">
                <h4>${playlist.name}</h4>
                <p>${playlist.tracks.total} tracks</p>
            </div>
        `).join('') + 
    '</div>';
}

function displayArtists(artists) {
    const container = document.getElementById('artistsData');
    if (!artists || artists.length === 0) {
        container.innerHTML = '<p>No followed artists found.</p>';
        return;
    }

    container.innerHTML = '<div class="grid-list">' + 
        artists.map(artist => `
            <div class="grid-item">
                <img src="${artist.images[0]?.url || '/default-artist.png'}" alt="${artist.name}">
                <h4>${artist.name}</h4>
                <p>${artist.followers.total.toLocaleString()} followers</p>
            </div>
        `).join('') + 
    '</div>';
}

// Separate function to update only track information
async function updateTrackInfo() {
    try {
        const response = await fetch('/spotify/data');
        const data = await response.json();

        if (typeof data.spotify === 'string') return;
        
        displayCurrentTrack(data.spotify.currentTrack);
    } catch (error) {
        console.error('Error fetching track data:', error);
    }
}

// Update track info every 3 seconds
let trackUpdateInterval = setInterval(updateTrackInfo, 3000);

async function updateData() {
    try {
        const response = await fetch('/spotify/data');
        const data = await response.json();

        if (typeof data.spotify === 'string') {
            // Not logged in
            document.getElementById('spotifyConnect').style.display = 'block';
            document.getElementById('userProfile').style.display = 'none';
            document.getElementById('currentlyPlaying').style.display = 'none';
            document.getElementById('actions').style.display = 'none';
            document.getElementById('playlists').style.display = 'none';
            document.getElementById('artists').style.display = 'none';
            
            // Clear track update interval if user is not logged in
            clearInterval(trackUpdateInterval);
            return;
        }

        // Hide connect button and show all sections
        document.getElementById('spotifyConnect').style.display = 'none';
        document.getElementById('userProfile').style.display = 'block';
        document.getElementById('currentlyPlaying').style.display = 'block';
        document.getElementById('actions').style.display = 'block';
        document.getElementById('playlists').style.display = 'block';
        document.getElementById('artists').style.display = 'block';

        // Update all sections
        displayProfile(data.spotify.profile);
        displayCurrentTrack(data.spotify.currentTrack);
        displayPlaylists(data.spotify.playlists);
        displayArtists(data.spotify.followedArtists);

        // Start track updates if not already started
        if (!trackUpdateInterval) {
            trackUpdateInterval = setInterval(updateTrackInfo, 3000);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        showError('Failed to fetch data from Spotify');
    }
}

// Add CSS for progress bar
const style = document.createElement('style');
style.textContent = `
    .track-progress {
        margin-top: 10px;
    }
    .progress-bar {
        width: 100%;
        height: 4px;
        background-color: #ddd;
        border-radius: 2px;
        margin: 5px 0;
    }
    .progress {
        height: 100%;
        background-color: #1db954;
        border-radius: 2px;
        transition: width 0.3s ease;
    }
    .time-info {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #666;
    }
    .playback-state {
        font-size: 12px;
        color: #1db954;
        margin: 5px 0 0;
    }
`;
document.head.appendChild(style);

// Remove setInterval for updateData
// Initial data load only
updateData(); 