"use client";
import { useEffect, useRef } from "react";
export default function SignalScene({ paused }: { paused: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current,
      ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const mask = document.createElement("canvas");
    mask.width = 100;
    mask.height = 100;
    const m = mask.getContext("2d");
    if (!m) return;
    m.fillStyle = "white";
    m.font = "bold 78px Georgia, serif";
    m.textAlign = "center";
    m.textBaseline = "middle";
    m.fillText("₿", 50, 54);
    const bitmap = m.getImageData(0, 0, 100, 100).data;
    const particles: {
      x: number;
      y: number;
      z: number;
      ink: boolean;
      noise: number;
    }[] = [];
    for (let y = -1; y <= 1; y += 0.047)
      for (let x = -1; x <= 1; x += 0.047) {
        if (x * x + y * y > 1) continue;
        const px = Math.round((x + 1) * 49),
          py = Math.round((y + 1) * 49);
        const ink = bitmap[(py * 100 + px) * 4 + 3] > 100;
        particles.push({
          x,
          y,
          z: ink ? 0.15 : 0.1,
          ink,
          noise: Math.sin(x * 93 + y * 171),
        });
        if (Math.round(y * 100) % 2 === 0)
          particles.push({
            x,
            y,
            z: -0.12,
            ink: false,
            noise: Math.cos(y * 53 + x * 97),
          });
      }
    let width = 0,
      height = 0,
      frame = 0,
      last = 0,
      time = 0,
      visible = true,
      px = 0,
      py = 0;
    function paint() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const radius = Math.min(width * 0.28, height * 0.31),
        cx = width * 0.53,
        cy = height * 0.44;
      const scroll = Math.min(1, window.scrollY / innerHeight),
        angle = Math.sin(time * 0.00017) * 0.34 + 0.22 + px * 0.15,
        tilt = -0.2 + py * 0.08,
        ca = Math.cos(angle),
        sa = Math.sin(angle),
        ct = Math.cos(tilt),
        st = Math.sin(tilt);
      const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.6);
      haze.addColorStop(0, "rgba(160,190,150,.055)");
      haze.addColorStop(1, "rgba(160,190,150,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, width, height);
      const projected = particles
        .map((p) => {
          const x = p.x * ca + p.z * sa,
            z = -p.x * sa + p.z * ca,
            y = p.y * ct - z * st,
            z2 = p.y * st + z * ct,
            k = 3 / (3 - z2);
          return {
            x: cx + x * radius * k + p.noise * scroll * 50,
            y: cy + y * radius * k - Math.abs(p.noise) * scroll * 45,
            z: z2,
            ink: p.ink,
            noise: p.noise,
          };
        })
        .sort((a, b) => a.z - b.z);
      projected.forEach((p) => {
        const light = Math.max(0.1, 0.36 + p.z * 0.35);
        ctx.fillStyle = p.ink
          ? `rgba(221,232,215,${light + 0.3})`
          : `rgba(151,163,147,${light * 0.65})`;
        const size = p.ink ? 1.8 : 1.15;
        if (scroll > 0.2 && p.noise > 1 - scroll)
          ctx.fillRect(p.x, p.y, size * 2.5, size * 2.5);
        else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.strokeStyle = "rgba(154,175,147,.1)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius * 1.15, radius * 0.35, -0.4, 0, Math.PI * 2);
      ctx.stroke();
    }
    function active() {
      return !paused && visible && !document.hidden;
    }
    function tick(now: number) {
      frame = 0;
      if (!active()) return;
      if (!last) last = now;
      const delta = now - last;
      if (delta > 1000 / 30) {
        time += Math.min(delta, 80);
        last = now;
        paint();
      }
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (active()) frame = requestAnimationFrame(tick);
      else if (!document.hidden) paint();
    }
    function resize() {
      const box = el!.getBoundingClientRect();
      width = box.width;
      height = box.height;
      const dpr = Math.min(devicePixelRatio || 1, 1.6);
      el!.width = Math.round(width * dpr);
      el!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(el);
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      sync();
    });
    observer.observe(el);
    const hero = el.closest(".hero");
    const pointer = (event: Event) => {
      if (paused) return;
      const e = event as PointerEvent;
      if (e.pointerType !== "mouse") return;
      const box = hero!.getBoundingClientRect();
      px = ((e.clientX - box.left) / box.width) * 2 - 1;
      py = ((e.clientY - box.top) / box.height) * 2 - 1;
    };
    hero?.addEventListener("pointermove", pointer, { passive: true });
    document.addEventListener("visibilitychange", sync);
    resize();
    sync();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      hero?.removeEventListener("pointermove", pointer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [paused]);
  return <canvas ref={canvas} className="signal-canvas" aria-hidden="true" />;
}
