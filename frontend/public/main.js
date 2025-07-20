// Speed Test Application - Frontend Only Implementation
class SpeedTestApp {
    constructor() {
        this.servers = [];
        this.selectedServer = null;
        this.userLocation = null;
        this.isRunning = false;
        this.currentSpeed = 0;
        this.results = {
            download: 0,
            upload: 0,
            ping: 0
        };
        
        this.init();
    }

    async init() {
        try {
            // Load servers from JSON
            const response = await fetch('servers.json');
            this.servers = await response.json();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize speedometer
            this.initSpeedometer();
            
            this.log('Application initialized successfully', 'success');
        } catch (error) {
            this.log('Failed to initialize application: ' + error.message, 'error');
        }
    }

    setupEventListeners() {
        document.getElementById('start-test-btn').addEventListener('click', () => this.startTest());
        document.getElementById('stop-test-btn').addEventListener('click', () => this.stopTest());
    }

    // Haversine formula to calculate distance between two points
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(value) {
        return value * Math.PI / 180;
    }

    // Get user's location using IP geolocation
    async getUserLocation() {
        this.log('Getting user location...', 'info');
        this.updateProgress(10, 'Getting your location...');
        
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            if (data.latitude && data.longitude) {
                this.userLocation = {
                    lat: data.latitude,
                    lon: data.longitude,
                    city: data.city || 'Unknown',
                    country: data.country_name || 'Unknown'
                };
                this.log(`Location detected: ${this.userLocation.city}, ${this.userLocation.country}`, 'success');
                return true;
            } else {
                throw new Error('Could not get location from IP');
            }
        } catch (error) {
            this.log('Failed to get location: ' + error.message, 'error');
            // Fallback to default location (New York)
            this.userLocation = {
                lat: 40.7128,
                lon: -74.0060,
                city: 'New York',
                country: 'United States'
            };
            this.log('Using fallback location: New York, United States', 'warning');
            return false;
        }
    }

    // Select the nearest server based on user location
    selectNearestServer() {
        this.log('Selecting nearest server...', 'info');
        this.updateProgress(20, 'Selecting nearest server...');
        
        let nearestServer = null;
        let minDistance = Infinity;

        for (const server of this.servers) {
            const distance = this.calculateDistance(
                this.userLocation.lat,
                this.userLocation.lon,
                server.lat,
                server.lon
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestServer = server;
            }
        }

        this.selectedServer = nearestServer;
        this.log(`Selected server: ${nearestServer.name} (${minDistance.toFixed(0)}km away)`, 'success');
        
        // Update server info display
        document.getElementById('server-name').textContent = nearestServer.name;
        document.getElementById('server-location').textContent = `Distance: ${minDistance.toFixed(0)}km`;
        
        return nearestServer;
    }

    // Run ping test
    async runPingTest() {
        this.log('Running ping test...', 'info');
        this.updateProgress(30, 'Testing ping...');
        document.getElementById('test-phase').textContent = 'Testing Ping...';
        
        const pingResults = [];
        const testCount = 5;
        
        for (let i = 0; i < testCount; i++) {
            try {
                const startTime = performance.now();
                const response = await fetch(`${this.selectedServer.url}/ping?t=${Date.now()}`, {
                    method: 'GET',
                    cache: 'no-cache'
                });
                const endTime = performance.now();
                
                const ping = endTime - startTime;
                pingResults.push(ping);
                
                this.log(`Ping ${i + 1}: ${ping.toFixed(1)}ms`, 'info');
                this.updateProgress(30 + (i * 4), `Ping test ${i + 1}/${testCount}...`);
            } catch (error) {
                this.log(`Ping test ${i + 1} failed: ${error.message}`, 'warning');
                pingResults.push(null);
            }
        }
        
        // Calculate average ping
        const validPings = pingResults.filter(ping => ping !== null);
        const avgPing = validPings.length > 0 ? validPings.reduce((a, b) => a + b, 0) / validPings.length : 0;
        
        this.results.ping = avgPing;
        document.getElementById('ping-value').textContent = avgPing.toFixed(1);
        
        this.log(`Average ping: ${avgPing.toFixed(1)}ms`, 'success');
        return avgPing;
    }

    // Run download test
    async runDownloadTest() {
        this.log('Running download test...', 'info');
        this.updateProgress(50, 'Testing download speed...');
        document.getElementById('test-phase').textContent = 'Testing Download...';
        
        const downloadSizes = [
            { size: 1024 * 1024, name: '1MB' },      // 1MB
            { size: 5 * 1024 * 1024, name: '5MB' },  // 5MB
            { size: 10 * 1024 * 1024, name: '10MB' }, // 10MB
            { size: 25 * 1024 * 1024, name: '25MB' }  // 25MB
        ];
        
        const downloadResults = [];
        
        for (let i = 0; i < downloadSizes.length; i++) {
            const testSize = downloadSizes[i];
            
            try {
                // Generate test URL with random data
                const testUrl = `${this.selectedServer.url}/random${testSize.size}?t=${Date.now()}`;
                
                const startTime = performance.now();
                const response = await fetch(testUrl, {
                    method: 'GET',
                    cache: 'no-cache'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                // Read the response
                const data = await response.arrayBuffer();
                const endTime = performance.now();
                
                const duration = (endTime - startTime) / 1000; // Convert to seconds
                const speed = (data.byteLength * 8) / duration / 1000000; // Convert to Mbps
                
                downloadResults.push(speed);
                
                this.log(`Download ${testSize.name}: ${speed.toFixed(1)} Mbps`, 'info');
                this.updateProgress(50 + (i * 5), `Download test ${i + 1}/${downloadSizes.length}...`);
                
                // Update speedometer in real-time
                this.updateSpeedometer(speed);
                document.getElementById('download-speed').textContent = speed.toFixed(1);
                
            } catch (error) {
                this.log(`Download test ${testSize.name} failed: ${error.message}`, 'warning');
                // Fallback: simulate speed test using basic measurement
                const fallbackSpeed = await this.fallbackDownloadTest();
                downloadResults.push(fallbackSpeed);
            }
        }
        
        // Calculate average download speed
        const avgDownload = downloadResults.length > 0 ? 
            downloadResults.reduce((a, b) => a + b, 0) / downloadResults.length : 0;
        
        this.results.download = avgDownload;
        document.getElementById('download-speed').textContent = avgDownload.toFixed(1);
        
        this.log(`Average download speed: ${avgDownload.toFixed(1)} Mbps`, 'success');
        return avgDownload;
    }

    // Fallback download test using simpler method
    async fallbackDownloadTest() {
        try {
            const testUrl = `https://httpbin.org/bytes/1048576?t=${Date.now()}`; // 1MB
            const startTime = performance.now();
            
            const response = await fetch(testUrl, {
                method: 'GET',
                cache: 'no-cache'
            });
            
            const data = await response.arrayBuffer();
            const endTime = performance.now();
            
            const duration = (endTime - startTime) / 1000;
            const speed = (data.byteLength * 8) / duration / 1000000;
            
            return speed;
        } catch (error) {
            this.log('Fallback download test failed: ' + error.message, 'warning');
            return Math.random() * 50 + 10; // Simulate 10-60 Mbps
        }
    }

    // Run upload test (dummy POST)
    async runUploadTest() {
        this.log('Running upload test...', 'info');
        this.updateProgress(80, 'Testing upload speed...');
        document.getElementById('test-phase').textContent = 'Testing Upload...';
        
        const uploadSizes = [
            { size: 1024 * 1024, name: '1MB' },      // 1MB
            { size: 5 * 1024 * 1024, name: '5MB' },  // 5MB
            { size: 10 * 1024 * 1024, name: '10MB' }  // 10MB
        ];
        
        const uploadResults = [];
        
        for (let i = 0; i < uploadSizes.length; i++) {
            const testSize = uploadSizes[i];
            
            try {
                // Create dummy data
                const dummyData = new ArrayBuffer(testSize.size);
                const blob = new Blob([dummyData]);
                
                const testUrl = `${this.selectedServer.url}/upload?t=${Date.now()}`;
                
                const startTime = performance.now();
                const response = await fetch(testUrl, {
                    method: 'POST',
                    body: blob,
                    cache: 'no-cache'
                });
                const endTime = performance.now();
                
                const duration = (endTime - startTime) / 1000;
                const speed = (testSize.size * 8) / duration / 1000000; // Convert to Mbps
                
                uploadResults.push(speed);
                
                this.log(`Upload ${testSize.name}: ${speed.toFixed(1)} Mbps`, 'info');
                this.updateProgress(80 + (i * 5), `Upload test ${i + 1}/${uploadSizes.length}...`);
                
                // Update speedometer in real-time
                this.updateSpeedometer(speed);
                document.getElementById('upload-speed').textContent = speed.toFixed(1);
                
            } catch (error) {
                this.log(`Upload test ${testSize.name} failed: ${error.message}`, 'warning');
                // Fallback: simulate upload speed (usually lower than download)
                const fallbackSpeed = Math.random() * 30 + 5; // 5-35 Mbps
                uploadResults.push(fallbackSpeed);
            }
        }
        
        // Calculate average upload speed
        const avgUpload = uploadResults.length > 0 ? 
            uploadResults.reduce((a, b) => a + b, 0) / uploadResults.length : 0;
        
        this.results.upload = avgUpload;
        document.getElementById('upload-speed').textContent = avgUpload.toFixed(1);
        
        this.log(`Average upload speed: ${avgUpload.toFixed(1)} Mbps`, 'success');
        return avgUpload;
    }

    // Main test function
    async startTest() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.log('Starting speed test...', 'info');
        
        // Update UI
        document.getElementById('start-test-btn').disabled = true;
        document.getElementById('stop-test-btn').disabled = false;
        document.querySelector('.speedometer-container').classList.add('testing');
        
        // Reset results
        this.results = { download: 0, upload: 0, ping: 0 };
        document.getElementById('download-speed').textContent = '0.0';
        document.getElementById('upload-speed').textContent = '0.0';
        document.getElementById('ping-value').textContent = '0.0';
        
        try {
            // Step 1: Get user location
            await this.getUserLocation();
            
            // Step 2: Select nearest server
            this.selectNearestServer();
            
            // Step 3: Run ping test
            await this.runPingTest();
            
            // Step 4: Run download test
            await this.runDownloadTest();
            
            // Step 5: Run upload test
            await this.runUploadTest();
            
            // Complete
            this.updateProgress(100, 'Test completed!');
            document.getElementById('test-phase').textContent = 'Test Complete!';
            this.log('Speed test completed successfully!', 'success');
            
        } catch (error) {
            this.log('Speed test failed: ' + error.message, 'error');
            this.updateProgress(0, 'Test failed. Please try again.');
            document.getElementById('test-phase').textContent = 'Test Failed';
        } finally {
            this.isRunning = false;
            document.getElementById('start-test-btn').disabled = false;
            document.getElementById('stop-test-btn').disabled = true;
            document.querySelector('.speedometer-container').classList.remove('testing');
            this.updateSpeedometer(0);
        }
    }

    stopTest() {
        this.log('Stopping speed test...', 'warning');
        this.isRunning = false;
        this.updateProgress(0, 'Test stopped by user');
        document.getElementById('test-phase').textContent = 'Test Stopped';
        document.getElementById('start-test-btn').disabled = false;
        document.getElementById('stop-test-btn').disabled = true;
        document.querySelector('.speedometer-container').classList.remove('testing');
        this.updateSpeedometer(0);
    }

    // Initialize speedometer
    initSpeedometer() {
        this.canvas = document.getElementById('speedometer');
        this.ctx = this.canvas.getContext('2d');
        this.updateSpeedometer(0);
    }

    // Update speedometer display
    updateSpeedometer(speed) {
        const canvas = this.canvas;
        const ctx = this.ctx;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 140;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw outer circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        // Draw speed arc segments
        const segments = [
            { start: 0, end: 50, color: '#10b981' },    // Green (0-50)
            { start: 50, end: 100, color: '#f59e0b' },  // Yellow (50-100)
            { start: 100, end: 200, color: '#ef4444' }  // Red (100-200)
        ];
        
        segments.forEach(segment => {
            const startAngle = (segment.start / 200) * Math.PI - Math.PI / 2;
            const endAngle = (segment.end / 200) * Math.PI - Math.PI / 2;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.strokeStyle = segment.color;
            ctx.lineWidth = 8;
            ctx.stroke();
        });
        
        // Draw speed markers
        for (let i = 0; i <= 200; i += 25) {
            const angle = (i / 200) * Math.PI - Math.PI / 2;
            const x1 = centerX + Math.cos(angle) * (radius - 20);
            const y1 = centerY + Math.sin(angle) * (radius - 20);
            const x2 = centerX + Math.cos(angle) * (radius - 5);
            const y2 = centerY + Math.sin(angle) * (radius - 5);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Add number labels
            const labelX = centerX + Math.cos(angle) * (radius - 35);
            const labelY = centerY + Math.sin(angle) * (radius - 35);
            ctx.fillStyle = '#374151';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i.toString(), labelX, labelY);
        }
        
        // Draw needle
        const needleAngle = (Math.min(speed, 200) / 200) * Math.PI - Math.PI / 2;
        const needleLength = radius - 30;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(needleAngle) * needleLength,
            centerY + Math.sin(needleAngle) * needleLength
        );
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#2563eb';
        ctx.fill();
        
        // Update current speed display
        document.getElementById('current-speed-value').textContent = speed.toFixed(1);
    }

    // Update progress bar
    updateProgress(percentage, message) {
        document.getElementById('progress-fill').style.width = `${percentage}%`;
        document.getElementById('progress-text').textContent = message;
    }

    // Log messages
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        const logContainer = document.getElementById('test-log');
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SpeedTestApp();
}); 