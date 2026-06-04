class Game {
    constructor(config) {
        this.config = config;
        this.ui = new UI(this);
        this.enemyManager = new EnemyManager(this, config);
        
        this.currentNight = 1;
        this.time = 0; // 0 to 6 (12am to 6am)
        this.timeMs = 0;
        this.power = this.config.settings.maxEnergy;
        
        this.isRunning = false;
        this.isGameOver = false;
        this.isCameraOpen = false;
        
        this.isPcOn = true;
        this.isPcBooting = false;
        
        this.lastTime = 0;
        
        this.tokenSpawnTimer = 0;
        this.activeTokenCam = null;
        this.tokenDuration = 0;
        
        this.sleep = 100;
        this.activeBonus = null;
        this.caffeineLevel = 0;
        this.pendingStart = null;
        this.isPowerOutage = false;
    }

    init() {
        this.ui.init(this.config);
        this.ui.showView('mainMenu');
        
        // Check for saved game
        const savedNight = localStorage.getItem('fnag_night');
        if (savedNight) {
            this.currentNight = parseInt(savedNight);
            const continueBtn = document.getElementById('btn-continue');
            continueBtn.disabled = false;
            continueBtn.addEventListener('click', () => this.startNewGame(false));
        }
    }

    startNewGame(reset = true) {
        if (reset) {
            this.currentNight = 1;
            this.bullets = this.config.settings.bullets || 1;
            localStorage.removeItem('fnag_bullets');
        } else {
            const savedBullets = localStorage.getItem('fnag_bullets');
            this.bullets = savedBullets !== null ? parseInt(savedBullets) : (this.config.settings.bullets || 1);
        }
        
        this.time = 0;
        this.timeMs = 0;
        this.power = this.config.settings.maxEnergy;
        this.isRunning = true;
        this.isGameOver = false;
        this.isCameraOpen = false;
        this.isPcOn = true;
        this.isPcBooting = false;
        this.isPowerOutage = false;
        
        this.tokenSpawnTimer = Math.random() * 20000 + 15000; // 15 to 35s
        this.activeTokenCam = null;
        this.tokenDuration = 0;
        
        const btnPc = document.getElementById('btn-pc-power');
        if (btnPc) {
            btnPc.innerText = "PC: ON";
            btnPc.disabled = false;
        }
        
        document.getElementById('btn-shoot').innerText = `TIRER (${this.bullets})`;
        document.getElementById('ammo-count').innerText = this.bullets;
        
        if (typeof audioSystem !== 'undefined') {
            audioSystem.stopAmbiance();
        }
        
        // Reset UI
        document.getElementById('btn-monitor-toggle').style.display = 'block';
        
        let diffMultiplier = parseFloat(localStorage.getItem('fnag_diff')) || 1.0;
        let activeCats = this.ui.activeCats;
        
        if (!this.ui.isCustomNight) {
            // Progression prédéfinie de l'histoire
            switch(this.currentNight) {
                case 1:
                    activeCats = ['gro'];
                    diffMultiplier = 0.5; // Facile
                    break;
                case 2:
                    activeCats = ['gro', 'piti_roux', 'choupette'];
                    diffMultiplier = 0.5; // Facile
                    break;
                case 3:
                    activeCats = ['gro', 'piti_roux', 'choupette'];
                    diffMultiplier = 1.0; // Normal
                    break;
                case 4:
                    activeCats = ['gro', 'piti_roux', 'choupette', 'choupi', 'chat_patate'];
                    diffMultiplier = 2.0; // Difficile
                    break;
                case 5:
                default:
                    activeCats = ['gro', 'piti_roux', 'choupette', 'choupi', 'chat_patate', 'coupain'];
                    diffMultiplier = 4.0; // Cauchemar
                    break;
            }
        }
        
        this.enemyManager.init(this.currentNight, activeCats, diffMultiplier);
        
        this.ui.setTurnAround(false);
        this.ui.showView('office');
        
        // Reset sleep & caffeine
        this.sleep = 100;
        this.caffeineLevel = 0;
        this.activeBonus = null;

        if (reset) {
            // Show newspaper screen
            this.ui.showNewspaper();
            this.pendingStart = { activeCats, diffMultiplier };
        } else {
            this.enemyManager.init(this.currentNight, activeCats, diffMultiplier);
            
            // Mochi : 1% de chance d'apparaitre à chaque nuit (hors custom night)
            if (!this.ui.isCustomNight && this.config.cats['mochi']) {
                if (Math.random() < 0.01) {
                    this.enemyManager.scheduleMonchiSpawn();
                }
            }

            this.ui.setTurnAround(false);
            this.ui.showView('office');
            this.ui.updateSleepOverlay(this.sleep);
            
            // Check if we should prompt for a bonus
            const showBonus = this.currentNight >= 3 || (this.currentNight === 1 && this.ui.isBonusNight1Enabled);
            
            if (showBonus) {
                this.ui.showBonusSelection();
            } else {
                this._startLoop();
            }
        }
    }

    continueFromNewspaper() {
        if (!this.pendingStart) return;
        const { activeCats, diffMultiplier } = this.pendingStart;
        this.pendingStart = null;

        this.ui.hideNewspaper();
        this.enemyManager.init(this.currentNight, activeCats, diffMultiplier);

        // Mochi : 1% de chance d'apparaitre à chaque nuit (hors custom night)
        if (!this.ui.isCustomNight && this.config.cats['mochi']) {
            if (Math.random() < 0.01) {
                this.enemyManager.scheduleMonchiSpawn();
            }
        }

        this.ui.setTurnAround(false);
        this.ui.showView('office');
        this.ui.updateSleepOverlay(this.sleep);

        // Check if we should prompt for a bonus
        const showBonus = this.currentNight >= 3 || (this.currentNight === 1 && this.ui.isBonusNight1Enabled);

        if (showBonus) {
            this.ui.showBonusSelection();
        } else {
            this._startLoop();
        }
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.updateTime(deltaTime);
        this.updatePower(deltaTime);
        this.updateSleep(deltaTime);
        this.enemyManager.update(deltaTime);
        this.updateToken(deltaTime);
        
        this.updateHUD();

        if (this.isRunning) {
            requestAnimationFrame((t) => this.loop(t));
        }
    }
    
    updateToken(deltaTime) {
        if (this.activeTokenCam) {
            this.tokenDuration -= deltaTime;
            if (this.tokenDuration <= 0) {
                // Token despawns
                this.activeTokenCam = null;
                this.tokenSpawnTimer = Math.random() * 20000 + 15000;
                this.ui.updateCameraView();
            }
        } else {
            this.tokenSpawnTimer -= deltaTime;
            if (this.tokenSpawnTimer <= 0) {
                // Spawn token
                const cameras = this.config.cameras.map(c => c.id);
                this.activeTokenCam = cameras[Math.floor(Math.random() * cameras.length)];
                this.tokenDuration = Math.random() * 5000 + 10000; // Stays for 10-15s
                this.ui.updateCameraView();
            }
        }
    }
    
    collectToken() {
        if (this.activeTokenCam) {
            this.bullets++;
            document.getElementById('btn-shoot').innerText = `TIRER (${this.bullets})`;
            document.getElementById('ammo-count').innerText = this.bullets;
            
            this.activeTokenCam = null;
            this.tokenSpawnTimer = Math.random() * 20000 + 15000;
            this.ui.updateCameraView();
            
            if (typeof audioSystem !== 'undefined') {
                audioSystem.play('ui', 'assets/audio/sfx/ui_click.mp3');
            }
        }
    }

    updateTime(deltaTime) {
        const msPerGameHour = (this.config.settings.nightDurationSeconds * 1000) / 6;
        this.timeMs += deltaTime;
        
        const currentHour = Math.floor(this.timeMs / msPerGameHour);
        if (currentHour > this.time) {
            this.time = currentHour;
            if (this.time >= 6) {
                this.winNight();
            }
        }
    }

    calculateUsage() {
        let usage = this.isPcOn ? 1 : 0; // Base usage is 0 if PC is off
        if (this.isCameraOpen) usage += 1;
        if (this.ui.isFlashlightOn) usage += 1;
        
        // Cap usage visual to 5 bars
        if (usage > 5) usage = 5;
        return usage;
    }
    
    togglePc() {
        if (this.isPcBooting) return;
        
        const btnPc = document.getElementById('btn-pc-power');
        
        if (!this.isPcOn) {
            // Turn on (takes 5 seconds)
            this.isPcBooting = true;
            if (btnPc) btnPc.innerText = "BOOTING...";
            if (typeof audioSystem !== 'undefined') audioSystem.play('pc_on', 'assets/audio/sfx/pc_on.mp3');
            
            setTimeout(() => {
                if (this.isRunning && !this.isGameOver && this.power > 0) {
                    this.isPcBooting = false;
                    this.isPcOn = true;
                    if (btnPc) btnPc.innerText = "PC: ON";
                    this.ui.updateDeskSprite();
                }
            }, 5000);
        } else {
            // Turn off (instant)
            this.isPcOn = false;
            if (btnPc) btnPc.innerText = "PC: OFF";
            if (typeof audioSystem !== 'undefined') audioSystem.play('pc_off', 'assets/audio/sfx/pc_off.mp3');
            
            // Force close monitor if open
            if (this.isCameraOpen) {
                this.ui.toggleMonitor();
            }
        }
    }

    updatePower(deltaTime) {
        if (this.isPowerOutage) return;

        let drainRate = this.config.settings.energyDrainRate;
        const usage = this.calculateUsage();
        
        // Drain multiplier perfectly scales with usage bars
        drainRate *= usage;
        
        this.power -= drainRate * (deltaTime / 1000); // per second

        if (this.power <= 0) {
            this.power = 0;
            this.isPowerOutage = true;
            this.triggerPowerOutage();
        }
    }

    updateHUD() {
        // Calculate total in-game minutes passed (0 to 360 minutes for 6 hours)
        const progress = this.timeMs / (this.config.settings.nightDurationSeconds * 1000);
        const totalMinutes = Math.floor(progress * 6 * 60);
        
        const hour = Math.floor(totalMinutes / 60);
        const min = totalMinutes % 60;
        
        const displayHour = hour === 0 ? 12 : hour;
        const displayMin = min < 10 ? `0${min}` : min;
        
        const timeStr = `${displayHour}:${displayMin}`;
        
        this.ui.updateHUD(timeStr, `Night ${this.currentNight}`, this.power, this.calculateUsage());
    }

    triggerPowerOutage() {
        this.isPowerOutage = true;
        this.ui.powerOutage();
        this.isPcOn = false;
        this.isPcBooting = false;
        
        if (typeof audioSystem !== 'undefined') {
            audioSystem.play('power_down', 'assets/audio/sfx/power_down.mp3');
            audioSystem.stopAmbiance();
        }
        
        // Wait 3 seconds before Gro's music starts
        setTimeout(() => {
            if (this.isGameOver) return;
            
            if (typeof audioSystem !== 'undefined') {
                audioSystem.play('gro_music', 'assets/audio/sfx/gro_music.mp3');
            }
            
            // Random delay between 4 and 10 seconds before the actual jumpscare
            const attackDelay = Math.random() * 6000 + 4000;
            
            setTimeout(() => {
                if (!this.isGameOver) {
                    if (typeof audioSystem !== 'undefined') {
                        audioSystem.stop('gro_music', 'assets/audio/sfx/gro_music.mp3');
                    }
                    
                    const groConfig = this.config.cats['gro'];
                    if (groConfig) {
                        const groObj = {
                            config: {
                                ...groConfig,
                                audio: {
                                    ...groConfig.audio
                                }
                            }
                        };
                        // Play the extra sound manually, the base scream will play inside triggerJumpscare
                        if (typeof audioSystem !== 'undefined') {
                            audioSystem.play('loosegro', 'assets/audio/sfx/loosegro.mp3');
                        }
                        this.triggerJumpscare(groObj);
                    } else {
                        // Fallback
                        if (typeof audioSystem !== 'undefined') {
                            audioSystem.play('loosegro', 'assets/audio/sfx/loosegro.mp3');
                        }
                        this.triggerJumpscare({ config: { image: '', audio: { jumpscare: 'assets/audio/jumpscare/scream.mp3' } }});
                    }
                }
            }, attackDelay);
            
        }, 3000);
    }

    shootGun() {
        if (this.bullets <= 0) return;
        
        // Prevent shooting if no MORTAL cat is in the office
        // (Mochi is immortal and can't be killed by the gun)
        const hasMortalCat = Object.values(this.enemyManager.catStates).some(
            c => c.location === "office" && !c.isDead && !c.config.immortal
        );
        const hasAnyCat = Object.values(this.enemyManager.catStates).some(
            c => c.location === "office" && !c.isDead
        );

        if (!hasAnyCat) {
            console.log("Personne à tirer !");
            return;
        }

        if (!hasMortalCat) {
            // Seul Mochi est là : le coup de feu part mais ne le tue pas
            console.log("Mochi est invincible, la balle ne fait rien !");
            if (typeof audioSystem !== 'undefined') {
                audioSystem.play('gun', 'assets/audio/sfx/gunshot.mp3');
            }
            this.ui.playShootAnimation();
            // Muzzle flash sans dépenser de balle
            const officeViewMochi = document.getElementById('office-view');
            for (let i = 0; i < 15; i++) {
                const p = document.createElement('div');
                p.className = 'particle muzzle-particle';
                p.style.width = (Math.random() * 15 + 5) + 'px';
                p.style.height = p.style.width;
                p.style.bottom = (20 + Math.random() * 10) + '%';
                p.style.right = (15 + Math.random() * 15) + '%';
                if (officeViewMochi) officeViewMochi.appendChild(p);
                setTimeout(() => p.remove(), 200);
            }
            return;
        }
        
        this.bullets--;
        document.getElementById('btn-shoot').innerText = `TIRER (${this.bullets})`;
        document.getElementById('ammo-count').innerText = this.bullets;
        
        if (typeof audioSystem !== 'undefined') {
            audioSystem.play('gun', 'assets/audio/sfx/gunshot.mp3');
        }
        
        // Jouer l'animation de l'arme
        this.ui.playShootAnimation();
        
        // Muzzle flash particles
        const officeView = document.getElementById('office-view');
        for (let i = 0; i < 15; i++) {
            const p = document.createElement('div');
            p.className = 'particle muzzle-particle';
            p.style.width = (Math.random() * 15 + 5) + 'px';
            p.style.height = p.style.width;
            p.style.bottom = (20 + Math.random() * 10) + '%';
            p.style.right = (15 + Math.random() * 15) + '%';
            if (officeView) officeView.appendChild(p);
            setTimeout(() => p.remove(), 200);
        }
        
        const killed = this.enemyManager.killCatInOffice();
        if (killed) {
            console.log("Cat killed by player!");
            // Screen flash effect
            this.ui.officeBg.style.backgroundColor = '#fff';
            setTimeout(() => {
                this.ui.officeBg.style.backgroundColor = 'transparent';
            }, 100);
            
            // Blood particles
            for (let i = 0; i < 40; i++) {
                const b = document.createElement('div');
                b.className = 'particle blood-particle';
                b.style.width = (Math.random() * 8 + 4) + 'px';
                b.style.height = b.style.width;
                b.style.top = '40%';
                b.style.left = '50%';
                
                // Random spread vector
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 300 + 50;
                b.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
                b.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
                
                if (officeView) officeView.appendChild(b);
                setTimeout(() => b.remove(), 500);
            }
        }
    }

    triggerJumpscare(cat) {
        this.isGameOver = true;
        this.isRunning = false;
        
        this.ui.setGameOverReason(`Attaqué par ${cat.config.name || 'un chat'}`);
        this.ui.triggerJumpscare(cat);
        
        setTimeout(() => {
            this.ui.showView('gameOver');
        }, 2000);
    }

    winNight() {
        this.isRunning = false;
        this.ui.playWinAnimation(this.currentNight);
        
        // Save progress
        if (this.currentNight < this.config.settings.nights) {
            localStorage.setItem('fnag_night', this.currentNight + 1);
            localStorage.setItem('fnag_bullets', this.bullets);

            // Attendre que le son de victoire soit fini (+ marge de 2s) avant de passer
            const winSoundKey = 'win_assets/audio/sfx/6am.mp3';
            const winSound = typeof audioSystem !== 'undefined' ? audioSystem.sounds[winSoundKey] : null;

            const proceedToNextNight = () => {
                this.currentNight++;
                this.startNewGame(false);
            };

            if (winSound && winSound.duration && isFinite(winSound.duration)) {
                // Attendre la fin du son + 2 secondes de pause
                const soundDurationMs = winSound.duration * 1000;
                const waitMs = soundDurationMs + 2000;
                setTimeout(proceedToNextNight, waitMs);
            } else {
                // Fallback : écouter l'événement 'ended' ou 8s max
                const fallbackTimer = setTimeout(proceedToNextNight, 8000);
                if (winSound) {
                    winSound.addEventListener('ended', () => {
                        clearTimeout(fallbackTimer);
                        setTimeout(proceedToNextNight, 2000);
                    }, { once: true });
                }
            }
        } else {
            // Beat the game
            setTimeout(() => {
                document.getElementById('win-subtitle').innerText = "Vous avez terminé le jeu !";
                setTimeout(() => {
                    this.ui.showView('mainMenu');
                }, 5000);
            }, 5000);
        }
    }

    updateSleep(deltaTime) {
        if (this.isGameOver || !this.isRunning) return;

        // Base rate: lose 1.8% per second. If Cafeine Pure (Bonus 1) is active, drain 30% slower
        let drain = 1.8;
        if (this.activeBonus === 1) {
            drain *= 0.7; // 30% reduction
        }

        this.sleep = Math.max(0, this.sleep - drain * (deltaTime / 1000));

        // Caffeine level decays over time (15% per second)
        this.caffeineLevel = Math.max(0, this.caffeineLevel - 15 * (deltaTime / 1000));

        // Visual overlay opacity update
        this.ui.updateSleepOverlay(this.sleep);

        if (this.sleep <= 0) {
            this.triggerSleepOutage();
        }
    }

    drinkCoffee() {
        if (this.isGameOver || !this.isRunning) return;

        // Add caffeine (35% increase)
        this.caffeineLevel += 35;
        if (this.caffeineLevel >= 100) {
            this.triggerCaffeineOverdose();
            return;
        }

        this.sleep = Math.min(100, this.sleep + 25);
        this.ui.updateSleepOverlay(this.sleep);

        if (typeof audioSystem !== 'undefined') {
            audioSystem.play('slurp', 'assets/audio/sfx/coffee.mp3');
        }
    }

    triggerCaffeineOverdose() {
        this.isGameOver = true;
        this.isRunning = false;

        if (typeof audioSystem !== 'undefined') {
            audioSystem.stopAmbiance();
            audioSystem.play('overdose', 'assets/audio/sfx/avc.mp3');
        }

        // Attendre 4 secondes après le son avant d'afficher l'écran de mort
        setTimeout(() => {
            this.ui.setGameOverReason("ARRÊT CARDIAQUE (OVERDOSE DE CAFÉINE)");
            this.ui.showView('gameOver');
        }, 4000);
    }

    triggerSleepOutage() {
        // Stop the game loop immediately
        this.isGameOver = true;
        this.isRunning = false;

        if (typeof audioSystem !== 'undefined') {
            audioSystem.stopAmbiance();
        }

        // --- Step 1: Fade to black (joueur qui s'endort) ---
        const sleepOverlay = document.getElementById('sleep-overlay');
        if (sleepOverlay) {
            sleepOverlay.style.transition = 'opacity 1.2s ease-in';
            sleepOverlay.style.opacity = '1';
        }

        // --- Step 2: 1.8s later — "réveil brutal", le joueur se retourne ---
        setTimeout(() => {
            // Clear sleep overlay
            if (sleepOverlay) {
                sleepOverlay.style.transition = 'opacity 0.6s ease-out';
                sleepOverlay.style.opacity = '0';
            }

            // Force turn-around to back wall — Locky sera visible sur le côté
            // On bypass la vérification power (le courant peut encore être OK)
            this.ui.forceTurnAroundForLocky();

            // --- Step 3: 0.7s after wake-up — Locky glisse en vue depuis le côté ---
            setTimeout(() => {
                this.ui.showLockySide();

                // --- Step 4: Attaque aléatoire entre 5 et 10 secondes ---
                const attackDelay = Math.random() * 5000 + 5000;
                setTimeout(() => {
                    this.ui.hideLockySide();

                    const lockyConfig = {
                        config: {
                            name: "Locky",
                            images: {
                                jumpscare: "assets/images/cats/locky_jumpscare.png"
                            },
                            audio: {
                                jumpscare: "assets/audio/jumpscare/scream.mp3"
                            }
                        }
                    };

                    this.ui.setGameOverReason("Tu t'es endormi... Locky en a profité !");
                    this.ui.triggerJumpscare(lockyConfig);

                    setTimeout(() => {
                        this.ui.showView('gameOver');
                    }, 2000);

                }, attackDelay);

            }, 700);

        }, 1800);
    }

    applyBonus(bonusId) {
        this.activeBonus = bonusId;
        
        // Double ammo
        if (bonusId === 2) {
            this.bullets++;
            document.getElementById('btn-shoot').innerText = `TIRER (${this.bullets})`;
            document.getElementById('ammo-count').innerText = this.bullets;
        }

        // Super lure: change cooldown (handled in EnemyManager/UI)
        this.ui.hideBonusSelection();
        this._startLoop();
    }

    /**
     * Démarre le game loop et verrouille la caméra 3 secondes au début de la nuit.
     */
    _startLoop() {
        // Verrouiller le bouton caméra au lancement
        const btn = this.ui.btnMonitorToggle;
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.4';
            setTimeout(() => {
                if (!this.isGameOver && this.isRunning) {
                    btn.disabled = false;
                    btn.style.opacity = '';
                }
            }, 3000);
        }
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }
}
