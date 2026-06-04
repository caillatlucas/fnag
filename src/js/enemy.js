class EnemyManager {
    constructor(game, config) {
        this.game = game;
        this.config = config;
        this.cats = [];
        this.catStates = {};
        
        // Cuisine (cam2) connects to Salon (cam3) and SDB (cam4).
        // Salon (cam3) connects to Cuisine (cam2) and Couloir (cam1).
        // Couloir (cam1) connects to Office and Salon (cam3).
        this.paths = {
            "cam4": ["cam2"],
            "cam3": ["cam2", "cam1"],
            "cam2": ["cam3", "cam4"], 
            "cam1": ["office", "cam3"],
            "office": [] // Special logic
        };

        this.lureLocation = null;
        this.lureActive = false;
    }

    init(currentNight, activeCats = null, diffMultiplier = 1.0) {
        this.catStates = {};
        this.lureLocation = null;
        this.lureActive = false;
        this.diffMultiplier = diffMultiplier;

        let catKeys = Object.keys(this.config.cats);
        if (activeCats) {
            catKeys = catKeys.filter(key => activeCats.includes(key));
        }
        
        catKeys.forEach(key => {
            const catConfig = this.config.cats[key];
            
            this.catStates[key] = {
                id: key,
                name: catConfig.name,
                location: catConfig.startCamera,
                aggression: catConfig.aggressionLevel[Math.min(currentNight - 1, 4)] || 0,
                config: catConfig,
                moveTimer: 0,
                attackTimer: 0,
                isDead: false
            };
        });
    }

    triggerAudioLure(camId) {
        this.lureLocation = camId;
        this.lureActive = true;
        
        // Audio lure lasts for 15 seconds (to give them time to naturally want to move)
        setTimeout(() => {
            this.lureActive = false;
            this.lureLocation = null;
        }, 15000);
    }

    update(deltaTime) {
        if (this.game.isGameOver) return;

        Object.keys(this.catStates).forEach(key => {
            const cat = this.catStates[key];
            if (cat.aggression === 0 || cat.isDead) return;

            if (cat.location === "office") {
                this.updateOfficeAttack(cat, deltaTime);
                return;
            }

            // 1. Shy cat behavior: Petit Roux doesn't move when watched
            if (cat.id === "piti_roux" && this.game.isCameraOpen && this.game.ui.currentCam === cat.location) {
                // Watched on camera, reset move timer or just don't progress it
                return;
            }

            // 2. Hacker cat behavior: Coupain drains battery when on a camera (only if PC is ON)
            if (cat.id === "coupain" && cat.location.startsWith("cam") && this.game.isPcOn) {
                // Drain extra power (1.5% normally, 3.0% if we are looking at his camera)
                let extraDrain = 1.5;
                if (this.game.isCameraOpen && this.game.ui.currentCam === cat.location) {
                    extraDrain = 3.0;
                }
                this.game.power = Math.max(0, this.game.power - extraDrain * (deltaTime / 1000));
            }

            cat.moveTimer += deltaTime;
            
            // Movement check based on aggression level
            // Aggression 20 = 5 seconds, Aggression 5 = 20 seconds. Divided by difficulty.
            const baseMoveTime = Math.max(3, (25 - cat.aggression) / this.diffMultiplier) * 1000;
            
            if (cat.moveTimer >= baseMoveTime) {
                cat.moveTimer = 0;
                this.tryMove(cat);
            }
        });
    }

    updateOfficeAttack(cat, deltaTime) {
        cat.attackTimer += deltaTime;
        
        // The cat will never retreat. It waits for 5 seconds and then jumpscares!
        // The player MUST shoot the cat to survive.
        if (cat.attackTimer > 5000) {
            this.game.triggerJumpscare(cat);
        }
    }

    isAdjacent(loc1, loc2) {
        if (this.paths[loc1] && this.paths[loc1].includes(loc2)) return true;
        if (this.paths[loc2] && this.paths[loc2].includes(loc1)) return true;
        return false;
    }

    getNextStepTowards(start, target) {
        if (start === target) return null;
        let queue = [[start]];
        let visited = new Set([start]);
        
        while (queue.length > 0) {
            let path = queue.shift();
            let node = path[path.length - 1];
            
            if (node === target) {
                return path[1]; // The first step towards target
            }
            
            for (let neighbor of (this.paths[node] || [])) {
                if (!visited.has(neighbor) && neighbor !== "office") { // don't pathfind through office
                    visited.add(neighbor);
                    queue.push([...path, neighbor]);
                }
            }
        }
        return null;
    }

    tryMove(cat) {
        // Roll dice (1-20) against aggression. We triple the base chance to make early nights less boring.
        // DiffMultiplier amplifies their chances of successfully moving.
        const effectiveAggression = cat.aggression * 3 * this.diffMultiplier;
        const roll = Math.floor(Math.random() * 20) + 1;
        
        // If effective aggression > 20, they move 100% of the time when timer hits
        if (roll <= effectiveAggression) {
            this.move(cat);
        }
    }

    move(cat) {
        let possibleMoves = this.paths[cat.location] || [];
        
        if (possibleMoves.length === 0) return;

        let nextLoc = null;

        // Check audio lure
        if (this.lureActive && this.lureLocation) {
            if (cat.location === this.lureLocation) {
                // Already at the lure, stay there!
                return;
            }
            
            const nextStep = this.getNextStepTowards(cat.location, this.lureLocation);
            if (nextStep) {
                // 80% chance to follow the lure, 20% to ignore it
                if (Math.random() < 0.8) {
                    nextLoc = nextStep;
                }
            }
        }

        // Random move if not lured
        if (!nextLoc) {
            // Prioritize moving toward office (cam1 -> office, cam2 -> cam1) to maintain pressure
            // But sometimes wander.
            const forwardMove = possibleMoves.find(p => p === "office" || p === "cam1");
            
            if (forwardMove && Math.random() > 0.3) {
                nextLoc = forwardMove;
            } else {
                nextLoc = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            }
        }

        // Prevent multiple cats in the office
        if (nextLoc === "office") {
            const catInOffice = Object.values(this.catStates).find(c => c.location === "office" && c.id !== cat.id && !c.isDead);
            if (catInOffice) {
                // The office is occupied! The cat must wait in its current room (usually cam1).
                return;
            }
        }

        const prevLoc = cat.location;
        cat.location = nextLoc;

        if (cat.location === "office") {
            cat.attackTimer = 0;
        }

        this.notifyMove(cat, prevLoc);
    }

    notifyMove(cat, prevLoc) {
        const dist = this.getDistanceToOffice(cat.location);
        let volumeMultiplier = 1.0;
        if (dist === 0) volumeMultiplier = 1.0;
        else if (dist === 1) volumeMultiplier = 1.0;
        else if (dist === 2) volumeMultiplier = 0.6;
        else if (dist === 3) volumeMultiplier = 0.3;
        else if (dist >= 4) volumeMultiplier = 0.1;

        console.log(`${cat.name} moved from ${prevLoc} to ${cat.location} (distance: ${dist}, volume: ${volumeMultiplier})`);

        if (cat.location !== "dead" && cat.config && cat.config.audio && cat.config.audio.move) {
            audioSystem.play('move_' + cat.id, cat.config.audio.move, false, volumeMultiplier);
        }
        
        this.game.ui.updateCameraView(prevLoc, cat.location);
        this.game.ui.updateOfficeThreats(this.catStates);
    }

    getDistanceToOffice(start) {
        if (start === "office" || start === "dead") return 0;
        let queue = [[start, 0]];
        let visited = new Set([start]);
        
        while (queue.length > 0) {
            let [node, dist] = queue.shift();
            
            for (let neighbor of (this.paths[node] || [])) {
                if (neighbor === "office") {
                    return dist + 1;
                }
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([neighbor, dist + 1]);
                }
            }
        }
        return 5; // Far away or default fallback
    }
    
    killCatInOffice() {
        let killed = false;
        Object.keys(this.catStates).forEach(key => {
            const cat = this.catStates[key];
            if (cat.location === "office" && !cat.isDead) {
                cat.isDead = true;
                cat.location = "dead";
                this.notifyMove(cat);
                killed = true;
            }
        });
        return killed;
    }

    getCatAtLocation(locationId) {
        const keys = Object.keys(this.catStates);
        for (let i = 0; i < keys.length; i++) {
            if (this.catStates[keys[i]].location === locationId) {
                return this.catStates[keys[i]];
            }
        }
        return null;
    }

    scareCat(catId) {
        const cat = this.catStates[catId];
        if (cat && cat.location === "office" && !cat.isDead) {
            cat.location = "cam1";
            cat.attackTimer = 0;
            this.notifyMove(cat);
            console.log(`${cat.name} a eu peur de la lumière et a reculé!`);
        }
    }
}
