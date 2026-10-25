HOW TO REPLACE MUSEUM MEDIA (NO CODING REQUIRED)

1. Photos (P1 to P8): Drop P1.jpg, P2.png, etc. into assets/photos/.
   Resolution order: .jpg -> .jpeg -> .png -> .webp -> default SVG placeholder.
2. Videos (V1 and V2): Drop V1.mp4 or V2.webm into assets/videos/.
3. Music: Place your background music as bgm.mp3 into assets/audio/.
4. 3D Models: Place custom jenil.glb and rutu.glb into assets/characters/.
5. Texts and Captions: Edit content/content.json to customize captions, signs, and messages.
6. The frames and screens automatically adjust their dimensions to match your media ratio.
7. Missing files will safely fall back to beautiful built-in placeholders with zero crashes.
8. Redeploy your changes by running: npm run deploy
