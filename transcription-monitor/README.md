# Real-time Transcription Monitor

A modern web application for monitoring real-time transcription accuracy and latency using WebSocket technology. This application provides a beautiful interface similar to professional transcription services with real-time metrics, audio visualization, and comprehensive logging.

## Features

### 🎯 **Real-time Monitoring**
- Live transcription accuracy tracking
- Latency measurement and trending
- Confidence score monitoring
- Real-time performance charts

### 🔌 **WebSocket Integration**
- Bi-directional communication with transcription servers
- Real-time audio streaming
- Instant feedback and updates
- Connection status monitoring

### 🎵 **Audio Processing**
- Live audio recording and streaming
- Configurable sample rates and channels
- Real-time audio visualization
- Support for various audio formats

### 📊 **Analytics Dashboard**
- Interactive charts using Chart.js
- Trend analysis for all metrics
- Historical data tracking
- Export functionality for data analysis

### 🎨 **Modern UI/UX**
- Responsive design for all devices
- Glassmorphism design elements
- Tabbed interface for organization
- Professional color scheme and typography

## Screenshots

The application features a clean, modern interface with:
- **Left Panel**: Configuration, Analytics, and Logs tabs
- **Right Panel**: Real-time transcription output with audio controls
- **Header**: Connection status and application title
- **Footer**: System status and version information

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **WebSocket**: ws library
- **Charts**: Chart.js
- **Styling**: Custom CSS with modern design principles
- **Audio**: Web Audio API, MediaRecorder API

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- Modern web browser with WebSocket support
- Microphone access for audio recording

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd transcription-monitor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file (optional):**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Usage

### Starting the Server

1. **Development mode (with auto-reload):**
   ```bash
   npm run dev
   ```

2. **Production mode:**
   ```bash
   npm start
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

### Accessing the Application

- **Server**: http://localhost:3001
- **Frontend**: http://localhost:3000 (when using webpack dev server)

### Configuration

1. **Connection Settings:**
   - Server URL: WebSocket endpoint for your transcription service
   - API Key: Authentication key for the service
   - Language: Target language for transcription

2. **Audio Settings:**
   - Sample Rate: Audio quality (8kHz - 48kHz)
   - Channels: Mono or Stereo recording

### Using the Application

1. **Connect to Server:**
   - Fill in server URL and API key
   - Click "Connect" button
   - Wait for connection confirmation

2. **Start Recording:**
   - Click "Start Recording" button
   - Allow microphone access when prompted
   - Speak into your microphone

3. **Monitor Metrics:**
   - Switch to "Analytics" tab to view real-time charts
   - Monitor accuracy, latency, and confidence trends
   - View system logs in the "Logs" tab

4. **Export Data:**
   - Export transcription results as JSON
   - Export system logs for analysis
   - Download performance metrics

## API Integration

The application is designed to work with transcription services that support WebSocket communication. To integrate with your service:

### WebSocket Message Format

**Outgoing Messages:**
```json
{
  "type": "audio_data",
  "data": {
    "audio": [/* audio data array */],
    "timestamp": 1234567890,
    "sampleRate": 16000,
    "channels": 1
  }
}
```

**Incoming Messages:**
```json
{
  "type": "transcription_result",
  "data": {
    "text": "Transcribed text",
    "confidence": 0.95,
    "latency": 150,
    "accuracy": 0.92,
    "timestamp": 1234567890
  }
}
```

### Supported Message Types

- `transcription_result`: Final transcription with metrics
- `accuracy_metrics`: Accuracy performance data
- `latency_metrics`: Latency performance data
- `configuration`: Initial setup parameters

## Development

### Project Structure

```
transcription-monitor/
├── public/                 # Static files
│   ├── index.html         # Main HTML file
│   ├── styles.css         # CSS styles
│   └── app.js            # Frontend JavaScript
├── server/                # Backend server
│   └── index.js          # Express server and WebSocket
├── package.json           # Dependencies and scripts
├── webpack.config.js      # Webpack configuration
└── README.md             # This file
```

### Available Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm run build`: Build frontend for production
- `npm run build:dev`: Build frontend for development

### Customization

- **Styling**: Modify `public/styles.css` for visual changes
- **Functionality**: Edit `public/app.js` for frontend logic
- **Server**: Modify `server/index.js` for backend changes
- **Configuration**: Update `webpack.config.js` for build settings

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed:**
   - Check server URL format (ws:// or wss://)
   - Verify server is running and accessible
   - Check firewall and network settings

2. **Microphone Access Denied:**
   - Ensure browser has microphone permissions
   - Check system microphone settings
   - Try refreshing the page

3. **Audio Not Recording:**
   - Verify WebSocket connection is established
   - Check browser console for errors
   - Ensure audio devices are properly configured

4. **Charts Not Updating:**
   - Check if Chart.js is loaded correctly
   - Verify data is being received
   - Check browser console for JavaScript errors

### Debug Mode

Enable detailed logging by opening browser console and checking:
- WebSocket connection status
- Audio recording events
- Data transmission logs
- Error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review browser console logs
- Verify WebSocket server configuration
- Ensure all dependencies are properly installed

## Future Enhancements

- **Multi-language Support**: Additional language packs
- **Advanced Analytics**: Machine learning insights
- **Cloud Integration**: AWS, Azure, Google Cloud support
- **Mobile App**: React Native or Flutter version
- **Real-time Collaboration**: Multi-user transcription sessions
- **Custom Models**: User-specific transcription models
