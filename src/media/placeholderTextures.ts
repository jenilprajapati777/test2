import * as THREE from 'three';

export class PlaceholderTextures {
  /**
   * Creates an animated canvas texture for video placeholder Vn
   */
  public static createVideoPlaceholder(id: string): { texture: THREE.CanvasTexture; update: (time: number) => void } {
    if (typeof document === 'undefined') {
      const dummyTex = new THREE.CanvasTexture({} as any);
      return { texture: dummyTex, update: () => {} };
    }

    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 540; // 16:9 aspect ratio
    const ctx = canvas.getContext('2d')!;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const update = (time: number) => {
      // Background gradient with gentle pulse
      const pulse = 0.5 + Math.sin(time * 2) * 0.15;
      const grad = ctx.createLinearGradient(0, 0, 960, 540);
      grad.addColorStop(0, '#10141f');
      grad.addColorStop(1, '#1e2840');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 960, 540);

      // Border dashed frame
      ctx.strokeStyle = `rgba(212, 175, 55, ${0.4 + pulse * 0.3})`;
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, 900, 480);

      // Play button symbol with glow
      const cx = 480;
      const cy = 240;
      ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, 64, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f7df96';
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy - 35);
      ctx.lineTo(cx + 35, cy);
      ctx.lineTo(cx - 20, cy + 35);
      ctx.closePath();
      ctx.fill();

      // Video label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${id} — video placeholder ▶`, 480, 370);

      ctx.font = '22px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(`Drop ${id}.mp4 into assets/videos to replace`, 480, 430);

      texture.needsUpdate = true;
    };

    update(0);
    return { texture, update };
  }

  /**
   * Creates canvas texture for text boards B1-B5
   */
  public static createBoardTexture(id: string, text: string): THREE.CanvasTexture {
    if (typeof document === 'undefined') {
      return new THREE.CanvasTexture({} as any);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 460;
    const ctx = canvas.getContext('2d')!;

    // Rich dark slate chalkboard style
    ctx.fillStyle = '#1e2422';
    ctx.fillRect(0, 0, 1024, 460);

    // Warm wooden frame border
    ctx.strokeStyle = '#5a3d24';
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, 1004, 440);

    ctx.strokeStyle = '#8a5d3b';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 984, 420);

    // Board header (small badge)
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 28px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`— Board ${id} —`, 512, 60);

    // Main dummy text
    ctx.fillStyle = '#f5f5f0';
    ctx.font = 'italic 38px "Georgia", serif, system-ui';
    ctx.fillText(text, 512, 230);

    // Hint
    ctx.font = '22px system-ui';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('(Press E to read close up)', 512, 380);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Creates canvas texture for exit door signs S1 & S2
   */
  public static createSignTexture(id: string, text: string): THREE.CanvasTexture {
    if (typeof document === 'undefined') {
      return new THREE.CanvasTexture({} as any);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 280;
    const ctx = canvas.getContext('2d')!;

    // Polished bronze / dark wooden sign background
    ctx.fillStyle = '#1f150e';
    ctx.fillRect(0, 0, 1200, 280);

    const isExit1 = id === 'S1';
    ctx.strokeStyle = isExit1 ? '#d4af37' : '#5ba0d0';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 1180, 260);

    // Sign text
    ctx.fillStyle = isExit1 ? '#ffea9f' : '#bfe3ff';
    ctx.font = 'bold 44px "Cinzel", "Georgia", serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 600, 140);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}
