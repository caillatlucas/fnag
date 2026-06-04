class AudioSystem {
    constructor() {
        this.sounds = {};
        this.ambiance = null;
        
        // Load volumes from localStorage or default to 1.0
        this.sfxVolume = parseFloat(localStorage.getItem('fnag_sfx_vol') ?? '1.0');
        this.musicVolume = parseFloat(localStorage.getItem('fnag_music_vol') ?? '1.0');
    }

    setSfxVolume(vol) {
        this.sfxVolume = parseFloat(vol);
        localStorage.setItem('fnag_sfx_vol', this.sfxVolume);
        
        // Update all currently loaded sounds
        Object.keys(this.sounds).forEach(key => {
            this.sounds[key].volume = this.sfxVolume;
        });
    }

    setMusicVolume(vol) {
        this.musicVolume = parseFloat(vol);
        localStorage.setItem('fnag_music_vol', this.musicVolume);
        if (this.ambiance) {
            this.ambiance.volume = this.musicVolume;
        }
    }

    preload(id, src) {
        if (!src) return;
        const key = id + '_' + src;
        if (!this.sounds[key]) {
            this.sounds[key] = new Audio(src);
            this.sounds[key].load();
        }
    }

    unlockAll() {
        // Just playing a tiny silent sound is enough to unlock the Web Audio API on Chrome/Firefox
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        silentAudio.play().catch(e => console.log('Silent unlock failed'));
    }

    play(id, src, loop = false, customVolume = null) {
        if (!src) return;

        const key = id + '_' + src;
        if (!this.sounds[key]) {
            this.sounds[key] = new Audio(src);
            
            // Add error listener to help debug missing files
            this.sounds[key].addEventListener('error', (e) => {
                console.error(`🔴 ERREUR AUDIO: Le fichier n'a pas été trouvé ou est invalide -> ${src}`);
            });
        }
        
        this.sounds[key].loop = loop;
        this.sounds[key].currentTime = 0;
        
        const volMultiplier = customVolume !== null ? parseFloat(customVolume) : 1.0;
        this.sounds[key].volume = this.sfxVolume * volMultiplier; // Apply scaled SFX volume
        
        this.sounds[key].play().catch(e => {
            console.error(`🔴 ERREUR LECTURE: Impossible de jouer -> ${src}`, e);
        });
    }

    stop(id, src) {
        const key = src ? id + '_' + src : Object.keys(this.sounds).find(k => k.startsWith(id + '_'));
        if (key && this.sounds[key]) {
            this.sounds[key].pause();
            this.sounds[key].currentTime = 0;
        }
    }

    playAmbiance(src) {
        if (this.ambiance) {
            this.ambiance.pause();
        }
        if (src) {
            this.ambiance = new Audio(src);
            this.ambiance.loop = true;
            this.ambiance.volume = this.musicVolume; // Apply Music volume
            const playPromise = this.ambiance.play();
            if (playPromise !== undefined) {
                return playPromise.catch(e => {
                    console.log('Ambiance play failed', e);
                    throw e;
                });
            }
        }
        return Promise.resolve();
    }

    stopAmbiance() {
        if (this.ambiance) {
            this.ambiance.pause();
        }
    }
}

const audioSystem = new AudioSystem();
