// Transcription Monitor Configuration Example
// Copy this file to config.js and modify as needed

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development'
  },

  // WebSocket Configuration
  websocket: {
    heartbeatInterval: 30000, // 30 seconds
    maxPayloadSize: 1048576, // 1MB
    reconnectAttempts: 5,
    reconnectDelay: 1000
  },

  // Audio Configuration
  audio: {
    defaultSampleRate: 16000,
    defaultChannels: 1,
    maxRecordingTime: 300000, // 5 minutes
    supportedFormats: ['wav', 'mp3', 'ogg', 'webm']
  },

  // Transcription Configuration
  transcription: {
    defaultLanguage: 'en-US',
    confidenceThreshold: 0.7,
    latencyWarningThreshold: 500, // ms
    accuracyTarget: 0.9
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFiles: 10,
    maxSize: '10m',
    format: 'combined'
  },

  // Security Configuration
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    rateLimitWindow: 900000, // 15 minutes
    rateLimitMaxRequests: 100
  },

  // Development Configuration
  development: {
    enableHotReload: true,
    enableDebugLogging: true,
    mockTranscription: true
  }
};
