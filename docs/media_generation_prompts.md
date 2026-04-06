# Dokdo Arc Webgame - Media Generation Prompts (PRN)

이 문서는 사용자가 외부 AI(Suno, Luma, Midjourney 등)를 활용해 사운드, 영상, 이미지를 직접 생성할 때 사용할 프롬프트 가이드입니다.
생성된 파일은 지정된 `파일명`으로 저장하여 해당 폴더에 넣어주시면, 추후 일괄 연동(Sync)하겠습니다.

---

## 1. MUSIC & AUDIO (`music/`)

### 1-1. Basecamp / Hub
- **폴더/파일명**: `music/hub/bgm_hub_01.mp3`
- **상황**: 폐허가 된 베이스캠프. 윤해인이 무기를 닦고 있고, 낡은 발전기 소리가 들림.
- **프롬프트**: Dark ambient, post-apocalyptic safehouse. Acoustic guitar playing a melancholic, lonely melody. Distant sounds of wind, crackling fire, and a low hum of a struggling generator. Lo-fi, gritty, oppressive yet calming.

### 1-2. Exploration (Tension)
- **폴더/파일명**: `music/explore/bgm_explore_tension.mp3`
- **상황**: 오염된 수로를 걸어가는 중. 언제 괴물이 튀어나올지 모르는 극한의 긴장감.
- **프롬프트**: Extreme tension, cinematic dark drone. Minimalist industrial dark ambient. Distant metallic scraping, water dripping. Low heavy bass pulses simulating a heartbeat. No drums, just dread and anticipation.

### 1-3. Combat (Normal)
- **폴더/파일명**: `music/combat/bgm_combat_normal.mp3`
- **상황**: 감염체 무리와 맞닥뜨려 총격전 발생.
- **프롬프트**: Industrial techno combat music. Heavy, distorted bassline, aggressive fast-paced mechanical drums, glitchy synthetic alarms. Dark, visceral, adrenaline-pumping survival horror action.

### 1-4. Boss Fight (Villain)
- **폴더/파일명**: `music/boss/bgm_boss_butcher.mp3`
- **상황**: 챕터 2 빌런 '수로의 도살자'와의 사생결단. 무겁고 절망적인 느낌.
- **프롬프트**: Epic industrial metal, boss fight theme. Slow, crushing doom metal guitar riffs, blasting tribal drums, distorted sirens. Unforgiving, brutal, overwhelming dread.

### 1-5. Ambient / Sound Effects (UI & Events)
- **폴더/파일명**: `music/ambient/sfx_geiger.mp3` (가이거 계수기 소리) -> *Prompt: Fast clicking geiger counter sound effect, indicating high radiation.*
- **폴더/파일명**: `music/event/sfx_heartbeat_death.mp3` (사망 직전) -> *Prompt: Slow, heavy cinematic heartbeat, fading out into a flatline.*

---

## 2. VIDEO / ANIMATION (`video/`)

### 2-1. Death Screen Loop (KIA)
- **폴더/파일명**: `video/death/vid_kia_loop.mp4`
- **상황**: 플레이어가 죽었을 때 배경으로 깔리는 음산한 루프 영상.
- **프롬프트**: A first-person view falling onto cold, blood-stained concrete. Red flashing emergency lights in the background. The vision glitches and slowly fades to black with CRT scanlines and heavy noise. Dark, gritty, horrific.

### 2-2. Hub Background (Parallax/Loop)
- **폴더/파일명**: `video/hub/vid_hub_bg.mp4`
- **상황**: 베이스캠프의 움직이는 배경 영상.
- **프롬프트**: A dimly lit, ruined underground bunker. Dust motes floating in the air. A flickering fluorescent light tube overhead. Shadows stretching across concrete walls. Cinemagraph style, subtle looping motion.

---

## 3. IMAGES (`img/`)

### 3-1. Character Portraits
- **폴더/파일명**: `img/characters/npc_yoon_haein.png`
- **상황**: 상인 윤해인. 얼굴에 흉터가 있고 냉소적인 군인 출신.
- **프롬프트**: 2D digital art, dark gritty style, portrait of a rugged Korean female mercenary survivor. Scars on her cheek, wearing tactical gear and a heavily modified gas mask resting on her neck. Cold, cynical expression. Red and green low lighting, cyberpunk dystopia meets post-apocalypse.

### 3-2. Event Art (Flood Room)
- **폴더/파일명**: `img/backgrounds/bg_flooded_room.png`
- **상황**: CH02 수로 탐색 중 맞닥뜨리는 암흑의 수몰 구역.
- **프롬프트**: Concept art, dark and terrifying flooded subway station. Black stagnant water reflecting flickering emergency red lights. Trash and debris floating. Deep shadows, highly detailed, atmospheric dread, The Last of Us style environment.

---
**[사용자 가이드]**
위 프롬프트들을 활용하여 에셋을 생성하신 후, 해당 파일명으로 저장하여 폴더에 업로드해주세요. 업로드가 완료되었다고 말씀해주시면, 즉시 게임 UI와 이벤트 코드에 `src`로 연결하는 작업을 일괄 수행하겠습니다!
