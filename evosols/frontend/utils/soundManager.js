// frontend/utils/soundManager.js
class SoundManager {
  constructor() {
    this.sounds = {
      // Battle sounds
      attack: this.createSound('/sounds/attack.mp3', 0.5),
      defend: this.createSound('/sounds/defend.mp3', 0.4),
      special: this.createSound('/sounds/special.mp3', 0.6),
      damage: this.createSound('/sounds/damage.mp3', 0.4),
      heal: this.createSound('/sounds/heal.mp3', 0.4),
      victory: this.createSound('/sounds/victory.mp3', 0.5),
      defeat: this.createSound('/sounds/defeat.mp3', 0.4),
      
      // UI sounds
      click: this.createSound('/sounds/click.mp3', 0.3),
      hover: this.createSound('/sounds/hover.mp3', 0.2),
      success: this.createSound('/sounds/success.mp3', 0.4),
      error: this.createSound('/sounds/error.mp3', 0.4),
      
      // Evolution sounds
      evolutionStart: this.createSound('/sounds/evolution-start.mp3', 0.5),
      evolutionComplete: this.createSound('/sounds/evolution-complete.mp3', 0.6),
      
      // Background music
      battleTheme: this.createSound('/sounds/battle-theme.mp3', 0.2, true),
      menuTheme: this.createSound('/sounds/menu-theme.mp3', 0.2, true)
    };
    
    this.enabled = true;
    this.musicEnabled = true;
    this.currentMusic = null;
    
    // Load preferences from localStorage
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('soundEnabled') !== 'false';
      this.musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
    }
  }

  createSound(src, volume = 0.5, loop = false) {
    if (typeof window === 'undefined') return null;
    
    const audio = new Audio(src);
    audio.volume = volume;
    audio.loop = loop;
    
    // Preload
    audio.load();
    
    return audio;
  }

  play(soundName) {
    if (!this.enabled || !this.sounds[soundName]) return;
    
    try {
      const sound = this.sounds[soundName];
      sound.currentTime = 0; // Reset to start
      const playPromise = sound.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing sound:', error);
        });
      }
    } catch (error) {
      console.error('Sound play error:', error);
    }
  }

  playMusic(musicName) {
    if (!this.musicEnabled || !this.sounds[musicName]) return;
    
    // Stop current music
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
    }
    
    this.currentMusic = this.sounds[musicName];
    this.currentMusic.play().catch(error => {
      console.error('Error playing music:', error);
    });
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundEnabled', this.enabled);
    }
    return this.enabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('musicEnabled', this.musicEnabled);
    }
    
    if (!this.musicEnabled) {
      this.stopMusic();
    }
    
    return this.musicEnabled;
  }

  setVolume(soundName, volume) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].volume = Math.max(0, Math.min(1, volume));
    }
  }

  fadeOut(soundName, duration = 1000) {
    const sound = this.sounds[soundName];
    if (!sound) return;
    
    const startVolume = sound.volume;
    const step = startVolume / (duration / 50);
    
    const fade = setInterval(() => {
      if (sound.volume > step) {
        sound.volume -= step;
      } else {
        sound.volume = 0;
        sound.pause();
        clearInterval(fade);
      }
    }, 50);
  }

  fadeIn(soundName, targetVolume = 0.5, duration = 1000) {
    const sound = this.sounds[soundName];
    if (!sound) return;
    
    sound.volume = 0;
    sound.play();
    
    const step = targetVolume / (duration / 50);
    
    const fade = setInterval(() => {
      if (sound.volume < targetVolume - step) {
        sound.volume += step;
      } else {
        sound.volume = targetVolume;
        clearInterval(fade);
      }
    }, 50);
  }

  // Preload all sounds
  preloadAll() {
    Object.values(this.sounds).forEach(sound => {
      if (sound && sound.load) {
        sound.load();
      }
    });
  }

  // Clean up resources
  cleanup() {
    this.stopMusic();
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.pause();
        sound.src = '';
      }
    });
  }
}

// Export singleton instance
const soundManager = typeof window !== 'undefined' ? new SoundManager() : null;
export default soundManager;