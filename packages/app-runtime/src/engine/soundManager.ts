// A simple singleton audio manager for the web game

class SoundManager {
    private bgmAudio: HTMLAudioElement | null = null;
    private sfxTyping: HTMLAudioElement | null = null;
    private isMuted: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            // Preload common SFX
            this.sfxTyping = new Audio('/audio/typing_beep.mp3'); // We'll assume user will drop this asset later
            this.sfxTyping.loop = true;
            this.sfxTyping.volume = 0.2;
        }
    }

    public playBGM(url: string) {
        if (this.isMuted || typeof window === 'undefined') return;

        if (this.bgmAudio) {
            this.bgmAudio.pause();
        }

        this.bgmAudio = new Audio(url);
        this.bgmAudio.loop = true;
        this.bgmAudio.volume = 0.5;
        this.bgmAudio.play().catch(() => console.log("Audio play blocked by browser. User interaction needed."));
    }

    public stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
        }
    }

    public startTypingSFX() {
        if (this.isMuted || typeof window === 'undefined') return;
        this.sfxTyping?.play().catch(() => {});
    }

    public stopTypingSFX() {
        if (typeof window === 'undefined') return;
        this.sfxTyping?.pause();
    }

    public playOneShot(url: string) {
        if (this.isMuted || typeof window === 'undefined') return;
        const sfx = new Audio(url);
        sfx.volume = 0.8;
        sfx.play().catch(() => {});
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBGM();
            this.stopTypingSFX();
        }
    }
}

export const sound = new SoundManager();
