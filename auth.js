const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

let sessionData = {
    spotify: null,
    instagram: null,
    x: null,
};

// Statik dosyaları sunmak için "express.static" kullanıyoruz
app.use(express.static(__dirname));

// Ana sayfa rotası, saklanan verileri istemciye gönderir
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/data', (req, res) => {
    res.json(sessionData);
});

// Spotify Authentication
app.get('/spotify/auth', (req, res) => {
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
        client_id: process.env.SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: `${process.env.REDIRECT_URI}/spotify/callback`,
        scope: 'user-read-currently-playing',
    })}`;
    res.redirect(spotifyAuthUrl);
});

// Spotify Callback ve müzik bilgisini güncelleme
app.get('/spotify/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
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

        const accessToken = tokenResponse.data.access_token;

        // Müzik bilgisini her 3 saniyede bir almak için
        setInterval(async () => {
            try {
                const currentlyPlayingResponse = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (currentlyPlayingResponse.data && currentlyPlayingResponse.data.item) {
                    sessionData.spotify = `Currently playing: ${currentlyPlayingResponse.data.id} ${currentlyPlayingResponse.data.item.name} by ${currentlyPlayingResponse.data.item.artists[0].name}`;
                } else {
                    sessionData.spotify = 'No music is currently playing.';
                }
            } catch (error) {
                console.error('Error retrieving Spotify data:', error);
            }
        }, 3000);

        res.redirect('/');
    } catch (error) {
        console.error('Spotify API error:', error.response ? error.response.data : error.message);
        res.redirect('/');
    }
});

// Instagram Authentication
app.get('/instagram/auth', (req, res) => {
    const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?${querystring.stringify({
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        redirect_uri: `${process.env.REDIRECT_URI}/instagram/callback`,
        scope: 'user_profile,user_media',
        response_type: 'code',
    })}`;
    res.redirect(instagramAuthUrl);
});

// Instagram Callback
app.get('/instagram/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
            client_id: process.env.INSTAGRAM_CLIENT_ID,
            client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: `${process.env.REDIRECT_URI}/instagram/callback`,
            code,
        });

        const accessToken = tokenResponse.data.access_token;

        // Instagram API üzerinden takip edilen hesapları burada çekebilirsiniz
        sessionData.instagram = 'Takip edilen hesaplar listesi burada gösterilecek.';
        
        res.redirect('/');
    } catch (error) {
        console.error('Instagram API error:', error.response ? error.response.data : error.message);
        res.redirect('/');
    }
});

// X (Twitter) Authentication
app.get('/x/auth', (req, res) => {
    const xAuthUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${process.env.X_CLIENT_ID}`;
    res.redirect(xAuthUrl);
});

// X Callback
app.get('/x/callback', async (req, res) => {
    sessionData.x = 'Takip edilen hesaplar listesi burada gösterilecek.';
    res.redirect('/');
});

// Sunucuyu başlatıyoruz
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
