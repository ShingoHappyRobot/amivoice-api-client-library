// Transcription Monitor Application
class TranscriptionMonitor {
    constructor() {
        this.ws = null;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.analyser = null;
        this.isRecording = false;
        this.isConnected = false;
        this.transcriptionHistory = [];
        this.metricsHistory = {
            accuracy: [],
            latency: [],
            confidence: []
        };
        
        this.initializeElements();
        this.bindEvents();
        this.initializeCharts();
        this.addLog('info', 'Application initialized');
    }

    initializeElements() {
        // Connection elements
        this.connectionIndicator = document.getElementById('connectionIndicator');
        this.connectionText = document.getElementById('connectionText');
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        
        // Configuration elements
        this.serverUrl = document.getElementById('serverUrl');
        this.apiKey = document.getElementById('apiKey');
        this.language = document.getElementById('language');
        
        // Audio elements
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.audioCanvas = document.getElementById('audioCanvas');
        
        // Tab elements
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Transcription elements
        this.transcriptionContainer = document.getElementById('transcriptionContainer');
        this.clearTranscriptionBtn = document.getElementById('clearTranscriptionBtn');
        this.exportTranscriptionBtn = document.getElementById('exportTranscriptionBtn');
        
        // Metrics elements
        this.accuracyValue = document.getElementById('accuracyValue');
        this.latencyValue = document.getElementById('latencyValue');
        this.confidenceValue = document.getElementById('confidenceValue');
        this.accuracyTrend = document.getElementById('accuracyTrend');
        this.latencyTrend = document.getElementById('latencyTrend');
        this.confidenceTrend = document.getElementById('confidenceTrend');
        
        // Log elements
        this.logContainer = document.getElementById('logContainer');
        this.clearLogsBtn = document.getElementById('clearLogsBtn');
        this.exportLogsBtn = document.getElementById('exportLogsBtn');
        
        // Status elements
        this.statusInfo = document.getElementById('statusInfo');
    }

    bindEvents() {
        // Connection events
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
        
        // Tab events
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Audio events
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        
        // Control events
        this.clearTranscriptionBtn.addEventListener('click', () => this.clearTranscription());
        this.exportTranscriptionBtn.addEventListener('click', () => this.exportTranscription());
        this.clearLogsBtn.addEventListener('click', () => this.clearLogs());
        this.exportLogsBtn.addEventListener('click', () => this.exportLogs());
        
        // Form events
        this.serverUrl.addEventListener('input', () => this.validateConnection());
        this.apiKey.addEventListener('input', () => this.validateConnection());
    }

    switchTab(tabName) {
        // Remove active class from all tabs and contents
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    async connect() {
        if (!this.validateConnection()) {
            this.addLog('error', 'Please fill in all required fields');
            return;
        }

        try {
            this.updateConnectionStatus('connecting');
            this.addLog('info', 'Attempting to connect...');
            
            const url = this.serverUrl.value;
            this.ws = new WebSocket(url);
            
            this.ws.onopen = () => {
                this.isConnected = true;
                this.updateConnectionStatus('connected');
                this.addLog('info', 'WebSocket connection established');
                this.enableRecording();
                
                // Send initial configuration
                this.ws.send(JSON.stringify({
                    type: 'configuration',
                    data: {
                        language: this.language.value,
                        apiKey: this.apiKey.value
                    }
                }));
            };
            
            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event.data);
            };
            
            this.ws.onclose = () => {
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                this.addLog('warning', 'WebSocket connection closed');
                this.disableRecording();
            };
            
            this.ws.onerror = (error) => {
                this.addLog('error', `WebSocket error: ${error.message}`);
                this.updateConnectionStatus('disconnected');
            };
            
        } catch (error) {
            this.addLog('error', `Connection failed: ${error.message}`);
            this.updateConnectionStatus('disconnected');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.updateConnectionStatus('disconnected');
        this.disableRecording();
        this.addLog('info', 'Disconnected from server');
    }

    updateConnectionStatus(status) {
        this.connectionIndicator.className = `status-indicator ${status}`;
        
        switch (status) {
            case 'connected':
                this.connectionText.textContent = 'Connected';
                this.connectBtn.disabled = true;
                this.disconnectBtn.disabled = false;
                this.statusInfo.textContent = 'Ready for transcription';
                break;
            case 'connecting':
                this.connectionText.textContent = 'Connecting...';
                this.connectBtn.disabled = true;
                this.disconnectBtn.disabled = true;
                this.statusInfo.textContent = 'Establishing connection...';
                break;
            case 'disconnected':
                this.connectionText.textContent = 'Disconnected';
                this.connectBtn.disabled = false;
                this.disconnectBtn.disabled = true;
                this.statusInfo.textContent = 'Not connected';
                break;
        }
    }

    validateConnection() {
        const isValid = this.serverUrl.value.trim() && this.apiKey.value.trim();
        this.connectBtn.disabled = !isValid;
        return isValid;
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: parseInt(document.getElementById('sampleRate').value),
                    channelCount: parseInt(document.getElementById('channels').value)
                } 
            });
            
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioContext = new AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            
            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && this.isConnected) {
                    this.sendAudioData(event.data);
                }
            };
            
            this.mediaRecorder.start(100); // Send data every 100ms
            this.isRecording = true;
            
            this.recordBtn.disabled = true;
            this.stopBtn.disabled = false;
            
            this.addLog('info', 'Recording started');
            this.statusInfo.textContent = 'Recording...';
            
            // Start audio visualization
            this.startAudioVisualization(dataArray, bufferLength);
            
        } catch (error) {
            this.addLog('error', `Failed to start recording: ${error.message}`);
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            
            if (this.audioContext) {
                this.audioContext.close();
            }
            
            this.isRecording = false;
            this.recordBtn.disabled = false;
            this.stopBtn.disabled = true;
            
            this.addLog('info', 'Recording stopped');
            this.statusInfo.textContent = 'Recording stopped';
        }
    }

    startAudioVisualization(dataArray, bufferLength) {
        const canvas = this.audioCanvas;
        const ctx = canvas.getContext('2d');
        
        const draw = () => {
            if (!this.isRecording) return;
            
            requestAnimationFrame(draw);
            
            this.analyser.getByteFrequencyData(dataArray);
            
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                
                ctx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }

    sendAudioData(audioBlob) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Convert audio blob to array buffer and send
            audioBlob.arrayBuffer().then(buffer => {
                this.ws.send(JSON.stringify({
                    type: 'audio_data',
                    data: {
                        audio: Array.from(new Uint8Array(buffer)),
                        timestamp: Date.now(),
                        sampleRate: parseInt(document.getElementById('sampleRate').value),
                        channels: parseInt(document.getElementById('channels').value)
                    }
                }));
            });
        }
    }

    handleWebSocketMessage(data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'transcription_result':
                    this.handleTranscriptionResult(message.data);
                    break;
                case 'accuracy_metrics':
                    this.handleAccuracyMetrics(message.data);
                    break;
                case 'latency_metrics':
                    this.handleLatencyMetrics(message.data);
                    break;
                default:
                    this.addLog('info', `Received message: ${message.type}`);
            }
        } catch (error) {
            this.addLog('error', `Failed to parse message: ${error.message}`);
        }
    }

    handleTranscriptionResult(data) {
        const transcriptionItem = {
            id: Date.now(),
            timestamp: new Date(data.timestamp).toLocaleTimeString(),
            text: data.text,
            confidence: data.confidence,
            latency: data.latency,
            accuracy: data.accuracy || 0.95
        };
        
        this.transcriptionHistory.push(transcriptionItem);
        this.displayTranscription(transcriptionItem);
        this.updateMetrics(data);
        this.addLog('info', `Transcription received: "${data.text.substring(0, 50)}..."`);
    }

    displayTranscription(item) {
        const transcriptionElement = document.createElement('div');
        transcriptionElement.className = 'transcription-item';
        transcriptionElement.innerHTML = `
            <div class="transcription-timestamp">${item.timestamp}</div>
            <div class="transcription-text">${item.text}</div>
            <div class="transcription-metrics">
                <div class="metric-item">
                    <i class="fas fa-bullseye"></i>
                    <span>Accuracy: ${(item.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div class="metric-item">
                    <i class="fas fa-clock"></i>
                    <span>Latency: ${item.latency}ms</span>
                </div>
                <div class="metric-item">
                    <i class="fas fa-chart-bar"></i>
                    <span>Confidence: ${(item.confidence * 100).toFixed(1)}%</span>
                </div>
            </div>
        `;
        
        // Remove placeholder if it exists
        const placeholder = this.transcriptionContainer.querySelector('.transcription-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        this.transcriptionContainer.appendChild(transcriptionElement);
        this.transcriptionContainer.scrollTop = this.transcriptionContainer.scrollHeight;
    }

    handleAccuracyMetrics(data) {
        this.metricsHistory.accuracy.push({
            value: data.accuracy,
            timestamp: Date.now()
        });
        
        // Keep only last 50 values
        if (this.metricsHistory.accuracy.length > 50) {
            this.metricsHistory.accuracy.shift();
        }
        
        this.updateAccuracyDisplay(data.accuracy);
        this.updateAccuracyChart();
    }

    handleLatencyMetrics(data) {
        this.metricsHistory.latency.push({
            value: data.latency,
            timestamp: Date.now()
        });
        
        if (this.metricsHistory.latency.length > 50) {
            this.metricsHistory.latency.shift();
        }
        
        this.updateLatencyDisplay(data.latency);
        this.updateLatencyChart();
    }

    updateMetrics(data) {
        // Update confidence
        this.metricsHistory.confidence.push({
            value: data.confidence,
            timestamp: Date.now()
        });
        
        if (this.metricsHistory.confidence.length > 50) {
            this.metricsHistory.confidence.shift();
        }
        
        this.updateConfidenceDisplay(data.confidence);
    }

    updateAccuracyDisplay(accuracy) {
        this.accuracyValue.textContent = `${(accuracy * 100).toFixed(1)}%`;
        
        const trend = this.calculateTrend(this.metricsHistory.accuracy);
        this.accuracyTrend.textContent = trend > 0 ? '↗ Improving' : trend < 0 ? '↘ Declining' : '→ Stable';
        this.accuracyTrend.style.color = trend > 0 ? '#27ae60' : trend < 0 ? '#e74c3c' : '#6c757d';
    }

    updateLatencyDisplay(latency) {
        this.latencyValue.textContent = `${latency}ms`;
        
        const trend = this.calculateTrend(this.metricsHistory.latency);
        this.latencyTrend.textContent = trend < 0 ? '↗ Improving' : trend > 0 ? '↘ Declining' : '→ Stable';
        this.latencyTrend.style.color = trend < 0 ? '#27ae60' : trend > 0 ? '#e74c3c' : '#6c757d';
    }

    updateConfidenceDisplay(confidence) {
        this.confidenceValue.textContent = `${(confidence * 100).toFixed(1)}%`;
        
        const trend = this.calculateTrend(this.metricsHistory.confidence);
        this.confidenceTrend.textContent = trend > 0 ? '↗ Improving' : trend < 0 ? '↘ Declining' : '→ Stable';
        this.confidenceTrend.style.color = trend > 0 ? '#27ae60' : trend < 0 ? '#e74c3c' : '#6c757d';
    }

    calculateTrend(data) {
        if (data.length < 2) return 0;
        
        const recent = data.slice(-5);
        const older = data.slice(-10, -5);
        
        if (older.length === 0) return 0;
        
        const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
        const olderAvg = older.reduce((sum, item) => sum + item.value, 0) / older.length;
        
        return recentAvg - olderAvg;
    }

    initializeCharts() {
        // Initialize Chart.js charts for accuracy and latency
        this.accuracyChart = new Chart(document.getElementById('accuracyChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Accuracy %',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        this.latencyChart = new Chart(document.getElementById('latencyChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Latency (ms)',
                    data: [],
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    updateAccuracyChart() {
        const labels = this.metricsHistory.accuracy.map((_, index) => index + 1);
        const data = this.metricsHistory.accuracy.map(item => item.value * 100);
        
        this.accuracyChart.data.labels = labels;
        this.accuracyChart.data.datasets[0].data = data;
        this.accuracyChart.update('none');
    }

    updateLatencyChart() {
        const labels = this.metricsHistory.latency.map((_, index) => index + 1);
        const data = this.metricsHistory.latency.map(item => item.value);
        
        this.latencyChart.data.labels = labels;
        this.latencyChart.data.datasets[0].data = data;
        this.latencyChart.update('none');
    }

    enableRecording() {
        this.recordBtn.disabled = false;
    }

    disableRecording() {
        this.recordBtn.disabled = true;
        this.stopBtn.disabled = true;
        if (this.isRecording) {
            this.stopRecording();
        }
    }

    clearTranscription() {
        this.transcriptionContainer.innerHTML = `
            <div class="transcription-placeholder">
                <i class="fas fa-microphone-slash"></i>
                <p>No transcription yet. Connect and start recording to see results.</p>
            </div>
        `;
        this.transcriptionHistory = [];
        this.addLog('info', 'Transcription cleared');
    }

    exportTranscription() {
        if (this.transcriptionHistory.length === 0) {
            this.addLog('warning', 'No transcription data to export');
            return;
        }
        
        const data = JSON.stringify(this.transcriptionHistory, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcription-${new Date().toISOString().slice(0, 19)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.addLog('info', 'Transcription exported');
    }

    addLog(level, message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${level}`;
        logEntry.innerHTML = `
            <span class="log-timestamp">[${timestamp}]</span>
            <span class="log-level">${level.toUpperCase()}</span>
            <span class="log-message">${message}</span>
        `;
        
        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
        
        // Keep only last 100 log entries
        while (this.logContainer.children.length > 100) {
            this.logContainer.removeChild(this.logContainer.firstChild);
        }
    }

    clearLogs() {
        this.logContainer.innerHTML = '';
        this.addLog('info', 'Logs cleared');
    }

    exportLogs() {
        const logEntries = Array.from(this.logContainer.children).map(entry => ({
            timestamp: entry.querySelector('.log-timestamp').textContent,
            level: entry.querySelector('.log-level').textContent,
            message: entry.querySelector('.log-message').textContent
        }));
        
        const data = JSON.stringify(logEntries, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString().slice(0, 19)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.addLog('info', 'Logs exported');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.transcriptionMonitor = new TranscriptionMonitor();
});

// Add some demo functionality for testing
function simulateTranscription() {
    if (window.transcriptionMonitor && window.transcriptionMonitor.isConnected) {
        const demoTexts = [
            "Hello, this is a test transcription.",
            "The quick brown fox jumps over the lazy dog.",
            "Speech recognition accuracy is improving rapidly.",
            "Real-time transcription with low latency.",
            "WebSocket technology enables instant communication."
        ];
        
        const randomText = demoTexts[Math.floor(Math.random() * demoTexts.length)];
        const confidence = Math.random() * 0.3 + 0.7; // 0.7-1.0
        const latency = Math.random() * 100 + 50; // 50-150ms
        
        window.transcriptionMonitor.handleTranscriptionResult({
            text: randomText,
            confidence: confidence,
            latency: latency,
            timestamp: Date.now()
        });
    }
}

// Add demo button to the interface
document.addEventListener('DOMContentLoaded', () => {
    const demoBtn = document.createElement('button');
    demoBtn.className = 'btn btn-small';
    demoBtn.innerHTML = '<i class="fas fa-play"></i> Demo';
    demoBtn.onclick = simulateTranscription;
    
    const panelControls = document.querySelector('.panel-controls');
    if (panelControls) {
        panelControls.appendChild(demoBtn);
    }
});
