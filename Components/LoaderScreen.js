import React, {useEffect, useRef} from 'react';
import {
  View,
  Image,
  Animated,
  StyleSheet,
  Easing,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AssetRegistry from './AssetRegistry';
import Colors from './Colors';

const {width, height} = Dimensions.get('window');
const ONBOARDING_KEY = '@goon_island_onboarding';
const WAVE_BARS = [
  {from: 1, to: 0.5, duration: 300, delay: 0},
  {from: 0.3, to: 0.6, duration: 300, delay: 200},
  {from: 0.6, to: 0.8, duration: 400, delay: 230},
  {from: 0.2, to: 0.5, duration: 300, delay: 100},
  {from: 1, to: 0.5, duration: 300, delay: 500},
  {from: 0.3, to: 0.6, duration: 500, delay: 0},
  {from: 1, to: 0.5, duration: 300, delay: 0},
  {from: 0.2, to: 0.5, duration: 250, delay: 400},
  {from: 0.6, to: 0.8, duration: 400, delay: 150},
  {from: 1, to: 0.5, duration: 300, delay: 0},
];

export default function LoaderScreen({navigation}) {
  const waveBars = useRef(WAVE_BARS.map(item => new Animated.Value(item.from))).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const preloaderOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loopAnimations = [];
    const delayTimers = [];

    WAVE_BARS.forEach((barConfig, index) => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(waveBars[index], {
            toValue: barConfig.to,
            duration: barConfig.duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(waveBars[index], {
            toValue: barConfig.from,
            duration: barConfig.duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      if (barConfig.delay > 0) {
        const timer = setTimeout(() => {
          animation.start();
        }, barConfig.delay);
        delayTimers.push(timer);
      } else {
        animation.start();
      }

      loopAnimations.push(animation);
    });

    const showIcon = setTimeout(() => {
      Animated.parallel([
        Animated.timing(preloaderOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2400);

    const navigate = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 4600);

    return () => {
      clearTimeout(showIcon);
      clearTimeout(navigate);
      delayTimers.forEach(timer => clearTimeout(timer));
      loopAnimations.forEach(animation => animation.stop());
    };
  }, []);

  return (
    <View style={styles.container}>
      <Image source={AssetRegistry.bg_main} style={styles.bg} />
      <View style={styles.overlay} />

      <Animated.View style={[styles.preloader, {opacity: preloaderOpacity}]}>
        <View style={styles.waveMenu}>
          {waveBars.map((barScale, index) => (
            <Animated.View
              key={`wave-bar-${index}`}
              style={[
                styles.waveBar,
                {
                  transform: [{scaleY: barScale}],
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.iconWrap,
          {opacity: iconOpacity, transform: [{scale: iconScale}]},
        ]}>
        <Image source={AssetRegistry.logo} style={styles.icon} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg_dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bg: {
    position: 'absolute',
    width,
    height,
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    width,
    height,
    backgroundColor: 'rgba(14, 14, 14, 0.45)',
  },
  preloader: {
    position: 'absolute',
    width: 200,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
  },
  waveMenu: {
    borderWidth: 4,
    borderColor: '#545FE5',
    borderRadius: 50,
    width: 200,
    height: 45,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveBar: {
    height: 30,
    width: 4,
    borderRadius: 10,
    backgroundColor: '#545FE5',
    marginHorizontal: 6,
  },
  iconWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 200,
    height: 200,
    borderRadius: 40,
    resizeMode: 'contain',
  },
});
