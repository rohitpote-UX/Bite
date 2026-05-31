/**
 * TiffinFlow Spacing System
 * 8px base unit for consistent, premium layout
 */

export const Spacing = {
  // Base unit: 8px
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Screen padding
  screenHorizontal: 20,
  screenVertical: 24,

  // Card
  cardPadding: 20,
  cardPaddingLg: 24,

  // Component gaps
  gapXs: 4,
  gapSm: 8,
  gapMd: 12,
  gapLg: 16,
  gapXl: 24,
};

export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  full: 9999,
  card: 20,
  button: 14,
  badge: 8,
  chip: 20,
};

import { Platform } from 'react-native';

export const Shadow = {
  sm: Platform.select({
    web: {
      boxShadow: '0px 2px 8px rgba(255, 107, 53, 0.08)',
    } as any,
    default: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
  }),
  md: Platform.select({
    web: {
      boxShadow: '0px 4px 12px rgba(255, 107, 53, 0.12)',
    } as any,
    default: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
  }),
  lg: Platform.select({
    web: {
      boxShadow: '0px 8px 20px rgba(31, 31, 31, 0.15)',
    } as any,
    default: {
      shadowColor: '#1F1F1F',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
  }),
  primary: Platform.select({
    web: {
      boxShadow: '0px 6px 16px rgba(255, 107, 53, 0.35)',
    } as any,
    default: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
  }),
};

