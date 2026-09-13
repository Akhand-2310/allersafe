import { useEffect, useMemo, useRef } from 'react';

const BUBBLE_COUNT = 34;

function createBubbles() {
  return Array.from({ length: BUBBLE_COUNT }, (_, index) => ({
    x: (index * 47 + 13) % 100,
    y: (index * 71 + 19) % 100,
    size: 7 + ((index * 11) % 22),
    opacity: 0.18 + ((index * 7) % 30) / 100,
    delay: (index % 8) * -0.55
  }));
}

export function InteractiveBubbles() {
  const containerRef = useRef(null);
  const bubbleRefs = useRef([]);
  const pointerRef = useRef(null);
  const positionsRef = useRef([]);
  const bubbles = useMemo(createBubbles, []);

  useEffect(() => {
    positionsRef.current = bubbles.map(bubble => ({ x: 0, y: 0 }));
    let frameId;

    const animate = () => {
      const container = containerRef.current;
      const pointer = pointerRef.current;
      if (container) {
        const bounds = container.getBoundingClientRect();
        bubbles.forEach((bubble, index) => {
          const element = bubbleRefs.current[index];
          const position = positionsRef.current[index];
          if (!element || !position) return;
          let targetX = 0;
          let targetY = 0;
          let scale = 1;
          if (pointer) {
            const baseX = (bubble.x / 100) * bounds.width;
            const baseY = (bubble.y / 100) * bounds.height;
            const dx = baseX - pointer.x;
            const dy = baseY - pointer.y;
            const distance = Math.hypot(dx, dy);
            const radius = 190;
            if (distance < radius) {
              const strength = (1 - distance / radius) ** 2;
              const angle = distance > 0 ? Math.atan2(dy, dx) : 0;
              targetX = Math.cos(angle) * strength * 54;
              targetY = Math.sin(angle) * strength * 54;
              scale = 1 + strength * 0.24;
            }
          }
          position.x += (targetX - position.x) * 0.12;
          position.y += (targetY - position.y) * 0.12;
          element.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`;
        });
      }
      frameId = requestAnimationFrame(animate);
    };

    const handlePointerMove = event => {
      const bounds = containerRef.current?.getBoundingClientRect();
      if (bounds) pointerRef.current = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };
    const clearPointer = () => { pointerRef.current = null; };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('blur', clearPointer);
    frameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('blur', clearPointer);
    };
  }, [bubbles]);

  return <div ref={containerRef} className="interactive-bubbles" aria-hidden="true">
    {bubbles.map((bubble, index) => <span key={index} ref={element => { bubbleRefs.current[index] = element; }} className="interactive-bubble" style={{ left: `${bubble.x}%`, top: `${bubble.y}%`, width: bubble.size, height: bubble.size, opacity: bubble.opacity, animationDelay: `${bubble.delay}s` }} />)}
  </div>;
}
