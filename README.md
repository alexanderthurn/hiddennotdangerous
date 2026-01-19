# STEALTHY STINKERS

__Blow your way to freedom, just don’t blow your cover!__

## Preview

[V1 Live Preview](https://alexanderthurn.github.io/hiddennotdangerous/v1)  
[V2 Live Preview](https://alexanderthurn.github.io/hiddennotdangerous/v2)

## Game Description

In this hilarious multiplayer game, you play as a sneaky baby trying to outlast the competition with one explosive advantage: your farts! Watch out, though – if you’re too loud, you risk revealing yourself to the other players, who can eliminate you. Hide among computer-controlled babies to stay under the radar and become the last baby standing!

### Key Features

- **Multiplayer Action**: Compete with at least two players to see who can stay undetected the longest.
- **Controls for Everyone**: Supports gamepad, mouse, keyboard, and touch controls.
- **Stealth & Strategy**: Use your "toots" carefully – one wrong move and you're out!

Will you be the last baby standing... or the first one blown away?


## Development

- Install python3
- Open a terminal and run `python3 -m http.server 3333`
- Open `http://localhost:3333` in your webbrowser. If it says it is insecure due to http, open it in another browser or in private mode

To generate characters:
- Go to https://vitruvianstudio.github.io/
- Create your character and export current animation while walking is active
- Rename the zip file to your character name, e.g. professor.zip
- Save it in misc/lpc/vitruvian/
- Open a terminal 
- `cd misc/lpc`
- `sh vitruvianstudio.sh vitruvian/professor.zip`
- It exports all sprites into misc/lpc/in/professor/
- `sh tpall.sh`
- It packs all images in all subdirectories of /misc/lpc/in/ and puts them in /misc/lpc/out
- `TexturePacker figure.tps`
- Publish spritesheet
- It exports a new figure.json and figure.png in v2/gfx/


## Resources

- character: https://opengameart.org/content/simple-character-base-16x16
- Grass Tiles: https://www.vecteezy.com/vector-art/13998017-textures-of-green-grass-with-flowers-and-mushrooms
- music1: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ranz%20des%20Vaches.mp3
- music2: https://suno.com/song/90760bdb-d4c5-42d3-8066-7f4597b8e1d4
- music3: https://pixabay.com/de/music/schlaflieder-brahms-lullaby-wiegenlied-op49-no4-music-box-version-2-229418/
- slingshotHit: https://pixabay.com/sound-effects/slingshot-2-40485/
- slingshotMiss: https://pixabay.com/sound-effects/slingshot-1-40486/
- spinningWheelClick: https://pixabay.com/sound-effects/film-special-effects-wheel-spin-click-slow-down-101152/
- sound1: https://pixabay.com/de/sound-effects/fart-9-228245/
- sound2: https://pixabay.com/de/sound-effects/fart-83471/
- sounddrum: https://pixabay.com/de/sound-effects/awesome-kick-drum-41824/
- shooter memes: https://tuna.voicemod.net/user/shiftingratechorus77356, https://dotawiki.de/index.php?title=Killing_Sounds
- cloud: https://opengameart.org/content/vaporizng-cloud-particle
- food: https://opengameart.org/content/cc0-food-icons
- eat sound: https://cdn.pixabay.com/download/audio/2022/01/18/audio_9f09ebc2fa.mp3?filename=eatingsfxwav-14588.mp3 
- eat sound2: <a href="https://pixabay.com/sound-effects/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=83240">Pixabay</a>
- eat sound3: <a href="https://pixabay.com/sound-effects/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=95783">Pixabay</a>
- eat sound: <a href="https://pixabay.com/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=92106">Pixabay</a>
- vomit: Sound Effect from <a href="https://pixabay.com/sound-effects/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=41796">Pixabay</a>
- vomit2 Sound Effect by <a href="https://pixabay.com/de/users/soundreality-31074404/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=150122">Jurij</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=150122">Pixabay</a>
- vomit3 Sound Effect from <a href="https://pixabay.com/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=41207">Pixabay</a>
- cheer: Sound Effect from <a href="https://pixabay.com/sound-effects/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=99963">Pixabay</a>

- Font: Rockboxcond12 https://www.pentacom.jp/pentacom/bitfontmaker2/gallery/?id=740

## Licenses

### Code
- [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)  
- This project is licensed under the **GNU GPL v3.0 _or (at your option) any later version_**.  
- See the `LICENSE` file for details.  

### Assets
- Assets come from multiple authors and carry various licenses (GPL-3.0, CC-BY 3.0, CC-BY-SA 3.0, OGA-BY 3.0, etc.).  
- **Full attribution is provided in [`CREDITS.csv`](./CREDITS.csv).**  
- Sources and license terms:  
  - OpenGameArt: https://opengameart.org/content/faq  
  - Pixabay: https://pixabay.com/service/license-summary/  
  - Vecteezy: https://www.vecteezy.com/terms  


# TODO 

  - https://vitruvianstudio.github.io/  add more characters
  - add credits screen including:
  - more animations with https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator

  
  Sprites by: Johannes Sjölund (wulax), Michael Whitlock (bigbeargames), Matthew Krohn (makrohn), Nila122, David Conway Jr. (JaidynReiman), Carlo Enrico Victoria (Nemisys), Thane Brimhall (pennomi), laetissima, bluecarrot16, Luke Mehl, Benjamin K. Smith (BenCreating), MuffinElZangano, Durrani, kheftel, Stephen Challener (Redshrike), William.Thompsonj, Marcel van de Steeg (MadMarcel), TheraHedwig, Evert, Pierre Vigier (pvigier), Eliza Wyatt (ElizaWy), Johannes Sjölund (wulax), Sander Frenken (castelonia), dalonedrau, Lanea Zimmerman (Sharm), Manuel Riecke (MrBeast), Barbara Riviera, Joe White, Mandi Paugh, Shaun Williams, Daniel Eddeland (daneeklu), Emilio J. Sanchez-Sierra, drjamgo, gr3yh47, tskaufma, Fabzy, Yamilian, Skorpio, kheftel, Tuomo Untinen (reemax), Tracy, thecilekli, LordNeo, Stafford McIntyre, PlatForge project, DCSS authors, DarkwallLKE, Charles Sanchez (CharlesGabriel), Radomir Dopieralski, macmanmatty, Cobra Hubbard (BlueVortexGames), Inboxninja, kcilds/Rocetti/Eredah, Napsio (Vitruvian Studio), The Foreman, AntumDeluge
Sprites contributed as part of the Liberated Pixel Cup project from OpenGameArt.org: http://opengameart.org/content/lpc-collection
License: Creative Commons Attribution-ShareAlike 3.0 (CC-BY-SA 3.0) http://creativecommons.org/licenses/by-sa/3.0/
Detailed credits: [LINK TO CREDITS.CSV FILE]
- https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator/blob/master/README.md
