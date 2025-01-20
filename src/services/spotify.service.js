const axios = require('axios');
const querystring = require('querystring');

class SpotifyService {
    static async getAccessToken(code) {
        try {
            const { data } = await axios.post('https://accounts.spotify.com/api/token', 
                querystring.stringify({
                    code,
                    redirect_uri: `${process.env.REDIRECT_URI}/spotify/callback`,
                    client_id: process.env.SPOTIFY_CLIENT_ID,
                    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
                    grant_type: 'authorization_code',
                }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });
            return data;
        } catch (error) {
            console.error('Token Error:', error.response?.data || error.message);
            throw new Error('Failed to get access token');
        }
    }

    static async refreshAccessToken(refreshToken) {
        try {
            const { data } = await axios.post('https://accounts.spotify.com/api/token',
                querystring.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: process.env.SPOTIFY_CLIENT_ID,
                    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
                }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });
            return data;
        } catch (error) {
            console.error('Token Refresh Error:', error.response?.data || error.message);
            throw new Error('Failed to refresh access token');
        }
    }

    static async makeApiRequest(accessToken, apiCall) {
        try {
            return await apiCall(accessToken);
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Token expired or invalid');
            }
            throw error;
        }
    }

    static async getAvailableDevices(accessToken) {
        return this.makeApiRequest(accessToken, async (token) => {
            const response = await axios.get('https://api.spotify.com/v1/me/player/devices', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data.devices;
        });
    }

    static async transferPlayback(accessToken, deviceId) {
        return this.makeApiRequest(accessToken, async (token) => {
            await axios.put('https://api.spotify.com/v1/me/player', {
                device_ids: [deviceId],
                play: false
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        });
    }

    static async getUserProfile(accessToken) {
        return this.makeApiRequest(accessToken, async (token) => {
            const response = await axios.get('https://api.spotify.com/v1/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data;
        });
    }

    static async getCurrentTrack(accessToken) {
        return this.makeApiRequest(accessToken, async (token) => {
            const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            
            if (response.data && response.data.item) {
                return {
                    id: response.data.item.id,
                    name: response.data.item.name,
                    artist: response.data.item.artists[0].name,
                    album: response.data.item.album.name,
                    image: response.data.item.album.images[0].url,
                    duration_ms: response.data.item.duration_ms,
                    progress_ms: response.data.progress_ms,
                    is_playing: response.data.is_playing
                };
            }
            return null;
        });
    }

    static async playTrack(accessToken, trackId) {
        return this.makeApiRequest(accessToken, async (token) => {
            // First, get available devices
            const devices = await this.getAvailableDevices(token);
            
            if (!devices || devices.length === 0) {
                throw new Error('No available devices found. Please open Spotify on any device.');
            }

            // Prefer active device, otherwise use the first available one
            const device = devices.find(d => d.is_active) || devices[0];

            // Transfer playback to the selected device
            await this.transferPlayback(token, device.id);

            // Wait a bit for the transfer to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Now play the track
            await axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${device.id}`, {
                uris: [`spotify:track:${trackId}`]
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        });
    }

    static async addToPlaylist(accessToken, playlistId, trackId) {
        return this.makeApiRequest(accessToken, async (token) => {
            try {
                // First check if we can access the playlist
                const playlistResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                // Check if we have write access (we are the owner or the playlist is collaborative)
                const userProfile = await this.getUserProfile(token);
                const canEdit = playlistResponse.data.owner.id === userProfile.id || 
                               playlistResponse.data.collaborative;

                if (!canEdit) {
                    throw new Error('You do not have permission to modify this playlist');
                }

                // Check if track already exists in playlist
                const tracksResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: {
                        fields: 'items(track(uri))',
                    },
                });

                const trackUri = `spotify:track:${trackId}`;
                const trackExists = tracksResponse.data.items.some(item => item.track.uri === trackUri);

                if (trackExists) {
                    throw new Error('This track is already in the playlist');
                }

                // Add the track to playlist
                await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                    uris: [trackUri]
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                return { success: true, message: 'Track added to playlist successfully' };
            } catch (error) {
                if (error.response?.status === 404) {
                    throw new Error('Playlist not found');
                }
                if (error.response?.status === 403) {
                    throw new Error('You do not have permission to modify this playlist');
                }
                throw error;
            }
        });
    }

    static async followArtist(accessToken, artistId) {
        return this.makeApiRequest(accessToken, async (token) => {
            try {
                // First check if already following
                const checkResponse = await axios.get(`https://api.spotify.com/v1/me/following/contains`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    params: {
                        type: 'artist',
                        ids: artistId
                    }
                });

                if (checkResponse.data[0]) {
                    return { message: 'You are already following this artist' };
                }

                // Follow the artist
                await axios.put(`https://api.spotify.com/v1/me/following`, {
                    ids: [artistId]
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        type: 'artist'
                    }
                });

                return { message: 'Artist followed successfully' };
            } catch (error) {
                if (error.response?.status === 404) {
                    throw new Error('Artist not found');
                }
                throw error;
            }
        });
    }

    static async followPlaylist(accessToken, playlistId) {
        return this.makeApiRequest(accessToken, async (token) => {
            await axios.put(`https://api.spotify.com/v1/playlists/${playlistId}/followers`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        });
    }

    static async addToFavorites(accessToken, trackId) {
        return this.makeApiRequest(accessToken, async (token) => {
            await axios.put('https://api.spotify.com/v1/me/tracks', {
                ids: [trackId]
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        });
    }

    static async getUserPlaylists(accessToken) {
        return this.makeApiRequest(accessToken, async (token) => {
            const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data.items;
        });
    }

    static async getFollowedArtists(accessToken) {
        return this.makeApiRequest(accessToken, async (token) => {
            const response = await axios.get('https://api.spotify.com/v1/me/following?type=artist', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data.artists.items;
        });
    }
}

module.exports = SpotifyService; 