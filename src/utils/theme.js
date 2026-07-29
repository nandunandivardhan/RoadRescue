/**
 * RoadRescue Design System
 * Premium design tokens for the entire application
 */

export const COLORS = {
  // Primary brand palette
  primary: '#FF6B35',        // Vibrant orange — urgency + energy
  primaryDark: '#E55A2B',
  primaryLight: '#FF8F66',
  primaryGhost: 'rgba(255, 107, 53, 0.1)',

  // Secondary accents
  secondary: '#1B2CC1',      // Deep blue — trust + reliability
  secondaryDark: '#141FA0',
  secondaryLight: '#4A58D4',

  // Semantic colors
  success: '#00C853',
  successLight: 'rgba(0, 200, 83, 0.12)',
  warning: '#FFB300',
  warningLight: 'rgba(255, 179, 0, 0.12)',
  danger: '#FF1744',
  dangerLight: 'rgba(255, 23, 68, 0.12)',
  info: '#2979FF',
  infoLight: 'rgba(41, 121, 255, 0.12)',

  // Neutral scale
  // Neutral scale
  white: '#FFFFFF',
  background: '#F8FAFC',     // Sleeker slate background
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#F1F5F9',

  // Text hierarchy
  textPrimary: '#111827',     // Near black for high contrast
  textSecondary: '#4B5563',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  textLink: '#2979FF',

  // Dark mode surfaces (for future)
  darkBg: '#0F1117',
  darkSurface: '#1A1D26',
  darkSurfaceElevated: '#252830',

  // Map / location specific
  mapRoute: '#4A58D4',
  locationPulse: 'rgba(255, 107, 53, 0.25)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
};

export const FONTS = {
  // Using system fonts for performance, will feel native
  regular: { fontFamily: 'System', fontWeight: '400' },
  medium: { fontFamily: 'System', fontWeight: '500' },
  semiBold: { fontFamily: 'System', fontWeight: '600' },
  bold: { fontFamily: 'System', fontWeight: '700' },
  extraBold: { fontFamily: 'System', fontWeight: '800' },
};

export const SIZES = {
  // Typography scale
  h1: 32,
  h2: 26,
  h3: 22,
  h4: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  tiny: 10,

  // Spacing scale (4px grid)
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,

  // Layout
  screenPadding: 20,
  cardPadding: 16,
  borderRadius: 14,
  borderRadiusSm: 10,
  borderRadiusLg: 20,
  borderRadiusFull: 999,

  // Component heights
  buttonHeight: 54,
  inputHeight: 54,
  headerHeight: 56,
  tabBarHeight: 70,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: (color = COLORS.primary) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  }),
};

export default { COLORS, FONTS, SIZES, SHADOWS };
