class ConfigLoader {
    constructor() {
        this.config = null;
    }

    async loadConfig() {
        try {
            const response = await fetch('config.json?v=' + new Date().getTime());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.config = await response.json();
            console.log('Config loaded successfully:', this.config);
            return this.config;
        } catch (error) {
            console.error('Error loading config.json:', error);
            // Provide a default config in case of error (for testing)
            this.config = this.getDefaultConfig();
            return this.config;
        }
    }

    getConfig() {
        return this.config;
    }

    getDefaultConfig() {
        return {
            settings: {
                nights: 5,
                maxEnergy: 100,
                energyDrainRate: 1.0,
                doorEnergyCost: 0.5,
                cameraEnergyCost: 0.2,
                nightDurationSeconds: 180 // 3 minutes per night
            },
            cameras: [
                { id: "cam1", name: "Couloir", baseImage: "", position: { x: 10, y: 20 } },
                { id: "cam2", name: "Cuisine", baseImage: "", position: { x: 50, y: 40 } },
                { id: "cam3", name: "Salon", baseImage: "", position: { x: 80, y: 40 } },
                { id: "cam4", name: "Salle de Bain", baseImage: "", position: { x: 50, y: 70 } },
                { id: "cam5", name: "Chambre", baseImage: "", position: { x: 20, y: 50 } }
            ],
            cats: {
                "placeholder": {
                    name: "Cat",
                    startCamera: "cam2",
                    aggressionLevel: [1, 3, 5, 7, 10],
                    images: {
                        cam1: "",
                        cam2: "",
                        cam3: "",
                        cam4: "",
                        cam5: "",
                        door_left: "",
                        jumpscare: ""
                    },
                    audio: { move: "", jumpscare: "" }
                }
            }
        };
    }
}

const configLoader = new ConfigLoader();
