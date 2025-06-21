export const COLORS = {
  // iOS System Colors
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemRed: '#FF3B30',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemPurple: '#AF52DE',
  systemTeal: '#5AC8FA',
  systemPink: '#FF2D92',
  systemIndigo: '#5856D6',
  
  // Background Colors
  background: {
    primary: '#000000',           // Pure black for OLED
    secondary: '#1C1C1E',        // iOS secondary background
    tertiary: '#2C2C2E',         // iOS tertiary background
    grouped: '#1C1C1E',          // iOS grouped background
    card: '#1C1C1E',             // Card background
    elevated: '#2C2C2E',         // Elevated surfaces
  },
  
  // Text Colors
  text: {
    primary: '#FFFFFF',          // Primary text
    secondary: '#EBEBF5',        // Secondary text (60% opacity)
    tertiary: '#EBEBF5',         // Tertiary text (30% opacity)
    quaternary: '#EBEBF5',       // Quaternary text (18% opacity)
    placeholder: '#EBEBF5',      // Placeholder text (30% opacity)
  },
  
  // Separator Colors
  separator: {
    default: '#38383A',          // Default separator
    opaque: '#38383A',           // Opaque separator
  },
  
  // Fill Colors
  fill: {
    primary: '#787880',          // Primary fill (20% opacity)
    secondary: '#787880',        // Secondary fill (16% opacity)
    tertiary: '#767680',         // Tertiary fill (12% opacity)
    quaternary: '#747480',       // Quaternary fill (8% opacity)
  },
  
  // Accent Colors (new structure)
  accentColors: {
    primary: '#007AFF',          // Primary accent
    secondary: '#34C759',        // Secondary accent
    destructive: '#FF3B30',      // Destructive actions
    warning: '#FF9500',          // Warning
  },
  
  // Interactive States
  interactive: {
    hover: 'rgba(255, 255, 255, 0.04)',
    pressed: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(0, 122, 255, 0.2)',
    disabled: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Constants
  white: '#FFFFFF',
  black: '#000000',
  clear: 'transparent',
  
  // Backward compatibility mappings
  primary: '#007AFF',
  secondary: '#34C759',
  bgDark: '#000000',
  cardDark: '#1C1C1E',
  cardBackground: '#1C1C1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textLight: '#999999',
  accent: '#007AFF',  // Simple string for backward compatibility
}; 