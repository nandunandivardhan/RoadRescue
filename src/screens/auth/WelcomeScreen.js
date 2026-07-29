/**
 * WelcomeScreen — Onboarding / Welcome page
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  FlatList,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from '../../components/CustomButton';
import { COLORS, FONTS, SIZES } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: 'car-emergency',
    title: 'Instant Roadside Help',
    description: 'Stranded on the road? Get connected to verified mechanics near you within seconds.',
    gradient: ['#FF6B35', '#FF8F66'],
  },
  {
    id: '2',
    icon: 'map-marker-radius',
    title: 'Live Tracking',
    description: 'Track your mechanic in real-time on the map. Know exactly when help will arrive.',
    gradient: ['#1B2CC1', '#4A58D4'],
  },
  {
    id: '3',
    icon: 'shield-check',
    title: 'Safe & Trusted',
    description: 'All mechanics are verified professionals. Secure payments. 24/7 support when you need it.',
    gradient: ['#00C853', '#4CAF50'],
  },
];

const WelcomeScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < slides.length) {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex); // Manual update for better web reliability
    } else {
      navigation.navigate('RoleSelection');
    }
  };

  const handleSkip = () => {
    navigation.navigate('RoleSelection');
  };

  const onScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const renderSlide = ({ item, index }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    // Fallback for animations on web if needed
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    const IconComponent = ({ name, size, color }) => {
      try {
        return <MaterialCommunityIcons name={name} size={size} color={color} />;
      } catch (e) {
        return <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 10 }} />;
      }
    };

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale }], opacity }]}>
          <LinearGradient
            colors={item.gradient || ['#FF6B35', '#FF8F66']}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <IconComponent name={item.icon} size={64} color={COLORS.white} />
          </LinearGradient>
        </Animated.View>
        <Animated.Text style={[styles.slideTitle, { opacity }]}>{item.title}</Animated.Text>
        <Animated.Text style={[styles.slideDescription, { opacity }]}>
          {item.description}
        </Animated.Text>
      </View>
    );
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              {
                width: isActive ? 28 : 8,
                opacity: isActive ? 1 : 0.3,
                backgroundColor: COLORS.primary,
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Brand Identity */}
      <View style={styles.brandContainer}>
        <Image 
          source={require('../../../assets/app_logo.png')} 
          style={styles.brandLogo}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>RoadRescue</Text>
      </View>

      {/* Skip button */}
      <View style={styles.skipButtonContainer}>
        <CustomButton
          title="Skip"
          onPress={handleSkip}
          variant="ghost"
          size="small"
          fullWidth={false}
        />
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { 
            useNativeDriver: false,
            listener: onScroll // Fallback listener
          }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Dots */}
      {renderDots()}

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <CustomButton
          title={currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          icon={currentIndex === slides.length - 1 ? 'arrow-right' : 'chevron-right'}
          iconPosition="right"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  skipButtonContainer: {
    position: 'absolute',
    top: 50,
    right: SIZES.screenPadding,
    zIndex: 10,
  },
  brandContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  brandName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 4,
    letterSpacing: 1,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.xxl,
    paddingTop: 80,
  },
  iconContainer: {
    marginBottom: SIZES.xxxl,
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  slideTitle: {
    fontSize: SIZES.h2,
    color: COLORS.textPrimary,
    ...FONTS.bold,
    textAlign: 'center',
    marginBottom: SIZES.base,
  },
  slideDescription: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SIZES.base,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.xxl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  bottomActions: {
    paddingHorizontal: SIZES.screenPadding,
    paddingBottom: 40,
  },
});

export default WelcomeScreen;
