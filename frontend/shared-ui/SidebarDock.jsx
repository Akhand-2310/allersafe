import { useMotionValue, useSpring, useTransform, motion } from 'motion/react';
import { useRef } from 'react';
import './SidebarDock.css';

function SidebarDockItem({ item, active, onClick, mouseY, spring, distance, magnification, baseItemSize }) {
  const ref = useRef(null);
  const mouseDistance = useTransform(mouseY, value => {
    const rect = ref.current?.getBoundingClientRect() || { y: 0, height: baseItemSize };
    return value - rect.y - baseItemSize / 2;
  });
  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);

  return (
    <motion.button
      ref={ref}
      type="button"
      className={`sidebar-dock-item ${active ? 'active' : ''}`}
      onClick={onClick}
      style={{ minHeight: size }}
      aria-current={active ? 'page' : undefined}
    >
      <motion.span className="sidebar-dock-icon" style={{ width: size, height: size }}>
        <item.Icon />
      </motion.span>
      <span className="sidebar-dock-label">{item.label}</span>
    </motion.button>
  );
}

export function SidebarDock({ items, activeId, onSelect }) {
  const mouseY = useMotionValue(Infinity);
  const spring = { mass: 0.1, stiffness: 150, damping: 12 };

  return (
    <nav
      className="sidebar-dock"
      onMouseMove={event => mouseY.set(event.clientY)}
      onMouseLeave={() => mouseY.set(Infinity)}
      aria-label="Application navigation"
    >
      {items.map(item => (
        <SidebarDockItem
          key={item.id}
          item={item}
          active={activeId === item.id}
          onClick={() => onSelect(item.id)}
          mouseY={mouseY}
          spring={spring}
          distance={180}
          magnification={72}
          baseItemSize={48}
        />
      ))}
    </nav>
  );
}
