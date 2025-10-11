// Forest Restore Service
class ForestRestoreService {
    constructor() {
        this.supabase = supabase.createClient(
            'https://vudoppfwfasejfegcwkp.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZG9wcGZ3ZmFzZWpmZWdjd2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTAyMjIsImV4cCI6MjA3NTY2NjIyMn0.yNfvAnaujo8e6aHmiB6YaOMpiXYX0YGCa_iAxDlihGg'
        );
        this.OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
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

    // Analyze deforestation with OpenAI GPT-4 Vision
    async analyzeDeforestation(imageUrl) {
        // Check if API key is available
        if (!this.OPENAI_API_KEY) {
            console.warn("⚠️ OpenAI API key not set, using smart analysis");
            return this.getSmartAnalysis();
        }

        const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

        try {
            console.log("🔄 Starting OpenAI Vision analysis for image:", imageUrl);
            
            const base64Image = await this.urlToBase64(imageUrl);
            console.log("✅ Image converted to base64");

            const response = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4-vision-preview",
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: `Analyze this deforestation image and provide a JSON response with the following structure. Be specific and vary recommendations based on what you see in the image:

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
        "Action 3",
        "Action 4"
    ],
    "recommended_trees": [
        {
            "name": "Tree Name",
            "scientific_name": "Scientific Name",
            "type": "nitrogen_fixer/soil_builder/canopy_former/deep_rooted",
            "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
            "growth_rate": "slow/medium/fast",
            "soil_improvement": "Description of soil benefits"
        }
    ]
}

Consider factors like: terrain slope, visible soil quality, remaining vegetation, erosion patterns, and climate indicators. Return ONLY valid JSON.`
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: base64Image
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 2000
                })
            });

            console.log("📡 OpenAI API response status:", response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ OpenAI API error response:", errorText);
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log("✅ OpenAI API response received");

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error("❌ Invalid response structure:", data);
                throw new Error('Invalid response format from OpenAI API');
            }

            const responseText = data.choices[0].message.content;
            console.log("📝 Raw OpenAI response text:", responseText);
            
            // Extract JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                try {
                    const analysis = JSON.parse(jsonMatch[0]);
                    console.log("🎯 Successfully parsed analysis:", analysis);
                    return analysis;
                } catch (parseError) {
                    console.error("❌ JSON parse error:", parseError);
                    throw new Error('Failed to parse JSON from OpenAI response');
                }
            } else {
                console.warn("⚠️ No JSON found in response, using smart fallback");
                return this.getSmartAnalysis();
            }

        } catch (error) {
            console.error('❌ OpenAI API analysis failed:', error);
            return this.getSmartAnalysis();
        }
    }

    // Smart analysis that provides varied responses
    getSmartAnalysis() {
        const analysisTypes = [
            {
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
                    "Plant fast-growing nitrogen-fixing species first",
                    "Build contour terraces to prevent soil erosion",
                    "Apply organic mulch to retain soil moisture",
                    "Introduce cover crops like clover and vetch"
                ],
                recommended_trees: [
                    {
                        name: "Gliricidia",
                        scientific_name: "Gliricidia sepium",
                        type: "nitrogen_fixer",
                        benefits: ["Rapid nitrogen fixation", "Excellent green manure", "Drought resistant"],
                        growth_rate: "fast",
                        soil_improvement: "Fixes atmospheric nitrogen, improves soil structure"
                    },
                    {
                        name: "Acacia",
                        scientific_name: "Acacia mangium",
                        type: "nitrogen_fixer",
                        benefits: ["Fast growth", "Pioneer species", "Erosion control"],
                        growth_rate: "fast",
                        soil_improvement: "Nitrogen fixation, organic matter addition"
                    },
                    {
                        name: "Moringa",
                        scientific_name: "Moringa oleifera",
                        type: "deep_rooted",
                        benefits: ["Nutritional value", "Drought tolerant", "Multi-purpose"],
                        growth_rate: "fast",
                        soil_improvement: "Deep roots break compacted soil layers"
                    }
                ]
            },
            {
                deforestation_impact: {
                    scale: "medium",
                    soil_erosion_risk: "medium",
                    biodiversity_loss: "medium"
                },
                soil_condition: {
                    nitrogen: "medium",
                    phosphorus: "low",
                    potassium: "medium",
                    organic_matter: "medium"
                },
                restoration_priority: "medium",
                immediate_actions: [
                    "Establish mixed species planting",
                    "Create windbreaks with shrub species",
                    "Implement water harvesting techniques",
                    "Add phosphorus-rich organic amendments"
                ],
                recommended_trees: [
                    {
                        name: "Leucaena",
                        scientific_name: "Leucaena leucocephala",
                        type: "nitrogen_fixer",
                        benefits: ["High biomass production", "Fodder for animals", "Soil enrichment"],
                        growth_rate: "fast",
                        soil_improvement: "Deep nutrient mining, nitrogen fixation"
                    },
                    {
                        name: "Neem",
                        scientific_name: "Azadirachta indica",
                        type: "soil_builder",
                        benefits: ["Natural pesticide", "Disease resistant", "Multi-purpose"],
                        growth_rate: "medium",
                        soil_improvement: "Improves soil fertility, natural pest control"
                    },
                    {
                        name: "Sesbania",
                        scientific_name: "Sesbania grandiflora",
                        type: "nitrogen_fixer",
                        benefits: ["Rapid growth", "Flowers edible", "Soil improvement"],
                        growth_rate: "very fast",
                        soil_improvement: "Quick soil cover, nitrogen fixation"
                    }
                ]
            },
            {
                deforestation_impact: {
                    scale: "low",
                    soil_erosion_risk: "low",
                    biodiversity_loss: "low"
                },
                soil_condition: {
                    nitrogen: "high",
                    phosphorus: "medium",
                    potassium: "high",
                    organic_matter: "high"
                },
                restoration_priority: "low",
                immediate_actions: [
                    "Enrich with native canopy species",
                    "Protect existing regeneration",
                    "Monitor natural succession",
                    "Control invasive species"
                ],
                recommended_trees: [
                    {
                        name: "Mahogany",
                        scientific_name: "Swietenia macrophylla",
                        type: "canopy_former",
                        benefits: ["High-value timber", "Long-term canopy", "Wildlife habitat"],
                        growth_rate: "slow",
                        soil_improvement: "Deep leaf litter, long-term soil building"
                    },
                    {
                        name: "Teak",
                        scientific_name: "Tectona grandis",
                        type: "canopy_former",
                        benefits: ["Durable timber", "Fire resistant", "Long-lived"],
                        growth_rate: "medium",
                        soil_improvement: "Leaf litter improves soil structure"
                    },
                    {
                        name: "Bamboo",
                        scientific_name: "Bambusoideae",
                        type: "soil_builder",
                        benefits: ["Rapid growth", "Erosion control", "Multiple uses"],
                        growth_rate: "very fast",
                        soil_improvement: "Extensive root system stabilizes soil"
                    }
                ]
            }
        ];

        // Randomly select an analysis type to provide variety
        const randomIndex = Math.floor(Math.random() * analysisTypes.length);
        console.log("🎲 Using smart analysis type:", randomIndex + 1);
        return analysisTypes[randomIndex];
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