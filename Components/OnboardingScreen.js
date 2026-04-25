import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AssetRegistry from './AssetRegistry';
import Colors from './Colors';

const {width, height} = Dimensions.get('window');
const ONBOARDING_KEY = '@goon_island_onboarding';
const IMG_HEIGHT = height * 0.44;

const SLIDES = [
  {
    id: 0,
    image: AssetRegistry.onboarding_1,
    title: 'Explore the Lost Island',
    body: 'Step into the role of an explorer and uncover a forgotten island once shaped by pirates.',
    button: 'Start Journey',
  },
  {
    id: 1,
    image: AssetRegistry.onboarding_2,
    title: 'Discover Pirate Stories',
    body: 'Explore stories and facts about pirate life, divided into clear categories for easy discovery.',
    button: 'Continue',
  },
  {
    id: 2,
    image: AssetRegistry.onboarding_3,
    title: 'Discover Lost Artifacts',
    body: 'Find objects left behind on the island and learn how pirates used them in their daily life.',
    button: 'Continue',
  },
  {
    id: 3,
    image: AssetRegistry.onboarding_4,
    title: 'Make Your Own Discoveries',
    body: 'Reveal random facts and stories with a single tap and uncover hidden parts of the island.',
    button: 'Continue',
  },
  {
    id: 4,
    image: AssetRegistry.onboarding_5,
    title: "Test What You've Learned",
    body: 'Take a simple quiz, check your knowledge, and save what matters to you along the way.',
    button: 'Start Exploring',
  },
];

export default function OnboardingScreen({navigation}) {
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 20);
  const bottomPad = Math.max(insets.bottom, 20);

  const goNext = async () => {
    if (index < SLIDES.length - 1) {
      const next = index + 1;
      listRef.current?.scrollToIndex({index: next, animated: true});
      setIndex(next);
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'done');
      navigation.replace('Main');
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'done');
    navigation.replace('Main');
  };

  const onScroll = e => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  };

  const renderSlide = ({item}) => (
    <View style={styles.slide}>
      <View style={styles.imageCard}>
        <Image source={item.image} style={styles.slideImage} />
        <LinearGradient
          colors={['transparent', 'rgba(13,8,32,0.5)']}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.slideCounter}>
          {String(item.id + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={AssetRegistry.bg_main}
      style={styles.root}
      imageStyle={styles.bgImage}>
      <View style={styles.bgOverlay} />

      <View style={[styles.header, {paddingTop: topPad}]}>
        <Image source={AssetRegistry.logo} style={styles.logo} resizeMode="contain" />
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => String(item.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        bounces={false}
        scrollEnabled
        style={styles.flatList}
      />

      <View style={[styles.bottomBar, {paddingBottom: bottomPad + 8}]}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={i === index ? styles.dotActive : styles.dotInactive}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={goNext} activeOpacity={0.85}>
          <LinearGradient
            colors={['#A07810', '#D4A017', '#F5C842']}
            start={{x: 0, y: 0.5}}
            end={{x: 1, y: 0.5}}
            style={styles.btnGradient}>
            <View style={styles.btnInner}>
              <Text style={styles.buttonText}>{SLIDES[index].button}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {index < SLIDES.length - 1 ? (
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipBtn} />
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg_dark,
  },
  bgImage: {
    resizeMode: 'cover',
    opacity: 0.15,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,8,32,0.92)',
  },
  header: {
    alignItems: 'center',
    paddingBottom: 10,
    zIndex: 10,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  imageCard: {
    width: '100%',
    height: IMG_HEIGHT,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.gold_border,
    backgroundColor: Colors.bg_card,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textBlock: {
    paddingTop: 22,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  slideCounter: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 3,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.gold,
    marginBottom: 12,
    lineHeight: 32,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 14,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  dotActive: {
    width: 26,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  dotInactive: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(212,160,23,0.20)',
    borderWidth: 1,
    borderColor: Colors.gold_border,
  },
  button: {
    width: width - 48,
    borderRadius: 18,
    overflow: 'hidden',
  },
  btnGradient: {
    height: 58,
    borderRadius: 18,
  },
  btnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  skipBtn: {
    marginTop: 14,
    paddingVertical: 6,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    color: Colors.text_muted,
    fontSize: 14,
    fontWeight: '500',
  },
});
