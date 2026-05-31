/**
 * TiffinFlow Color System
 * Food-app inspired warm palette designed to trigger hunger, warmth, and trust
 */

export const Colors = {
  // ── Primary Palette ──────────────────────────────────────
  primary: '#FF6B35',       // Warm Orange — main brand color
  primaryDark: '#E55A24',   // Darker orange for pressed states
  primaryLight: '#FF8C5A',  // Lighter orange for subtle accents
  secondary: '#FF5733',     // Rich Red-Orange — energy, appetite

  // ── Backgrounds ──────────────────────────────────────────
  background: '#FFF8F2',    // Cream White — warm, inviting
  surface: '#FFFFFF',       // Pure white cards
  surfaceWarm: '#FFF3E8',   // Warm surface for highlighted cards

  // ── Dark Theme ───────────────────────────────────────────
  darkBackground: '#1A1008', // Warm charcoal (not cold black)
  darkSurface: '#261810',    // Dark warm card surface
  darkSurfaceElevated: '#3D2518', // Elevated dark card

  // ── Text ─────────────────────────────────────────────────
  textPrimary: '#1F1F1F',   // Dark Charcoal — main text
  textSecondary: '#6B6B6B', // Muted gray — supporting text
  textTertiary: '#9A9A9A',  // Placeholder / hint text
  textInverse: '#FFFFFF',   // White text on dark backgrounds
  textPrimaryDark: '#F5EDD6', // Warm cream for dark mode text
  textSecondaryDark: '#C4A882', // Muted warm for dark mode

  // ── Meal Type Colors ─────────────────────────────────────
  veg: '#4CAF50',           // Fresh Green — vegetarian
  vegLight: '#E8F5E9',      // Light green background
  vegDark: '#2E7D32',       // Deep green
  nonVeg: '#8B1A1A',        // Deep Maroon — non-vegetarian
  nonVegLight: '#FFEBEE',   // Light red background
  nonVegDark: '#6B0000',    // Darker maroon
  skip: '#9E9E9E',          // Neutral gray — skip
  skipLight: '#F5F5F5',     // Light gray background

  // ── Status Colors ────────────────────────────────────────
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  error: '#F44336',
  errorLight: '#FFEBEE',
  info: '#2196F3',
  infoLight: '#E3F2FD',

  // ── Payment Status ───────────────────────────────────────
  paid: '#4CAF50',
  pending: '#FF9800',
  overdue: '#F44336',

  // ── Accent & Gradient ────────────────────────────────────
  accent: '#FFB347',        // Warm yellow-orange accent
  accentLight: '#FFF0CC',   // Light yellow tint
  gradientStart: '#FF6B35',
  gradientEnd: '#FF5733',

  // ── Neutral Grays ────────────────────────────────────────
  border: '#F0E8DF',        // Warm off-white border
  borderDark: '#3D2E1E',    // Dark mode border
  divider: '#F5EDE4',       // Subtle divider
  shadow: 'rgba(255, 107, 53, 0.15)', // Orange-tinted shadow

  // ── Overlay ──────────────────────────────────────────────
  overlay: 'rgba(31, 16, 8, 0.6)',
  overlayLight: 'rgba(255, 248, 242, 0.95)',

  // ── Chart Colors ─────────────────────────────────────────
  chart: ['#FF6B35', '#4CAF50', '#8B1A1A', '#FFB347', '#2196F3'],

  // ── Transparent ──────────────────────────────────────────
  transparent: 'transparent',
};

export type ColorKey = keyof typeof Colors;
