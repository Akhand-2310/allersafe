import { useEffect, useMemo, useState } from 'react';

const DEFAULT_WORDS = ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE'];

export function SplitFlapText({ words = DEFAULT_WORDS, text, cycleDelay = 2000, loop = true, className = '' }) {
  const source = typeof text === 'string' ? [text] : words;
  const phrases = useMemo(() => source.map(String), [source]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length < 2) return undefined;
    const timer = window.setInterval(() => setIndex(current => {
      const next = current + 1;
      return next >= phrases.length ? (loop ? 0 : current) : next;
    }), cycleDelay);
    return () => window.clearInterval(timer);
  }, [cycleDelay, loop, phrases.length]);

  const value = phrases[index] || '';
  return <div className={`split-flap-text ${className}`} role="text" aria-label={value}>
    {value.split('').map((char, charIndex) => <span className="split-flap-text__tile" key={`${char}-${charIndex}`}><span>{char === ' ' ? '\u00a0' : char}</span></span>)}
  </div>;
}
