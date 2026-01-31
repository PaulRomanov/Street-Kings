export const createPattern = (type: string, size: number = 32, color: string = '#ffffff'): ImageData | null => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Clear layout
  ctx.clearRect(0, 0, size, size);

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size / 8); 
  ctx.fillStyle = color;
  ctx.lineCap = 'round'; // Softer edges

  switch (type) {
    case 'stripes':
      // Diagonal stripes
      for (let i = -size; i < size * 2; i += size / 4) {
         ctx.beginPath();
         ctx.moveTo(i, size);
         ctx.lineTo(i + size, 0);
         ctx.stroke();
      }
      break;

    case 'horizontal':
      // Horizontal lines
      for (let i = 0; i <= size; i += size / 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
      }
      break;

    case 'dots':
      // Polka dots
      const r = size / 10;
      const positions = [
        { x: size / 4, y: size / 4 },
        { x: size * 0.75, y: size * 0.75 }
      ];
      positions.forEach(pos => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      break;

    case 'grid':
      // Grid
      ctx.lineWidth = Math.max(1, size / 16);
      ctx.beginPath();
      ctx.moveTo(0, size / 2);
      ctx.lineTo(size, size / 2);
      ctx.moveTo(size / 2, 0);
      ctx.lineTo(size / 2, size);
      ctx.stroke();
      // Border
      ctx.strokeRect(0, 0, size, size);
      break;

    case 'diamonds':
      // Diamonds (rotated grid filled)
      const dSize = size / 2;
      ctx.beginPath();
      // Draw diamond shape in center
      ctx.moveTo(size/2, 0);
      ctx.lineTo(size, size/2);
      ctx.lineTo(size/2, size);
      ctx.lineTo(0, size/2);
      ctx.closePath();
      ctx.stroke();
      // Fill small center diamond
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/8, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'waves':
       // Sine waves
       ctx.lineWidth = Math.max(2, size / 10);
       const waveHeight = size / 4;
       
       for (let y = size/4; y < size; y += size/2) {
         ctx.beginPath();
         for (let x = 0; x <= size; x++) {
           const wy = y + Math.sin((x / size) * Math.PI * 2) * (waveHeight / 2);
           if (x === 0) ctx.moveTo(x, wy);
           else ctx.lineTo(x, wy);
         }
         ctx.stroke();
       }
       break;

    case 'dashed':
       // Dashed lines (diagonal)
       ctx.setLineDash([size/4, size/4]);
       for (let i = -size; i < size * 2; i += size / 4) {
         ctx.beginPath();
         ctx.moveTo(i, size);
         ctx.lineTo(i + size, 0);
         ctx.stroke();
      }
      break;
  }
  
  return ctx.getImageData(0, 0, size, size);
}

// Helper to get DataURL for UI previews
export const getPatternDataUrl = (type: string, size: number = 32, color: string = '#ffffff'): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  const imageData = createPattern(type, size, color);
  if (imageData) {
    ctx.putImageData(imageData, 0, 0);
  }
  
  return canvas.toDataURL();
}
