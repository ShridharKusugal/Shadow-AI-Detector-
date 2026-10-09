import type { Variants } from 'framer-motion';

/**
 * Shared animation variants for Framer Motion
 * Keeps timing/easing consistent across all pages and components.
 */

// ── Page Transitions ──────────────────────────────────────────
export const pageVariants: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.18, ease: 'easeIn' } }
};

// ── Card Entrance ─────────────────────────────────────────────
export const cardVariants: Variants = {
  hidden:  { opacity: 0, y: 6 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }
  })
};

// ── Stagger Container (keeps children ordered) ─────────────────
export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05 } }
};

// ── Modal ─────────────────────────────────────────────────────
export const modalOverlayVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.14, ease: 'easeIn' } }
};

export const modalContentVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.97, y: 4 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.2,  ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.14, ease: 'easeIn' } }
};

export const modalVariants: Variants = modalContentVariants;

// ── Drawer (slide-in from right) ──────────────────────────────
export const drawerVariants: Variants = {
  hidden:  { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  exit:    { x: '100%', opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } }
};

// ── List item (for fade-in table rows / alert items) ──────────
export const listItemVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.16, ease: 'easeOut' } }
};

// ── Value flash (when a metric number updates) ────────────────
export const valueFlashVariants: Variants = {
  idle:    { backgroundColor: 'transparent' },
  flash:   {
    backgroundColor: ['transparent', 'rgba(6,182,212,0.12)', 'transparent'],
    transition: { duration: 0.55, ease: 'easeOut' }
  }
};

// ── Hover lift for interactive cards ──────────────────────────
export const hoverLift: Variants = {
  rest:  { y: 0, boxShadow: '0 1px 3px rgba(15,35,91,0.06), 0 4px 12px rgba(15,35,91,0.04)' },
  hover: { y: -2, boxShadow: '0 4px 16px rgba(15,35,91,0.10), 0 1px 4px rgba(15,35,91,0.06)', transition: { duration: 0.18, ease: 'easeOut' } }
};

// ── Upload zone drag state ─────────────────────────────────────
export const dropZoneVariants: Variants = {
  idle:    { borderColor: '#DCE5F0', backgroundColor: '#FFFFFF' },
  hover:   { borderColor: '#06B6D4', backgroundColor: '#F0FBFF', transition: { duration: 0.15 } },
  drag:    { borderColor: '#0EA5E9', backgroundColor: '#E0F7FF', scale: 1.01, transition: { duration: 0.15 } }
};

// ── Loading skeleton pulse ─────────────────────────────────────
export const skeletonVariants: Variants = {
  pulse: {
    opacity: [1, 0.5, 1],
    transition: { duration: 1.4, ease: 'easeInOut', repeat: Infinity }
  }
};

// ── Chart entry ───────────────────────────────────────────────
export const chartVariants: Variants = {
  hidden:  { opacity: 0, scaleY: 0.96, originY: 1 },
  visible: { opacity: 1, scaleY: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } }
};

// ── Toast notification ────────────────────────────────────────
export const toastVariants: Variants = {
  hidden:  { opacity: 0, x: 24, scale: 0.96 },
  visible: { opacity: 1, x: 0,  scale: 1,    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: 16, scale: 0.96, transition: { duration: 0.16, ease: 'easeIn' } }
};
