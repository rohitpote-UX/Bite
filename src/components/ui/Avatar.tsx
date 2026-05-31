/**
 * Avatar — User avatar with initials fallback
 */

import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { getInitials } from '../../utils/calculations';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: AvatarSize;
  style?: ViewStyle;
}

const SIZES: Record<AvatarSize, { container: number; text: number }> = {
  xs: { container: 28, text: FontSize.label },
  sm: { container: 36, text: FontSize.caption },
  md: { container: 44, text: FontSize.bodySm },
  lg: { container: 56, text: FontSize.body },
  xl: { container: 80, text: FontSize.h2 },
};

// Generate a consistent color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    '#FF6B35', '#FF5733', '#4CAF50', '#2196F3',
    '#9C27B0', '#FF9800', '#00BCD4', '#8B1A1A',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const Avatar: React.FC<AvatarProps> = ({ name, uri, size = 'md', style }) => {
  const s = SIZES[size];
  const bgColor = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.container,
        {
          width: s.container,
          height: s.container,
          borderRadius: s.container / 2,
          backgroundColor: uri ? 'transparent' : bgColor,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: s.container, height: s.container, borderRadius: s.container / 2 }}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: s.text }]}>{initials}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
});
