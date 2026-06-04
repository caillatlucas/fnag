class UI {
    constructor(game) {
        this.game = game;
        this.currentCam = "cam1";
        this.isTurnedAround = false;
        this.isFlashlightOn = false;
        this.audioCooldown = false;
        
        const savedCats = localStorage.getItem('fnag_cats');
        if (savedCats) {
            this.activeCats = JSON.parse(savedCats);
        } else {
            this.activeCats = ['gro', 'piti_roux', 'choupette'];
        }
        
        this.wasHackedSoundPlayed = false;
        
        // Elements
        this.views = {
            mainMenu: document.getElementById('main-menu'),
            office: document.getElementById('office-view'),
            camera: document.getElementById('camera-view'),
            jumpscare: document.getElementById('jumpscare-overlay'),
            gameOver: document.getElementById('game-over-screen'),
            win: document.getElementById('win-screen')
        };
        
        this.officeBg = document.getElementById('office-bg');
        this.deskSprite = document.getElementById('desk-sprite');
        this.officeCatSprite = document.getElementById('office-cat-sprite');
        this.officeLightOverlay = document.getElementById('office-light-overlay');
        this.gunSprite = document.getElementById('gun-sprite');
        
        this.menuCatsContainer = document.getElementById('menu-cats-container');
        this.btnBackMenu = document.getElementById('btn-back-menu');
        
        this.btnSettings = document.getElementById('btn-settings');
        this.settingsPanel = document.getElementById('settings-panel');
        this.btnCloseSettings = document.getElementById('btn-close-settings');
        this.catTogglesContainer = document.getElementById('cat-toggles');
        this.difficultySelect = document.getElementById('ai-difficulty');
        this.customNightToggle = document.getElementById('custom-night-toggle');
        this.redDotsToggle = document.getElementById('red-dots-toggle');
        
        this.musicVolumeSlider = document.getElementById('music-volume');
        this.sfxVolumeSlider = document.getElementById('sfx-volume');
        
        // Load custom night state
        const savedCustomNight = localStorage.getItem('fnag_custom_night');
        this.isCustomNight = savedCustomNight === 'true';
        if (this.customNightToggle) {
            this.customNightToggle.checked = this.isCustomNight;
        }
        
        // Load red dots state
        const savedRedDots = localStorage.getItem('fnag_red_dots');
        this.showRedDots = savedRedDots === 'true'; // false by default
        if (this.redDotsToggle) {
            this.redDotsToggle.checked = this.showRedDots;
        }

        // Load bonus night 1 state
        const savedBonusNight1 = localStorage.getItem('fnag_bonus_night1');
        this.isBonusNight1Enabled = savedBonusNight1 === 'true'; // false by default
        this.bonusNight1Toggle = document.getElementById('bonus-night1-toggle');
        if (this.bonusNight1Toggle) {
            this.bonusNight1Toggle.checked = this.isBonusNight1Enabled;
        }
        
        // Load difficulty
        const savedDiff = localStorage.getItem('fnag_diff');
        if (savedDiff && this.difficultySelect) {
            this.difficultySelect.value = savedDiff;
        }

        // Load volume sliders values
        if (this.musicVolumeSlider) {
            this.musicVolumeSlider.value = localStorage.getItem('fnag_music_vol') ?? '1.0';
        }
        if (this.sfxVolumeSlider) {
            this.sfxVolumeSlider.value = localStorage.getItem('fnag_sfx_vol') ?? '1.0';
        }
        
        this.btnTurnAround = document.getElementById('btn-turn-around');
        this.btnFlashlight = document.getElementById('btn-flashlight');
        this.btnShoot = document.getElementById('btn-shoot');
        this.btnPlayAudio = document.getElementById('btn-play-audio');
        this.btnMonitorToggle = document.getElementById('btn-monitor-toggle');
        this.monitorCloseBtn = document.getElementById('btn-monitor-close');
        
        this.camBg = document.getElementById('current-cam-bg');
        this.cameraCatSprite = document.getElementById('camera-cat-sprite');
        this.ammoToken = document.getElementById('ammo-token');
        this.camName = document.getElementById('camera-name');
        this.mapContainer = document.getElementById('map-buttons-container');
        
        this.timeDisplay = document.getElementById('current-time');
        this.nightDisplay = document.getElementById('current-night');
        this.powerDisplay = document.getElementById('power-left');
        this.usageBars = document.getElementById('usage-bars');
        this.btnPcPower = document.getElementById('btn-pc-power');
        
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('btn-start-game').addEventListener('click', (e) => {
            if (e.currentTarget) e.currentTarget.blur();
            this.game.startNewGame();
        });

        this.btnMonitorToggle.addEventListener('click', () => this.toggleMonitor());
        this.monitorCloseBtn.addEventListener('click', () => this.toggleMonitor());

        this.btnTurnAround.addEventListener('click', () => {
            this.setTurnAround(!this.isTurnedAround);
        });
        
        if (this.btnPcPower) {
            this.btnPcPower.addEventListener('click', () => {
                if (this.game && typeof this.game.togglePc === 'function') {
                    this.game.togglePc();
                    this.updateDeskSprite();
                }
            });
        }
        
        this.btnFlashlight.addEventListener('click', () => {
            this.toggleFlashlight();
        });
        
        this.btnShoot.addEventListener('click', () => {
            if(this.game && typeof this.game.shootGun === 'function') {
                this.game.shootGun();
            }
        });
        
        this.btnPlayAudio.addEventListener('click', () => this.playAudioLure());
        
        this.btnBackMenu.addEventListener('click', () => {
            // Simple hard reload to ensure clean state
            window.location.reload();
        });
        
        if (this.ammoToken) {
            this.ammoToken.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.game && typeof this.game.collectToken === 'function') {
                    this.game.collectToken();
                }
            });
        }
        
        this.btnSettings.addEventListener('click', () => {
            this.settingsPanel.classList.remove('hidden');
        });
        
        this.btnCloseSettings.addEventListener('click', () => {
            this.settingsPanel.classList.add('hidden');
        });
        
        // UI Sounds for all buttons in the main menu
        document.querySelectorAll('#main-menu button').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.blur();
                if (typeof audioSystem !== 'undefined' && !btn.disabled) {
                    audioSystem.play('ui_click', 'assets/audio/sfx/ui_click.mp3');
                }
            });
            btn.addEventListener('mouseenter', () => {
                if (typeof audioSystem !== 'undefined' && !btn.disabled) {
                    audioSystem.play('ui_hover', 'assets/audio/sfx/ui_hover.mp3');
                }
            });
        });

        if (this.musicVolumeSlider) {
            this.musicVolumeSlider.addEventListener('input', (e) => {
                if (typeof audioSystem !== 'undefined') {
                    audioSystem.setMusicVolume(e.target.value);
                }
            });
        }

        if (this.sfxVolumeSlider) {
            this.sfxVolumeSlider.addEventListener('input', (e) => {
                if (typeof audioSystem !== 'undefined') {
                    audioSystem.setSfxVolume(e.target.value);
                }
            });
        }

        if (this.difficultySelect) {
            this.difficultySelect.addEventListener('change', (e) => {
                if (typeof audioSystem !== 'undefined') audioSystem.play('ui', 'assets/audio/sfx/ui_click.mp3');
                localStorage.setItem('fnag_diff', e.target.value);
            });
        }
        
        if (this.customNightToggle) {
            this.customNightToggle.addEventListener('change', (e) => {
                if (typeof audioSystem !== 'undefined') audioSystem.play('ui', 'assets/audio/sfx/ui_click.mp3');
                this.isCustomNight = e.target.checked;
                localStorage.setItem('fnag_custom_night', this.isCustomNight);
                this.updateSettingsUI();
            });
        }
        
        if (this.redDotsToggle) {
            this.redDotsToggle.addEventListener('change', (e) => {
                if (typeof audioSystem !== 'undefined') audioSystem.play('ui_click', 'assets/audio/sfx/ui_click.mp3');
                this.showRedDots = e.target.checked;
                localStorage.setItem('fnag_red_dots', this.showRedDots);
                if (this.views && this.views.camera && this.views.camera.classList.contains('active')) {
                    this.updateCameraView();
                }
            });
        }

        if (this.bonusNight1Toggle) {
            this.bonusNight1Toggle.addEventListener('change', (e) => {
                if (typeof audioSystem !== 'undefined') audioSystem.play('ui_click', 'assets/audio/sfx/ui_click.mp3');
                this.isBonusNight1Enabled = e.target.checked;
                localStorage.setItem('fnag_bonus_night1', this.isBonusNight1Enabled);
            });
        }

        // Coffee Cup Click
        const coffeeCup = document.getElementById('coffee-cup-container');
        if (coffeeCup) {
            coffeeCup.addEventListener('click', () => {
                this.game.drinkCoffee();
            });
        }

        // Newspaper Click with fade out
        const newspaper = document.getElementById('newspaper-screen');
        if (newspaper) {
            newspaper.addEventListener('click', () => {
                if (newspaper.style.opacity === '0') return;
                newspaper.style.opacity = '0';
                setTimeout(() => {
                    this.game.continueFromNewspaper();
                    newspaper.style.opacity = ''; // Reset opacity
                }, 500);
            });
        }

        // Bonus buttons
        const btnBonus1 = document.getElementById('btn-bonus-1');
        const btnBonus2 = document.getElementById('btn-bonus-2');
        const btnBonus3 = document.getElementById('btn-bonus-3');
        if (btnBonus1) btnBonus1.addEventListener('click', () => this.game.applyBonus(1));
        if (btnBonus2) btnBonus2.addEventListener('click', () => this.game.applyBonus(2));
        if (btnBonus3) btnBonus3.addEventListener('click', () => this.game.applyBonus(3));
        
        // Debug: Appuyer sur 'l' pour lancer un screamer aléatoire
        document.addEventListener('keydown', (e) => {

            // Raccourcis clavier demandés
            if (!this.game.isGameOver && this.game.isRunning) {
                if (e.key === ' ') {
                    if (this.btnMonitorToggle.style.display !== 'none') {
                        this.toggleMonitor();
                    }
                } else if (e.key.toLowerCase() === 's') {
                    if (!this.btnShoot.disabled && !this.btnShoot.classList.contains('hidden') && typeof this.game.shootGun === 'function') {
                        this.game.shootGun();
                    }
                } else if (e.key.toLowerCase() === 'f') {
                    if (this.views.office.classList.contains('active') && this.btnFlashlight.style.display !== 'none') {
                        this.toggleFlashlight();
                    }
                } else if (e.key.toLowerCase() === 'd') {
                    if (this.views.camera.classList.contains('active') && !this.btnPlayAudio.disabled) {
                        this.playAudioLure();
                    }
                } else if (e.key.toLowerCase() === 'a') {
                    if (this.views.office.classList.contains('active') && !this.isTurnedAround) {
                        if (this.game && typeof this.game.togglePc === 'function') {
                            this.game.togglePc();
                            this.updateDeskSprite();
                        }
                    }
                } else if (e.key.toLowerCase() === 'q') {
                    if (this.views.office.classList.contains('active')) {
                        this.setTurnAround(!this.isTurnedAround);
                    }
                } else if (e.key.toLowerCase() === 'z') {
                    if (this.views.office.classList.contains('active') && !this.isTurnedAround) {
                        this.game.drinkCoffee();
                    }
                } else if (e.key.toLowerCase() === 'm') {
                    // Touche M : faire spawner Mochi dans le bureau
                    if (this.game && this.game.enemyManager) {
                        this.game.enemyManager.spawnMochi();
                    }
                } else if (['1', '2', '3', '4', '&', 'é', '"', "'"].includes(e.key)) {
                    if (this.views.camera.classList.contains('active')) {
                        let camNum = e.key;
                        if (e.key === '&') camNum = '1';
                        if (e.key === 'é') camNum = '2';
                        if (e.key === '"') camNum = '3';
                        if (e.key === "'") camNum = '4';
                        
                        const camId = `cam${camNum}`;
                        // Check if button exists to ensure camera exists
                        if (document.getElementById(`btn-${camId}`)) {
                            this.switchCamera(camId);
                        }
                    }
                }
            }

            if (e.key.toLowerCase() === 'l' && this.game && this.game.config && this.game.config.cats) {
                console.log("Touche L pressée : Lancement du screamer !");
                const catsConfig = Object.values(this.game.config.cats);
                const randomCatConfig = catsConfig[Math.floor(Math.random() * catsConfig.length)];
                
                const dummyCat = {
                    config: randomCatConfig
                };
                
                if (this.game && typeof this.game.triggerJumpscare === 'function') {
                    this.game.triggerJumpscare(dummyCat);
                }
            }
        });

        // Autoplay menu music on first user interaction or directly if browser allows
        let menuMusicPlayed = false;
        
        const tryPlayMenuMusic = () => {
            if (!menuMusicPlayed && this.views.mainMenu.classList.contains('active')) {
                if (typeof audioSystem !== 'undefined') {
                    const promise = audioSystem.playAmbiance('assets/audio/menu.mp3');
                    if (promise) {
                        promise.then(() => {
                            menuMusicPlayed = true;
                        }).catch(() => {
                            menuMusicPlayed = false;
                        });
                    } else {
                        menuMusicPlayed = true;
                    }
                }
            }
        };

        // Try playing immediately (might be blocked by browser autoplay policy)
        setTimeout(tryPlayMenuMusic, 500);
        
        // Fallback for browsers that block autoplay
        document.body.addEventListener('click', tryPlayMenuMusic);
    }

    init(config) {
        // Initialize Office Sprites
        if (config.office) {
            this.officeBg.style.backgroundImage = `url('${config.office.deskImage}')`;
            this.deskSprite.src = config.office.deskSprite;
            
            if (config.office.catPosition) {
                this.officeCatSprite.style.bottom = config.office.catPosition.bottom || "10%";
                this.officeCatSprite.style.left = config.office.catPosition.left || "50%";
                this.officeCatSprite.style.height = config.office.catPosition.height || "60%";
            }
        }
        
        // Initialize Menu Cats
        this.menuCatsContainer.innerHTML = '';
        const catKeys = Object.keys(config.cats);
        catKeys.forEach((key, index) => {
            const cat = config.cats[key];
            if (cat.images.sprite) {
                const img = document.createElement('img');
                img.src = cat.images.sprite;
                img.className = 'menu-cat-sprite';
                img.id = `menu-cat-${key}`;
                // Random position
                const leftPos = 10 + (index * 15) + (Math.random() * 10);
                img.style.left = `${leftPos}%`;
                img.style.transform = (Math.random() > 0.5) ? 'scaleX(-1)' : 'scaleX(1)';
                this.menuCatsContainer.appendChild(img);
            }
            
            // Mochi ne peut pas être sélectionné dans le custom night
            if (cat.noCustomNight) return;

            // Build Settings Toggle
            const label = document.createElement('label');
            label.className = 'toggle-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = key;
            if (this.activeCats.includes(key)) {
                checkbox.checked = true;
            }
            
        // Set up active toggles
            checkbox.addEventListener('change', (e) => {
                if (typeof audioSystem !== 'undefined') audioSystem.play('ui', 'assets/audio/sfx/ui_click.mp3');
                if (e.target.checked) {
                    if (!this.activeCats.includes(key)) this.activeCats.push(key);
                } else {
                    this.activeCats = this.activeCats.filter(k => k !== key);
                }
                localStorage.setItem('fnag_cats', JSON.stringify(this.activeCats));
            });

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(cat.name));
            this.catTogglesContainer.appendChild(label);
        });
        
        this.updateSettingsUI();
        
        // Menu Cats Twitch/Twitch Animation loop
        setInterval(() => {
            if (this.views.mainMenu.classList.contains('active')) {
                const cats = document.querySelectorAll('.menu-cat-sprite');
                if (cats.length > 0) {
                    // Hide all
                    cats.forEach(c => c.classList.remove('visible'));
                    // Show 1 or 2 random cats
                    const showCount = Math.floor(Math.random() * 2) + 1;
                    for(let i = 0; i < showCount; i++) {
                        const randomCat = cats[Math.floor(Math.random() * cats.length)];
                        randomCat.classList.add('visible');
                    }
                }
            }
        }, 3000);

        // Initialize Map
        this.mapButtons = [];
        this.mapContainer = document.getElementById('map-buttons-container');
        this.mapContainer.innerHTML = '';
        
        // Add SECU Icon to map
        const secuBtn = document.createElement('div');
        secuBtn.className = 'cam-btn secu-icon';
        secuBtn.id = 'btn-secu';
        secuBtn.innerText = 'SECU';
        secuBtn.style.left = '5%';
        secuBtn.style.bottom = '30%';
        secuBtn.style.backgroundColor = '#800';
        secuBtn.style.color = '#f00';
        secuBtn.style.border = 'none';
        secuBtn.style.cursor = 'default';
        secuBtn.style.fontWeight = 'bold';
        secuBtn.style.zIndex = '10';
        this.mapContainer.appendChild(secuBtn);
        
        // Draw SVG lines between cameras
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.style.position = 'absolute';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.zIndex = '1';
        
        const drawLine = (x1, y1, x2, y2) => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            // Map uses bottom/left. SVG uses top/left.
            // SVG Y = 100 - bottom
            // Button centers are offset by width/height so we add a little offset
            line.setAttribute("x1", `calc(${x1}% + 25px)`);
            line.setAttribute("y1", `calc(${100 - y1}% - 15px)`);
            line.setAttribute("x2", `calc(${x2}% + 25px)`);
            line.setAttribute("y2", `calc(${100 - y2}% - 15px)`);
            line.setAttribute("stroke", "#fff");
            line.setAttribute("stroke-width", "2");
            line.setAttribute("stroke-dasharray", "5,5");
            svg.appendChild(line);
        };

        // Connections based on enemy paths
        // cam3(50, 50) - cam1(20, 30)
        drawLine(50, 50, 20, 30);
        // cam2(80, 50) - cam3(50, 50)
        drawLine(80, 50, 50, 50);
        // cam2(80, 50) - cam4(50, 80)
        drawLine(80, 50, 50, 80);
        // cam1(20, 30) - office(secu 5, 30)
        drawLine(20, 30, 5, 30);
        
        this.mapContainer.appendChild(svg);
        
        if (typeof audioSystem !== 'undefined') {
            audioSystem.preload('lure', 'assets/audio/sfx/lure.mp3');
            audioSystem.preload('gun', 'assets/audio/sfx/gunshot.mp3');
            audioSystem.preload('turn', 'assets/audio/sfx/turn.mp3');
            audioSystem.preload('win', 'assets/audio/sfx/6am.mp3');
            audioSystem.preload('cam_switch', 'assets/audio/sfx/camera_switch.mp3');
            audioSystem.preload('flashlight', 'assets/audio/sfx/flashlight.mp3');
            audioSystem.preload('slurp', 'assets/audio/sfx/coffee.mp3');
            audioSystem.preload('ui_click', 'assets/audio/sfx/ui_click.mp3');
            audioSystem.preload('ui_hover', 'assets/audio/sfx/ui_hover.mp3');
            audioSystem.preload('hacker_static', 'assets/audio/sfx/hacker_static.mp3');
            audioSystem.preload('overdose', 'assets/audio/sfx/avc.mp3');
            if (config.cats) {
                Object.keys(config.cats).forEach(catId => {
                    const cat = config.cats[catId];
                    if (cat.audio && cat.audio.move) audioSystem.preload('move_' + catId, cat.audio.move);
                    if (cat.audio && cat.audio.jumpscare) audioSystem.preload('jump', cat.audio.jumpscare);
                });
            }
        }

        config.cameras.forEach(cam => {
            const btn = document.createElement('button');
            btn.className = 'cam-btn';
            btn.id = `btn-${cam.id}`;
            btn.innerText = cam.id.toUpperCase();
            btn.style.left = `${cam.position.x}%`;
            btn.style.bottom = `${cam.position.y}%`;
            
            btn.style.zIndex = '10';
            btn.addEventListener('click', () => this.switchCamera(cam.id));
            this.mapContainer.appendChild(btn);
        });
        
        if (config.cameras.length > 0) {
            this.currentCam = config.cameras[0].id;
        }
    }

    showView(viewName) {
        Object.values(this.views).forEach(v => {
            if(v) v.classList.remove('active');
            if(v) v.classList.add('hidden');
        });
        
        if (this.views[viewName]) {
            this.views[viewName].classList.remove('hidden');
            this.views[viewName].classList.add('active');
        }
    }

    toggleMonitor() {
        if (this.game.power <= 0 || this.isTurnedAround) return;
        
        // Cannot open monitor if PC is off
        if (!this.game.isPcOn && !this.views.camera.classList.contains('active')) {
            return;
        }

        const isCamActive = this.views.camera.classList.contains('active');
        
        // Remove effects to reset them
        this.views.office.classList.remove('turn-effect');
        this.views.camera.classList.remove('turn-effect');
        
        if (isCamActive) {
            this.showView('office');
            this.game.isCameraOpen = false;
            
            // Add effect to office
            void this.views.office.offsetWidth;
            this.views.office.classList.add('turn-effect');
            
            if (typeof audioSystem !== 'undefined') audioSystem.play('cam_switch', 'assets/audio/sfx/camera_switch.mp3');
        } else {
            this.showView('camera');
            this.game.isCameraOpen = true;
            this.updateCameraView();
            
            // Add effect to camera
            void this.views.camera.offsetWidth;
            this.views.camera.classList.add('turn-effect');
            
            // Glitch effect on open
            this.camBg.classList.add('glitch-anim');
            setTimeout(() => this.camBg.classList.remove('glitch-anim'), 300);
            if (typeof audioSystem !== 'undefined') audioSystem.play('cam_switch', 'assets/audio/sfx/camera_switch.mp3');
        }
    }

    switchCamera(camId) {
        // Arrêter le son de Coupain si on quitte sa cam
        if (typeof audioSystem !== 'undefined') {
            audioSystem.stop('hacker_static', 'assets/audio/sfx/hacker_static.mp3');
        }
        this.wasHackedSoundPlayed = false;
        this.currentCam = camId;
        this.updateCameraView();
        
        // Static glitch effect on switch
        const staticOverlay = document.getElementById('camera-static');
        staticOverlay.classList.add('full-opacity');
        setTimeout(() => {
            const isCoupainHere = Object.values(this.game.enemyManager.catStates).some(c => c.id === 'coupain' && c.location === this.currentCam && !c.isDead);
            if (!isCoupainHere) {
                staticOverlay.classList.remove('full-opacity');
            }
        }, 150);
        if (typeof audioSystem !== 'undefined') audioSystem.play('cam_switch', 'assets/audio/sfx/camera_switch.mp3');
    }

    updateCameraView(prevLoc, newLoc) {
        const config = this.game.config;
        const camConfig = config.cameras.find(c => c.id === this.currentCam);
        
        if (!camConfig) return;

        this.camName.innerText = `CAM - ${camConfig.name.toUpperCase()}`;
        
        // Hacker glitch si Coupain est sur la caméra actuelle
        const isCoupainHere = Object.values(this.game.enemyManager.catStates).some(c => c.id === 'coupain' && c.location === this.currentCam && !c.isDead);
        const staticOverlay = document.getElementById('camera-static');
        if (isCoupainHere) {
            staticOverlay.classList.add('full-opacity');
            // Démarrer la boucle sonore seulement une fois par arrivée sur la cam
            if (this.game.isCameraOpen && !this.wasHackedSoundPlayed) {
                if (typeof audioSystem !== 'undefined') {
                    audioSystem.play('hacker_static', 'assets/audio/sfx/hacker_static.mp3', true); // loop = true
                }
                this.wasHackedSoundPlayed = true;
            }
        } else {
            // Coupain n'est plus / pas sur cette cam — couper le son
            if (this.wasHackedSoundPlayed && typeof audioSystem !== 'undefined') {
                audioSystem.stop('hacker_static', 'assets/audio/sfx/hacker_static.mp3');
            }
            this.wasHackedSoundPlayed = false;
            if (staticOverlay && staticOverlay.classList.contains('full-opacity')) {
                staticOverlay.classList.remove('full-opacity');
            }
        }
        
        // Glitch effect if a cat moved in or out of the current camera
        if (this.game.isCameraOpen && prevLoc && newLoc) {
            if (prevLoc === this.currentCam || newLoc === this.currentCam) {
                this.camBg.classList.add('glitch-anim');
                setTimeout(() => this.camBg.classList.remove('glitch-anim'), 300);
            }
        }
        
        // Update map buttons
        document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-${this.currentCam}`);
        if (activeBtn) activeBtn.classList.add('active');
        
        // Update map red dots (show cats on map)
        document.querySelectorAll('.map-cat-dot').forEach(d => d.remove());
        if (this.showRedDots) {
            const aliveCats = Object.values(this.game.enemyManager.catStates).filter(c => !c.isDead);
            aliveCats.forEach((cat, idx) => {
                if (cat.location !== "office" && cat.location !== "dead") {
                    const mapBtn = document.getElementById(`btn-${cat.location}`);
                    if (mapBtn) {
                        const dot = document.createElement('div');
                        dot.className = 'map-cat-dot';
                        // Offset slightly if multiple cats are in same room
                        const offsetIndex = mapBtn.querySelectorAll('.map-cat-dot').length;
                        dot.style.top = `-5px`;
                        dot.style.left = `${-5 + (offsetIndex * 15)}px`;
                        mapBtn.appendChild(dot);
                    }
                }
            });
        }

        // Show/hide ammo token
        if (this.ammoToken) {
            if (this.game.activeTokenCam === this.currentCam) {
                this.ammoToken.classList.remove('hidden');
                // Random position within the camera view when we first see it on this cam
                if (!this.ammoToken.hasAttribute('data-cam') || this.ammoToken.getAttribute('data-cam') !== this.currentCam) {
                    this.ammoToken.style.top = `${20 + Math.random() * 50}%`;
                    this.ammoToken.style.left = `${20 + Math.random() * 50}%`;
                    this.ammoToken.setAttribute('data-cam', this.currentCam);
                }
            } else {
                this.ammoToken.classList.add('hidden');
                this.ammoToken.removeAttribute('data-cam');
            }
        }

        // Set base background
        if (camConfig.baseImage) {
            this.camBg.style.backgroundImage = `url('${camConfig.baseImage}')`;
        } else {
            this.camBg.style.backgroundImage = 'none';
            this.camBg.style.backgroundColor = '#111';
        }

        // Remove old dynamic cats
        document.querySelectorAll('.dynamic-cat').forEach(el => el.remove());
        // Hide the default static one
        this.cameraCatSprite.classList.add('hidden');

        // Render all cats in the current camera
        const catsInCam = Object.values(this.game.enemyManager.catStates).filter(c => c.location === this.currentCam && !c.isDead);
        
        catsInCam.forEach((cat, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'cat-wrapper dynamic-cat';
            
            const catSprite = document.createElement('img');
            catSprite.className = 'cat-sprite';
            catSprite.src = cat.config.images.sprite;
            
            wrapper.appendChild(catSprite);
            
            if (camConfig.catPosition) {
                wrapper.style.bottom = camConfig.catPosition.bottom || "10%";
                wrapper.style.height = camConfig.catPosition.height || "50%";
                
                // Calculate dynamic left offset to fit all cats
                let baseLeft = parseFloat(camConfig.catPosition.left || 50);
                const spacing = Math.min(25, 80 / catsInCam.length);
                let randomWander = (Math.random() * 6) - 3; // -3% to +3%
                let finalLeft = baseLeft + (index * spacing) + randomWander;
                
                // Keep it bounded so they don't fall off screen
                finalLeft = Math.max(0, Math.min(finalLeft, 85));
                
                wrapper.style.left = `${finalLeft}%`;
            }
            
            this.camBg.appendChild(wrapper);
        });
    }

    setTurnAround(state) {
        if (this.game.power <= 0) return;
        
        const previousState = this.isTurnedAround;
        
        // Force close camera and flashlight if turning around
        if (state) {
            if (this.game.isCameraOpen) this.toggleMonitor();
            if (this.isFlashlightOn) this.toggleFlashlight();
        }
        
        this.isTurnedAround = state;
        const config = this.game.config;
        
        // Add visual effect
        this.views.office.classList.remove('turn-effect');
        // Force reflow to restart animation
        void this.views.office.offsetWidth;
        this.views.office.classList.add('turn-effect');
        
        if (this.isTurnedAround) {
            this.officeBg.style.backgroundImage = `url('${config.office.backImage}')`;
            this.deskSprite.classList.add('hidden');
            this.btnMonitorToggle.style.display = 'none';
            if (this.btnPcPower) this.btnPcPower.style.display = 'none';
            
            const coffee = document.getElementById('coffee-cup-container');
            if (coffee) coffee.classList.add('hidden');

            this.btnShoot.classList.remove('hidden');
            this.btnTurnAround.classList.add('active');
            this.updateOfficeThreats(this.game.enemyManager.catStates);
            if (previousState !== state && typeof audioSystem !== 'undefined') {
                audioSystem.play('turn', 'assets/audio/sfx/turn.mp3');
            }
        } else {
            this.btnTurnAround.classList.remove('active');
            if (this.game && !this.game.isPcOn) {
                this.officeBg.style.backgroundImage = `url('assets/images/rooms/bureau_etin.jpg')`;
            } else {
                this.officeBg.style.backgroundImage = `url('${config.office.deskImage}')`;
            }
            this.deskSprite.classList.remove('hidden');
            this.btnMonitorToggle.style.display = 'block';
            if (this.btnPcPower) this.btnPcPower.style.display = 'block';
            
            const coffee = document.getElementById('coffee-cup-container');
            if (coffee) coffee.classList.remove('hidden');

            this.btnShoot.classList.add('hidden');
            this.updateOfficeThreats(this.game.enemyManager.catStates);
            if (previousState !== state && typeof audioSystem !== 'undefined') {
                audioSystem.play('turn', 'assets/audio/sfx/turn.mp3');
            }
        }
    }

    /**
     * Variante de setTurnAround(true) utilisée par la séquence Locky.
     * Bypass le check power <= 0 car la mort par sommeil ne coupe pas le courant.
     */
    forceTurnAroundForLocky() {
        const config = this.game.config;
        if (!config || !config.office) return;

        // Fermer caméra / lampe si ouvertes
        if (this.game.isCameraOpen) {
            this.game.isCameraOpen = false;
            this.showView('office');
        }
        if (this.isFlashlightOn) {
            this.isFlashlightOn = false;
            this.btnFlashlight.classList.remove('active');
            this.officeLightOverlay.classList.add('hidden');
        }

        this.isTurnedAround = true;

        // Transition visuelle
        this.views.office.classList.remove('turn-effect');
        void this.views.office.offsetWidth;
        this.views.office.classList.add('turn-effect');

        // Fond = mur du dos
        this.officeBg.style.backgroundImage = `url('${config.office.backImage}')`;
        this.deskSprite.classList.add('hidden');
        this.btnMonitorToggle.style.display = 'none';
        if (this.btnPcPower) this.btnPcPower.style.display = 'none';

        const coffee = document.getElementById('coffee-cup-container');
        if (coffee) coffee.classList.add('hidden');

        this.btnTurnAround.classList.add('active');

        // Son de retournement
        if (typeof audioSystem !== 'undefined') {
            audioSystem.play('turn', 'assets/audio/sfx/turn.mp3');
        }
    }

    /**
     * Fait glisser Locky depuis le côté droit de l'écran (vue mur dos).
     */
    showLockySide() {
        const locky = document.getElementById('locky-side');
        if (!locky) return;

        // Départ hors écran à droite, transparent
        locky.style.transition = 'none';
        locky.style.right = '-35%';
        locky.style.opacity = '0';
        locky.classList.remove('hidden');

        // Force un reflow pour que la transition soit prise en compte
        void locky.offsetWidth;

        // Glissement vers le bord intérieur
        locky.style.transition = 'right 1.3s ease-out, opacity 0.9s ease-in';
        locky.style.right = '2%';
        locky.style.opacity = '1';
    }

    /**
     * Masque Locky (fondu sortant) avant le jumpscare.
     */
    hideLockySide() {
        const locky = document.getElementById('locky-side');
        if (!locky) return;

        locky.style.transition = 'opacity 0.2s ease-in';
        locky.style.opacity = '0';

        setTimeout(() => {
            locky.classList.add('hidden');
            // Réinitialiser pour la prochaine utilisation
            locky.style.right = '-35%';
        }, 250);
    }

    updateDeskSprite() {
        if (!this.game) return;
        const config = this.game.config;
        if (this.game.isPcOn) {
            this.deskSprite.src = config.office.deskSprite || 'assets/images/ui/bureau.png';
            if (!this.isTurnedAround) {
                this.officeBg.style.backgroundImage = `url('${config.office.deskImage}')`;
            }
            this.btnMonitorToggle.disabled = false;
        } else {
            // Using _off suffix or fallback to a darkened filter if image missing
            this.deskSprite.src = config.office.deskSpriteOff || 'assets/images/ui/bureau_off.png';
            if (!this.isTurnedAround) {
                this.officeBg.style.backgroundImage = `url('assets/images/rooms/bureau_etin.jpg')`;
            }
            this.btnMonitorToggle.disabled = true;
        }
    }

    toggleFlashlight() {
        if (this.game.power <= 0) return;
        
        this.isFlashlightOn = !this.isFlashlightOn;
        if (typeof audioSystem !== 'undefined') audioSystem.play('flashlight', 'assets/audio/sfx/flashlight.mp3');
        
        if (this.isFlashlightOn) {
            this.btnFlashlight.classList.add('active');
            this.officeLightOverlay.classList.remove('hidden');
            this.updateOfficeThreats(this.game.enemyManager.catStates);
            
            // Scare specific cats away
            this.game.enemyManager.scareCat('choupi');
            this.game.enemyManager.scareCat('coupain');
        } else {
            this.btnFlashlight.classList.remove('active');
            this.officeLightOverlay.classList.add('hidden');
            this.officeCatSprite.classList.remove('visible');
        }
    }

    playAudioLure() {
        if (this.audioCooldown || this.game.power <= 0) return;
        
        // Cost some power
        this.game.power -= 2;
        
        // Play sound
        console.log(`Playing audio in ${this.currentCam}`);
        if (typeof audioSystem !== 'undefined') {
            audioSystem.play('lure', 'assets/audio/sfx/lure.mp3');
        }
        
        // Notify enemies
        this.game.enemyManager.triggerAudioLure(this.currentCam);
        
        // Cooldown
        this.audioCooldown = true;
        this.btnPlayAudio.disabled = true;
        
        const circle = document.getElementById('audio-cooldown-circle');
        if (circle) circle.classList.remove('hidden');
        
        let startTime = Date.now();
        const duration = this.game.activeBonus === 3 ? 2000 : 5000;
        
        const updateCircle = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= duration) {
                if (circle) circle.classList.add('hidden');
                this.audioCooldown = false;
                this.btnPlayAudio.disabled = false;
            } else {
                const percent = (elapsed / duration) * 100;
                if (circle) circle.style.background = `conic-gradient(#f00 ${percent}%, #333 ${percent}%)`;
                requestAnimationFrame(updateCircle);
            }
        };
        requestAnimationFrame(updateCircle);
    }

    updateOfficeThreats(catStates) {
        let threatCat = null;
        Object.values(catStates).forEach(cat => {
            if (cat.location === "office" && !cat.isDead) {
                threatCat = cat;
            }
        });

        // Update shoot button state
        if (threatCat) {
            this.btnShoot.disabled = false;
        } else {
            this.btnShoot.disabled = true;
        }

        if (threatCat) {
            this.officeCatSprite.src = threatCat.config.images.sprite || threatCat.config.images.icon;
            this.officeCatSprite.classList.remove('hidden');
            // Show cat if flashlight is on OR if we are turned around (facing them)
            if (this.isFlashlightOn || this.isTurnedAround) {
                this.officeCatSprite.classList.add('visible');
            } else {
                this.officeCatSprite.classList.remove('visible');
            }
        } else {
            this.officeCatSprite.classList.add('hidden');
            this.officeCatSprite.classList.remove('visible');
        }
    }

    updateHUD(timeString, night, power, usage) {
        this.timeDisplay.innerText = timeString;
        this.nightDisplay.innerText = night;
        this.powerDisplay.innerText = Math.floor(power);
        
        const bars = this.usageBars.querySelectorAll('.bar');
        bars.forEach((bar, index) => {
            if (index < usage) {
                bar.classList.add('active');
            } else {
                bar.classList.remove('active');
            }
        });
    }

    triggerJumpscare(cat) {
        this.showView('jumpscare');
        const img = document.getElementById('jumpscare-img');
        if (cat.config.images.jumpscare) {
            img.src = cat.config.images.jumpscare;
        }

        // Static à l'écran de mort
        if (typeof audioSystem !== 'undefined') {
            audioSystem.play('hacker_static', 'assets/audio/sfx/hacker_static.mp3', false);
        }
        
        if (cat.config.audio.jumpscare) {
            audioSystem.play('jump', cat.config.audio.jumpscare);
        }
    }

    updateSettingsUI() {
        if (this.difficultySelect) {
            this.difficultySelect.disabled = !this.isCustomNight;
        }
        if (this.catTogglesContainer) {
            const toggles = this.catTogglesContainer.querySelectorAll('input[type="checkbox"]');
            toggles.forEach(t => t.disabled = !this.isCustomNight);
        }
    }

    powerOutage() {
        this.showView('office');
        this.game.isCameraOpen = false;
        this.isTurnedAround = false;
        this.isFlashlightOn = false;
        
        // Disable UI
        this.btnMonitorToggle.style.display = 'none';
        if (this.btnPcPower) this.btnPcPower.style.display = 'none';
        this.btnTurnAround.style.display = 'none';
        this.btnFlashlight.style.display = 'none';
        this.deskSprite.classList.add('hidden');
        this.officeCatSprite.classList.add('hidden');
        this.officeLightOverlay.classList.add('hidden');
        
        const coffee = document.getElementById('coffee-cup-container');
        if (coffee) coffee.classList.add('hidden');
        
        // Darken office
        this.officeBg.style.backgroundImage = 'none';
        this.officeBg.style.backgroundColor = '#000';
    }

    playShootAnimation() {
        this.gunSprite.classList.add('shooting');
        setTimeout(() => {
            this.gunSprite.classList.remove('shooting');
        }, 300);
    }

    _initClockMarks() {
        const svgNS = "http://www.w3.org/2000/svg";
        const hourMarksG = document.getElementById('clock-hour-marks');
        const minMarksG = document.getElementById('clock-min-marks');
        const labelsG = document.getElementById('clock-hour-labels');
        if (!hourMarksG) return;
        
        // Clear previous
        hourMarksG.innerHTML = '';
        minMarksG.innerHTML = '';
        labelsG.innerHTML = '';

        const cx = 100, cy = 100, r = 88;

        for (let i = 0; i < 60; i++) {
            const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
            const isHour = (i % 5 === 0);
            const outerR = r;
            const innerR = isHour ? r - 12 : r - 6;
            const x1 = cx + outerR * Math.cos(angle);
            const y1 = cy + outerR * Math.sin(angle);
            const x2 = cx + innerR * Math.cos(angle);
            const y2 = cy + innerR * Math.sin(angle);
            const mark = document.createElementNS(svgNS, 'line');
            mark.setAttribute('x1', x1);
            mark.setAttribute('y1', y1);
            mark.setAttribute('x2', x2);
            mark.setAttribute('y2', y2);
            mark.setAttribute('stroke', isHour ? '#fff' : 'rgba(255,255,255,0.4)');
            mark.setAttribute('stroke-width', isHour ? '2.5' : '1');
            if (isHour) {
                hourMarksG.appendChild(mark);
                // Chiffre de l'heure
                const hourNum = i / 5 === 0 ? 12 : i / 5;
                const labelR = r - 22;
                const lx = cx + labelR * Math.cos(angle);
                const ly = cy + labelR * Math.sin(angle);
                const text = document.createElementNS(svgNS, 'text');
                text.setAttribute('x', lx);
                text.setAttribute('y', ly);
                text.textContent = hourNum;
                labelsG.appendChild(text);
            } else {
                minMarksG.appendChild(mark);
            }
        }
    }

    _setClockTime(hours, minutes, seconds) {
        const hourHand = document.getElementById('clock-hand-hour');
        const minHand = document.getElementById('clock-hand-min');
        const secHand = document.getElementById('clock-hand-sec');
        if (!hourHand) return;

        const cx = 100, cy = 100;
        const hourLen = 45; // distance du centre à la pointe
        const minLen = 65;
        const secLen = 70;
        const secTailLen = 15;

        // Angles (en radians, 0 = haut = -PI/2)
        const hAngle = ((hours % 12) / 12 + minutes / 720) * 2 * Math.PI - Math.PI / 2;
        const mAngle = (minutes / 60 + seconds / 3600) * 2 * Math.PI - Math.PI / 2;
        const sAngle = (seconds / 60) * 2 * Math.PI - Math.PI / 2;

        hourHand.setAttribute('x2', cx + hourLen * Math.cos(hAngle));
        hourHand.setAttribute('y2', cy + hourLen * Math.sin(hAngle));

        minHand.setAttribute('x2', cx + minLen * Math.cos(mAngle));
        minHand.setAttribute('y2', cy + minLen * Math.sin(mAngle));

        // Aiguille des secondes (queue opposée + pointe)
        secHand.setAttribute('x1', cx - secTailLen * Math.cos(sAngle));
        secHand.setAttribute('y1', cy - secTailLen * Math.sin(sAngle));
        secHand.setAttribute('x2', cx + secLen * Math.cos(sAngle));
        secHand.setAttribute('y2', cy + secLen * Math.sin(sAngle));
    }

    playWinAnimation(nightNum) {
        this.showView('win');
        const winTime = document.getElementById('win-time');
        const winAmpm = document.getElementById('win-ampm');
        const winSubtitle = document.getElementById('win-subtitle');
        document.getElementById('win-night-num').innerText = nightNum;

        winTime.innerText = '5:59';
        if (winAmpm) winAmpm.innerText = 'AM';
        winSubtitle.classList.add('hidden');
        winTime.classList.remove('alarm-flash');

        // Jouer le son de victoire
        if (typeof audioSystem !== 'undefined') audioSystem.play('win', 'assets/audio/sfx/6am.mp3');

        // Après 2s : passage à 6:00 avec flash LED
        setTimeout(() => {
            winTime.innerText = '6:00';
            // Flash des digits à la manière d'un vrai réveil
            void winTime.offsetWidth; // reflow
            winTime.classList.add('alarm-flash');
            setTimeout(() => winTime.classList.remove('alarm-flash'), 900);
            winSubtitle.classList.remove('hidden');
        }, 2000);
    }

    updateSleepOverlay(sleep) {
        const bar = document.getElementById('sleep-bar');
        if (bar) {
            bar.style.width = `${sleep}%`;
            // Change color dynamically
            if (sleep > 50) {
                bar.style.backgroundColor = '#5af';
            } else if (sleep > 20) {
                bar.style.backgroundColor = '#fa0';
            } else {
                bar.style.backgroundColor = '#f33';
            }
        }

        const overlay = document.getElementById('sleep-overlay');
        if (overlay) {
            // Screen gets darker as sleep gets lower
            if (sleep > 50) {
                overlay.style.opacity = '0';
            } else {
                const opacity = ((50 - sleep) / 50) * 0.85;
                overlay.style.opacity = opacity.toFixed(2);
            }
        }
    }

    showBonusSelection() {
        const panel = document.getElementById('bonus-panel');
        if (panel) {
            panel.classList.remove('hidden');
        }
    }

    hideBonusSelection() {
        const panel = document.getElementById('bonus-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
    }

    showNewspaper() {
        const paper = document.getElementById('newspaper-screen');
        if (paper) {
            paper.classList.remove('hidden');
        }
    }

    hideNewspaper() {
        const paper = document.getElementById('newspaper-screen');
        if (paper) {
            paper.classList.add('hidden');
        }
    }

    setGameOverReason(reason) {
        const el = document.getElementById('game-over-reason');
        if (el) {
            el.innerText = reason;
        }
    }
}
