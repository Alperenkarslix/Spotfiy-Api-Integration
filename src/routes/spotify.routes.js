const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const SpotifyService = require('../services/spotify.service');

let spotifyData = {};

router.get('/auth', (req, res) => {
    const scopes = [
        'user-read-private',
        'user-read-email',
        'user-read-currently-playing',
        'user-modify-playback-state',
        'user-read-playback-state',
        'playlist-modify-public',
        'playlist-modify-private',
        'user-follow-modify',
        'user-library-modify',
        'user-follow-read',
        'user-library-read',
        'playlist-read-private',
        'playlist-read-collaborative'
    ];

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
        client_id: process.env.SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: `${process.env.REDIRECT_URI}/spotify/callback`,
        scope: scopes.join(' '),
    })}`;
    res.redirect(spotifyAuthUrl);
});

router.get('/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const tokenData = await SpotifyService.getAccessToken(code);
        const accessToken = tokenData.access_token;

        // Get user profile
        const profile = await SpotifyService.getUserProfile(accessToken);
        
        // Initialize user data
        spotifyData[profile.id] = {
            profile,
            accessToken,
            currentTrack: null,
            playlists: [],
            followedArtists: []
        };

        // Get additional data
        try {
            spotifyData[profile.id].playlists = await SpotifyService.getUserPlaylists(accessToken);
        } catch (error) {
            console.error('Error fetching playlists:', error.message);
        }

        try {
            spotifyData[profile.id].followedArtists = await SpotifyService.getFollowedArtists(accessToken);
        } catch (error) {
            console.error('Error fetching followed artists:', error.message);
        }

        // Update track info every 3 seconds
        setInterval(async () => {
            try {
                const trackInfo = await SpotifyService.getCurrentTrack(accessToken);
                if (trackInfo) {
                    spotifyData[profile.id].currentTrack = trackInfo;
                }
            } catch (error) {
                console.error('Error retrieving Spotify data:', error.message);
            }
        }, 3000);

        res.redirect('/');
    } catch (error) {
        console.error('Spotify API error:', error.message);
        res.redirect('/?error=' + encodeURIComponent(error.message));
    }
});

router.get('/data', (req, res) => {
    const lastUser = Object.values(spotifyData)[Object.values(spotifyData).length - 1];
    res.json({ spotify: lastUser || 'Not logged in' });
});

// Action endpoints
router.post('/play-track', async (req, res) => {
    try {
        const lastUser = Object.values(spotifyData)[Object.values(spotifyData).length - 1];
        if (!lastUser) throw new Error('Not logged in');

        await SpotifyService.playTrack(lastUser.accessToken, process.env.SPOTIFY_TRACK_ID);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/add-to-playlist', async (req, res) => {
    try {
        const lastUser = Object.values(spotifyData)[Object.values(spotifyData).length - 1];
        if (!lastUser) throw new Error('Not logged in');

        const { playlistId } = req.body;
        if (!playlistId) throw new Error('No playlist selected');

        const result = await SpotifyService.addToPlaylist(
            lastUser.accessToken,
            playlistId,
            process.env.SPOTIFY_TRACK_ID
        );

        res.json({ 
            success: true, 
            message: result.message || 'Track added to playlist successfully' 
        });
    } catch (error) {
        console.error('Add to playlist error:', error.message);
        res.status(error.response?.status || 500).json({ 
            success: false,
            error: error.message 
        });
    }
});

router.post('/follow-artist', async (req, res) => {
    try {
        const lastUser = Object.values(spotifyData)[Object.values(spotifyData).length - 1];
        if (!lastUser) throw new Error('Not logged in');

        if (!process.env.SPOTIFY_ARTIST_ID) {
            throw new Error('Artist ID not configured');
        }

        const result = await SpotifyService.followArtist(
            lastUser.accessToken, 
            process.env.SPOTIFY_ARTIST_ID
        );

        res.json({ 
            success: true,
            message: result.message || 'Artist followed successfully'
        });
    } catch (error) {
        console.error('Follow artist error:', error.message);
        res.status(error.response?.status || 500).json({ 
            success: false,
            error: error.message 
        });
    }
});

router.post('/follow-playlist', async (req, res) => {
    try {
        const lastUser = Object.values(spotifyData)[Object.values(spotifyData).length - 1];
        if (!lastUser) throw new Error('Not logged in');

        await SpotifyService.followPlaylist(lastUser.accessToken, process.env.SPOTIFY_PLAYLIST_ID);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/add-to-favorites', async (req, res) => {
    try {
        const lastUser = Object.values(spotifyData)[Object.values(spotifyData).length - 1];
        if (!lastUser) throw new Error('Not logged in');

        await SpotifyService.addToFavorites(lastUser.accessToken, process.env.SPOTIFY_TRACK_ID);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 