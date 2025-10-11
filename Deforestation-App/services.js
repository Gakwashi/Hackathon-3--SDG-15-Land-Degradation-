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
            const base64Image = await this.urlToBase64(imageUrl);
            
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Analyze this deforestation image and provide JSON response with:
1. deforestation_impact: scale, soil_erosion_risk, biodiversity_loss
2. soil_condition: nitrogen, phosphorus, potassium, organic_matter
3. restoration_priority
4. immediate_actions array
5. recommended_trees array with name, scientific_name, type, benefits, growth_rate, soil_improvement

Focus on species that restore soil nutrients and combat deforestation.`
                        }, {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64Image.split(',')[1]
                            }
                        }]
                    }]
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
            }

            const responseText = data.candidates[0].content.parts[0].text;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                return this.getMockAnalysis();
            }

        } catch (error) {
            console.error('Gemini API error:', error);
            return this.getMockAnalysis();
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

    // Mock data fallback
    getMockAnalysis() {
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
                },
                {
                    name: "Leucaena",
                    scientific_name: "Leucaena leucocephala",
                    type: "nitrogen_fixer", 
                    benefits: ["High biomass", "Fodder production", "Soil improvement"],
                    growth_rate: "fast",
                    soil_improvement: "Deep roots bring up nutrients, fixes nitrogen"
                },
                {
                    name: "Moringa",
                    scientific_name: "Moringa oleifera",
                    type: "deep_rooted",
                    benefits: ["Nutritional leaves", "Drought resistant", "Fast growth"],
                    growth_rate: "fast",
                    soil_improvement: "Deep roots break compacted soil, nutrient mining"
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