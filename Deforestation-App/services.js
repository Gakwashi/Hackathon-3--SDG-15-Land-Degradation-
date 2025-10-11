// Forest Restore Service
class ForestRestoreService {
    constructor() {
        this.supabase = supabase.createClient(
            'https://vudoppfwfasejfegcwkp.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZG9wcGZ3ZmFzZWpmZWdjd2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTAyMjIsImV4cCI6MjA3NTY2NjIyMn0.yNfvAnaujo8e6aHmiB6YaOMpiXYX0YGCa_iAxDlihGg'
        );
        this.GEMINI_API_KEY = 'AIzaSyDNvkLTJojfy1pxtePFsmBQP-YLj3fhzMU';
    }

    // Authentication methods
    async signUp(email, password) {
        const { data, error } = await this.supabase.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    }

    async signIn(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
    }

    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    }

    // Image upload to Supabase Storage
    async uploadImage(file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        
        const { data, error } = await this.supabase.storage
            .from('deforestation-images')
            .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = this.supabase.storage
            .from('deforestation-images')
            .getPublicUrl(fileName);

        return { url: publicUrl, path: data.path };
    }

    // Analyze deforestation with Gemini API
    async analyzeDeforestation(imageUrl) {
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent?key=${this.GEMINI_API_KEY}`;

        try {
            console.log("🔄 Starting Gemini API analysis for image:", imageUrl);
            
            const base64Image = await this.urlToBase64(imageUrl);
            console.log("✅ Image converted to base64");
            
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Analyze this deforestation image and provide a VALID JSON response with this exact structure:

{
    "deforestation_impact": {
        "scale": "low/medium/high",
        "soil_erosion_risk": "low/medium/high", 
        "biodiversity_loss": "low/medium/high"
    },
    "soil_condition": {
        "nitrogen": "low/medium/high",
        "phosphorus": "low/medium/high", 
        "potassium": "low/medium/high",
        "organic_matter": "low/medium/high"
    },
    "restoration_priority": "low/medium/high",
    "immediate_actions": [
        "Action 1",
        "Action 2", 
        "Action 3"
    ],
    "recommended_trees": [
        {
            "name": "Tree Name",
            "scientific_name": "Scientific Name",
            "type": "nitrogen_fixer/soil_builder/canopy_former",
            "benefits": ["Benefit 1", "Benefit 2"],
            "growth_rate": "slow/medium/fast",
            "soil_improvement": "Description of soil benefits"
        }
    ]
}

Focus on species that restore soil nutrients and combat deforestation. Return ONLY the JSON, no other text.`
                        }, {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64Image.split(',')[1]
                            }
                        }]
                    }]
                })
            });

            console.log("📡 Gemini API response status:", response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ Gemini API error response:", errorText);
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log("✅ Gemini API raw response:", data);
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                console.error("❌ Invalid response structure:", data);
                throw new Error('Invalid response format from Gemini API');
            }

            const responseText = data.candidates[0].content.parts[0].text;
            console.log("📝 Raw Gemini response text:", responseText);
            
            // Extract JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                try {
                    const analysis = JSON.parse(jsonMatch[0]);
                    console.log("🎯 Successfully parsed analysis:", analysis);
                    return analysis;
                } catch (parseError) {
                    console.error("❌ JSON parse error:", parseError);
                    throw new Error('Failed to parse JSON from Gemini response');
                }
            } else {
                console.warn("⚠️ No JSON found in response, response was:", responseText);
                throw new Error('No valid JSON response from Gemini API');
            }

        } catch (error) {
            console.error('❌ Gemini API analysis failed:', error);
            throw new Error(`AI analysis failed: ${error.message}`);
        }
    }

    // Convert image URL to base64
    async urlToBase64(url) {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    // Mock data fallback (only for testing)
    getMockAnalysis() {
        console.warn("⚠️ Using mock data - this should only happen in development");
        return {
            deforestation_impact: {
                scale: "high",
                soil_erosion_risk: "high",
                biodiversity_loss: "high"
            },
            soil_condition: {
                nitrogen: "low",
                phosphorus: "medium",
                potassium: "low",
                organic_matter: "low"
            },
            restoration_priority: "high",
            immediate_actions: [
                "Plant nitrogen-fixing trees immediately",
                "Establish cover crops to prevent erosion",
                "Create contour barriers on slopes",
                "Add organic mulch to retain moisture"
            ],
            recommended_trees: [
                {
                    name: "Gliricidia",
                    scientific_name: "Gliricidia sepium",
                    type: "nitrogen_fixer",
                    benefits: ["Fast nitrogen fixation", "Biomass production", "Living fence"],
                    growth_rate: "fast",
                    soil_improvement: "Fixes atmospheric nitrogen, improves soil fertility"
                }
            ]
        };
    }

    // Save analysis to database
    async saveAnalysis(imageData, analysis, userId) {
        const { data, error } = await this.supabase
            .from('deforestation_analyses')
            .insert([{
                image_url: imageData.url,
                user_id: userId,
                analysis_result: analysis,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        return data[0];
    }
}

// Create global service instance
window.forestService = new ForestRestoreService();