// Navigation function
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    document.getElementById(screenId).classList.add('active');
    
    // Initialize icons
    lucide.createIcons();
    
    // If showing services screen, initialize the app
    if (screenId === 'services-screen' && window.app) {
        window.app.init();
    }
}

class ForestRestoreApp {
    constructor() {
        this.isAnalyzing = false;
        this.cameraStream = null;
    }

    init() {
        this.setupEventListeners();
        this.setupCameraEvents();
        lucide.createIcons();
    }

    setupEventListeners() {
        const fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', (e) => this.handleImageUpload(e));
    }

    setupCameraEvents() {
        const startCameraBtn = document.getElementById('start-camera');
        const captureBtn = document.getElementById('capture-btn');
        const retakeBtn = document.getElementById('retake-btn');
        const analyzeCaptureBtn = document.getElementById('analyze-capture');

        startCameraBtn.addEventListener('click', () => this.startCamera());
        captureBtn.addEventListener('click', () => this.capturePhoto());
        retakeBtn.addEventListener('click', () => this.retakePhoto());
        analyzeCaptureBtn.addEventListener('click', () => this.analyzeCapture());
    }

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            const video = document.getElementById('camera-video');
            video.srcObject = stream;
            
            document.getElementById('camera-preview').classList.remove('hidden');
            document.getElementById('capture-btn').classList.remove('hidden');
            document.getElementById('start-camera').classList.add('hidden');
            
            this.cameraStream = stream;
            
        } catch (error) {
            alert(`Camera error: ${error.message}. Please ensure you've allowed camera access.`);
        }
    }

    capturePhoto() {
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        const capturedImage = document.getElementById('captured-image');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        capturedImage.src = imageDataUrl;
        
        document.getElementById('camera-preview').classList.add('hidden');
        document.getElementById('camera-result').classList.remove('hidden');
        document.getElementById('capture-btn').classList.add('hidden');
        document.getElementById('retake-btn').classList.remove('hidden');
        
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
        }
    }

    retakePhoto() {
        document.getElementById('camera-result').classList.add('hidden');
        document.getElementById('retake-btn').classList.add('hidden');
        document.getElementById('start-camera').classList.remove('hidden');
        document.getElementById('captured-image').src = '';
    }

    async analyzeCapture() {
        const capturedImage = document.getElementById('captured-image');
        
        const response = await fetch(capturedImage.src);
        const blob = await response.blob();
        const file = new File([blob], 'deforestation-capture.jpg', { type: 'image/jpeg' });
        
        await this.analyzeImage(file);
        this.retakePhoto();
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showImagePreview(file);
        await this.analyzeImage(file);
    }

    showImagePreview(file) {
        const preview = document.getElementById('upload-preview');
        const reader = new FileReader();

        reader.onload = (e) => {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Deforestation preview">
                <p>Image uploaded successfully</p>
            `;
            preview.classList.remove('hidden');
        };

        reader.readAsDataURL(file);
    }

    async analyzeImage(file) {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        const resultsSection = document.getElementById('results-section');
        
        resultsSection.innerHTML = '<div class="loading">Analyzing deforestation impact with AI...</div>';
        resultsSection.classList.remove('hidden');

        try {
            const imageData = await window.forestService.uploadImage(file);
            const analysis = await window.forestService.analyzeDeforestation(imageData.url);
            
            const user = await window.forestService.getCurrentUser();
            await window.forestService.saveAnalysis(imageData, analysis, user.id);
            
            this.displayAnalysisResults(analysis);
            
        } catch (error) {
            console.error('Analysis error:', error);
            resultsSection.innerHTML = `
                <div class="error">
                    Analysis failed: ${error.message}. Using sample data instead.
                </div>
            `;
            const mockAnalysis = window.forestService.getMockAnalysis();
            this.displayAnalysisResults(mockAnalysis);
        } finally {
            this.isAnalyzing = false;
        }
    }

    displayAnalysisResults(analysis) {
        const resultsSection = document.getElementById('results-section');
        
        resultsSection.innerHTML = `
            <h3>Restoration Analysis</h3>
            
            <div class="analysis-card">
                <h4><i data-lucide="alert-triangle"></i> Deforestation Impact</h4>
                <div id="impact-analysis" class="impact-analysis"></div>
            </div>

            <div class="analysis-card">
                <h4><i data-lucide="sprout"></i> Recommended Restoration Species</h4>
                <div id="tree-recommendations" class="tree-grid"></div>
            </div>

            <div class="analysis-card">
                <h4><i data-lucide="list-checks"></i> Immediate Actions</h4>
                <div id="immediate-actions" class="actions-list"></div>
            </div>
        `;

        this.displayImpactAnalysis(analysis.deforestation_impact);
        this.displayTreeRecommendations(analysis.recommended_trees);
        this.displayImmediateActions(analysis.immediate_actions);

        lucide.createIcons();
    }

    displayImpactAnalysis(impact) {
        const container = document.getElementById('impact-analysis');
        
        container.innerHTML = `
            <div class="impact-item ${impact.scale}">
                <strong>Deforestation Scale</strong>
                <div>${impact.scale.toUpperCase()}</div>
            </div>
            <div class="impact-item ${impact.soil_erosion_risk}">
                <strong>Soil Erosion Risk</strong>
                <div>${impact.soil_erosion_risk.toUpperCase()}</div>
            </div>
            <div class="impact-item ${impact.biodiversity_loss}">
                <strong>Biodiversity Loss</strong>
                <div>${impact.biodiversity_loss.toUpperCase()}</div>
            </div>
        `;
    }

    displayTreeRecommendations(trees) {
        const container = document.getElementById('tree-recommendations');
        
        container.innerHTML = trees.map(tree => `
            <div class="tree-card ${tree.type}">
                <div class="tree-name">${tree.name}</div>
                <div class="tree-scientific">${tree.scientific_name}</div>
                <div><strong>Growth:</strong> ${tree.growth_rate}</div>
                <div><strong>Soil Improvement:</strong> ${tree.soil_improvement}</div>
                <ul class="tree-benefits">
                    ${tree.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    }

    displayImmediateActions(actions) {
        const container = document.getElementById('immediate-actions');
        
        container.innerHTML = actions.map(action => `
            <li>${action}</li>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new ForestRestoreApp();
});