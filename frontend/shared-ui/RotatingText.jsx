import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import './RotatingText.css';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const RotatingText = forwardRef(({ texts, transition = { type: 'spring', damping: 25, stiffness: 300 }, initial = { y: '100%', opacity: 0 }, animate = { y: 0, opacity: 1 }, exit = { y: '-120%', opacity: 0 }, animatePresenceMode = 'wait', animatePresenceInitial = false, rotationInterval = 2000, staggerDuration = 0.035, staggerFrom = 'first', loop = true, auto = true, splitBy = 'characters', onNext, mainClassName, splitLevelClassName, elementLevelClassName, ...rest }, ref) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const splitIntoCharacters = text => typeof Intl !== 'undefined' && Intl.Segmenter ? Array.from(new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text), segment => segment.segment) : Array.from(text);
  const elements = useMemo(() => {
    const currentText = texts[currentTextIndex] || '';
    if (splitBy === 'characters') return currentText.split(' ').map((word, i, words) => ({ characters: splitIntoCharacters(word), needsSpace: i !== words.length - 1 }));
    if (splitBy === 'words') return currentText.split(' ').map((word, i, words) => ({ characters: [word], needsSpace: i !== words.length - 1 }));
    if (splitBy === 'lines') return currentText.split('\n').map((line, i, lines) => ({ characters: [line], needsSpace: i !== lines.length - 1 }));
    return currentText.split(splitBy).map((part, i, parts) => ({ characters: [part], needsSpace: i !== parts.length - 1 }));
  }, [texts, currentTextIndex, splitBy]);
  const getStaggerDelay = useCallback((index, total) => {
    if (staggerFrom === 'last') return (total - 1 - index) * staggerDuration;
    if (staggerFrom === 'center') return Math.abs(Math.floor(total / 2) - index) * staggerDuration;
    return index * staggerDuration;
  }, [staggerFrom, staggerDuration]);
  const handleIndexChange = useCallback(index => { setCurrentTextIndex(index); onNext?.(index); }, [onNext]);
  const next = useCallback(() => { const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1; if (nextIndex !== currentTextIndex) handleIndexChange(nextIndex); }, [currentTextIndex, texts.length, loop, handleIndexChange]);
  const previous = useCallback(() => { const previousIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : 0) : currentTextIndex - 1; if (previousIndex !== currentTextIndex) handleIndexChange(previousIndex); }, [currentTextIndex, texts.length, loop, handleIndexChange]);
  const jumpTo = useCallback(index => handleIndexChange(Math.max(0, Math.min(index, texts.length - 1))), [texts.length, handleIndexChange]);
  const reset = useCallback(() => handleIndexChange(0), [handleIndexChange]);
  useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [next, previous, jumpTo, reset]);
  useEffect(() => { if (!auto || texts.length < 2) return undefined; const intervalId = setInterval(next, rotationInterval); return () => clearInterval(intervalId); }, [next, rotationInterval, auto, texts.length]);
  const totalCharacters = elements.reduce((sum, word) => sum + word.characters.length, 0);
  return <motion.span className={cn('text-rotate', mainClassName)} {...rest} layout transition={transition}>
    <span className="text-rotate-sr-only">{texts[currentTextIndex]}</span>
    <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
      <motion.span key={currentTextIndex} className={cn(splitBy === 'lines' ? 'text-rotate-lines' : 'text-rotate')} layout aria-hidden="true">
        {elements.map((wordObj, wordIndex, array) => {
          const previousCharsCount = array.slice(0, wordIndex).reduce((sum, word) => sum + word.characters.length, 0);
          return <span key={wordIndex} className={cn('text-rotate-word', splitLevelClassName)}>{wordObj.characters.map((char, charIndex) => <motion.span key={charIndex} initial={initial} animate={animate} exit={exit} transition={{ ...transition, delay: getStaggerDelay(previousCharsCount + charIndex, totalCharacters) }} className={cn('text-rotate-element', elementLevelClassName)}>{char}</motion.span>)}{wordObj.needsSpace && <span className="text-rotate-space"> </span>}</span>;
        })}
      </motion.span>
    </AnimatePresence>
  </motion.span>;
});

RotatingText.displayName = 'RotatingText';
export default RotatingText;
