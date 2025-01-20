# Spotify API Integration Example

## Project Overview
This repository demonstrates a web application that integrates with the Spotify API, allowing users to connect their Spotify accounts, view their profile, play tracks, manage playlists, and follow artists or playlists.

---

## Features
- **Connect to Spotify**: Authorize the application to access your Spotify account.
- **View Profile**: Display user information such as name, email, followers, and country.
- **Currently Playing**: Show details of the currently playing track.
- **Playlist Management**:
  - View user playlists.
  - Add tracks to playlists.
  - Follow playlists.
- **Artist Management**:
  - View followed artists.
  - Follow new artists.
- **Track Management**:
  - Play a specific track.
  - Add tracks to favorites.

---

## Installation

### Prerequisites
- Node.js (v14 or above)
- Spotify Developer Account

### Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd api-test
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and configure the following variables:
   ```env
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   REDIRECT_URI=http://localhost:3000
   SPOTIFY_TRACK_ID=default_track_id
   SPOTIFY_ARTIST_ID=default_artist_id
   SPOTIFY_PLAYLIST_ID=default_playlist_id
   ```
4. Start the application:
   - Development mode:
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm run start
     ```
5. Access the application in your browser at `http://localhost:3000`.

---

## File Structure

### Key Directories and Files

#### `src`
- **`app.js`**: Main server file that initializes the Express app and sets up routes and middleware.
- **`middleware/errorHandler.js`**: Handles application errors.
- **`routes/spotify.routes.js`**: Defines Spotify-related API routes and actions.
- **`services/spotify.service.js`**: Contains business logic for interacting with the Spotify API.
- **`utils/apiError.js`**: Custom error class for API responses.

#### `public`
- **`index.html`**: Main frontend file for user interaction.
- **`css/styles.css`**: Styling for the web application.
- **`js/app.js`**: Frontend logic for user interactions with the Spotify API.

#### `tests`
- **`spotify.test.js`**: Placeholder test file for Spotify service methods.

---

## Scripts

| Command        | Description                           |
|----------------|---------------------------------------|
| `npm start`    | Runs the application in production.   |
| `npm run dev`  | Starts the app with hot reloading.    |
| `npm test`     | Executes tests using Jest.            |

---

## Dependencies

### Core Dependencies
- **`express`**: Web framework for handling server-side routes and logic.
- **`axios`**: HTTP client for making API requests to Spotify.
- **`dotenv`**: Manages environment variables.

### Dev Dependencies
- **`jest`**: Testing framework.
- **`nodemon`**: Monitors changes and restarts the server during development.

---

## API Endpoints

### Authorization
- **`GET /spotify/auth`**: Redirects user to Spotify login page for authorization.
- **`GET /spotify/callback`**: Handles Spotify OAuth callback and initializes user data.

### User Data
- **`GET /spotify/data`**: Retrieves user profile, playlists, currently playing track, and followed artists.

### Actions
- **`POST /spotify/play-track`**: Plays a predefined track on the user’s device.
- **`POST /spotify/add-to-playlist`**: Adds a track to the selected playlist.
- **`POST /spotify/follow-artist`**: Follows a predefined artist.
- **`POST /spotify/follow-playlist`**: Follows a predefined playlist.
- **`POST /spotify/add-to-favorites`**: Adds a track to the user’s favorites.

---

## Development Notes
- **Testing**: Placeholder tests are included in `tests/spotify.test.js`. You can extend these to cover all API interactions and business logic.
- **Error Handling**: The `errorHandler` middleware ensures proper responses for errors.
- **Frontend Styling**: Custom CSS is used to style the application.
- **Real-time Updates**: The application periodically updates the currently playing track.

---

## Future Improvements
- Add comprehensive unit tests for all service methods.
- Implement user-specific session management.
- Enhance error messages for better user feedback.
- Add support for additional Spotify features, such as browsing new releases.

---

## License
This project is licensed under the ISC License.

