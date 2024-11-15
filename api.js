const axios = require('axios');

// Spotify API
async function getSpotifyCurrentTrack(code) {
    const { data } = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
        code,
        redirect_uri: 'http://localhost:3000/callback',
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
        grant_type: 'authorization_code',
    }));
    
    const accessToken = data.access_token;
    
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    
    return response.data;
}

// Instagram API
async function getInstagramUserProfile(code) {
    const { data } = await axios.post('https://api.instagram.com/oauth/access_token', {
        client_id: INSTAGRAM_CLIENT_ID,
        client_secret: INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3000/instagram/callback',
        code,
    });
    
    return data;
}

// X API
async function getXUserProfile(oauthToken) {
    const response = await axios.get('https://api.twitter.com/2/users/by/username', {
        headers: {
            Authorization: `Bearer ${oauthToken}`,
        },
    });
    return response.data;
}

module.exports = { getSpotifyCurrentTrack, getInstagramUserProfile, getXUserProfile };
