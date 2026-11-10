import { useEffect, useRef } from 'react';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function drawMouse(ctx, x, y, scale, running, selected, time, name) {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * (running ? 19 : 3) + x) * (running ? 4 : 2));
  ctx.scale(scale, scale);
  if (selected) { ctx.shadowColor = '#ffe16a'; ctx.shadowBlur = 24; }
  // Tail swishes behind the mouse.
  ctx.beginPath(); ctx.moveTo(-18, 9); ctx.quadraticCurveTo(-39, running ? Math.sin(time * 16 + x) * 12 : -10, -35, -25); ctx.strokeStyle = '#d98291'; ctx.lineWidth = 3; ctx.stroke();
  // Ears, body and head.
  for (const ex of [-10, 10]) { ctx.beginPath(); ctx.arc(ex, -22, 10, 0, Math.PI * 2); ctx.fillStyle = '#d9dbe0'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#858b98'; ctx.stroke(); ctx.beginPath(); ctx.arc(ex, -22, 5, 0, Math.PI * 2); ctx.fillStyle = '#ed9daa'; ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(0, 3, 21, 19, 0, 0, Math.PI * 2); ctx.fillStyle = selected ? '#fff0a5' : '#c9cbd1'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = selected ? '#e0aa31' : '#858b98'; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -3, 16, 14, 0, 0, Math.PI * 2); ctx.fillStyle = '#e7e8eb'; ctx.fill();
  ctx.fillStyle = '#30394b'; ctx.beginPath(); ctx.arc(-5, -5, 2, 0, Math.PI * 2); ctx.arc(5, -5, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 1, 3, 0, Math.PI * 2); ctx.fillStyle = '#ef8494'; ctx.fill();
  const foot = running ? Math.sin(time * 25 + x) * 5 : 0;
  ctx.strokeStyle = '#555d70'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-8, 17); ctx.lineTo(-11 + foot, 22); ctx.moveTo(8, 17); ctx.lineTo(11 - foot, 22); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = '700 12px "Be Vietnam Pro", sans-serif'; const width = ctx.measureText(name).width + 18;
  ctx.beginPath(); ctx.roundRect(-width / 2, 28, width, 23, 11); ctx.fillStyle = selected ? '#fff0ae' : '#fffdf5'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = selected ? '#e8b844' : '#e4efd9'; ctx.stroke(); ctx.fillStyle = '#25422d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(name, 0, 40);
  ctx.restore();
}

export default function PickerCanvas({ students, phase, winner }) {
  const canvasRef = useRef(null);
  const studentsRef = useRef(students); studentsRef.current = students;
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const winnerRef = useRef(winner); winnerRef.current = winner;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let frame;
    const start = performance.now();
    const paint = (now) => {
      const w = canvas.clientWidth; const h = canvas.clientHeight; const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const t = (now - start) / 1000; const p = phaseRef.current;
      const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#14234d'); sky.addColorStop(.58, '#315b87'); sky.addColorStop(.59, '#82ad58'); sky.addColorStop(1, '#47783b'); ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      // Stars twinkle subtly and the moon glows softly.
      for (let i = 0; i < 45; i++) { const x = ((i * 139 + 29) % w); const y = (i * 67 + 21) % Math.max(120, h * .48); ctx.globalAlpha = .4 + .45 * Math.sin(t * 1.4 + i); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, i % 9 === 0 ? 1.8 : 1, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff0b1'; ctx.shadowColor = '#ffeaa0'; ctx.shadowBlur = 28; ctx.beginPath(); ctx.arc(w * .83, h * .18, Math.min(w, h) * .07, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      // Rolling field layers.
      ctx.fillStyle = '#6f9d50'; ctx.beginPath(); ctx.moveTo(0, h * .57); for (let x = 0; x <= w; x += 24) ctx.lineTo(x, h * .55 + Math.sin(x / 90) * 12); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
      ctx.fillStyle = '#4e833f'; ctx.beginPath(); ctx.moveTo(0, h * .73); for (let x = 0; x <= w; x += 20) ctx.lineTo(x, h * .72 + Math.sin(x / 120 + 1) * 15); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
      // Small grass strokes provide a sense of scale and foreground movement.
      for (let i = 0; i < 50; i++) { const x = (i * 83 + t * (p === 'race' ? 34 : 5)) % w; const y = h * .74 + ((i * 31) % Math.max(1, h * .25)); ctx.strokeStyle = 'rgba(202,231,134,.26)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 7); ctx.stroke(); }
      // Original cartoon cat, drawn as clean vector shapes.
      const cx = w * .5; const cy = h * .39 + (p === 'drop' ? Math.sin(t * 18) * 4 : 0);
      ctx.fillStyle = '#374665'; ctx.strokeStyle = '#1e2c49'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(cx, cy, 48, 40, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + side * 28, cy - 20); ctx.lineTo(cx + side * 45, cy - 63); ctx.lineTo(cx + side * 6, cy - 48); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#ffe976'; for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + side * 17, cy - 4, 6, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#17213b'; ctx.beginPath(); ctx.ellipse(cx + side * 17, cy - 4, 2, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffe976'; }
      ctx.fillStyle = '#f39aa5'; ctx.beginPath(); ctx.arc(cx, cy + 15, 5, 0, Math.PI * 2); ctx.fill();
      // Cheese follows a bouncing arc, then fades when the chosen mouse reaches it.
      const cheeseX = cx; const cheeseGround = h * .66; let cheeseY = h * .53;
      if (p === 'drop') { const q = clamp(t / .65, 0, 1); cheeseY = h * .53 + (cheeseGround - h * .53) * (1 - Math.pow(1 - q, 3)) - Math.sin(q * Math.PI * 2) * 16; }
      if (p === 'race' || p === 'result') cheeseY = cheeseGround;
      if (p !== 'result') { ctx.save(); ctx.translate(cheeseX, cheeseY); ctx.rotate(p === 'drop' ? Math.sin(t * 16) * .16 : -.08); ctx.fillStyle = '#ffc63c'; ctx.strokeStyle = '#da9625'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-24, 13); ctx.lineTo(27, 13); ctx.lineTo(15, -22); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e99e24'; for (const [x,y,r] of [[-5,2,4],[10,8,3],[-12,10,2]]) { ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
      const list = studentsRef.current; const selected = winnerRef.current; const cols = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(list.length * 1.5)))); const rows = Math.ceil(list.length / cols);
      list.forEach((name, i) => {
        const row = Math.floor(i / cols); const col = i % cols; const count = Math.min(cols, list.length - row * cols); const baseX = w * (0.1 + .8 * (col + .5) / count); const baseY = h * (.78 + row * Math.min(.075, .20 / Math.max(1, rows - 1)));
        const isWinner = name === selected; let x = baseX; let y = baseY; let run = false;
        if (p === 'race' && isWinner) { run = true; const q = clamp(t / 1.8, 0, 1); const ease = q * q * (3 - 2 * q); x += (cheeseX - baseX) * ease; y += (cheeseGround - baseY - 14) * ease - Math.sin(q * Math.PI) * 60; }
        else if (p === 'race' && !isWinner) { run = true; x += Math.sin(t * 8 + i * 2) * 13; }
        if (p === 'result' && isWinner) { x = cheeseX; y = cheeseGround - 20; }
        drawMouse(ctx, x, y, clamp(w / 1100, .68, 1), run, isWinner && p === 'result', t, name);
      });
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <canvas ref={canvasRef} className="picker-canvas" aria-label="Sân chơi mèo thả phô mai và các chú chuột học sinh" />;
}
