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