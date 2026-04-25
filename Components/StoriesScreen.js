import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {STORIES, CATEGORIES} from './StoriesData';
import AssetRegistry from './AssetRegistry';
import Colors from './Colors';

const {width} = Dimensions.get('window');
const H_PAD = 16;
const COL_GAP = 10;
const CARD_W = Math.floor((width - H_PAD * 2 - COL_GAP) / 2);
const CARD_IMG_H = Math.floor(CARD_W * 0.85);
const CARD_TEXT_H = 72;
const CARD_TOTAL_H = CARD_IMG_H + CARD_TEXT_H;

export default function StoriesScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState('All');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const surpriseBtnScale = useRef(new Animated.Value(1)).current;

  const filtered =
    activeCategory === 'All'
      ? STORIES
      : STORIES.filter(s => s.category === activeCategory);

  const handleSurprise = () => {
    Animated.sequence([
      Animated.spring(surpriseBtnScale, {toValue: 0.88, friction: 5, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -7, duration: 55, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 7, duration: 55, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -5, duration: 55, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 5, duration: 55, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 0, duration: 55, useNativeDriver: true}),
      Animated.spring(surpriseBtnScale, {toValue: 1, friction: 5, useNativeDriver: true}),
    ]).start(() => {
      const pool = activeCategory === 'All' ? STORIES : filtered;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick) navigation.navigate('StoryDetail', {story: pick});
    });
  };

  const renderCard = ({item}) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => navigation.navigate('StoryDetail', {story: item})}>
      <ImageBackground
        source={AssetRegistry[item.cardImage]}
        style={styles.cardImageArea}
        imageStyle={styles.cardImageStyle}>
        <LinearGradient
          colors={['transparent', 'rgba(13,8,32,0.65)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>{item.category}</Text>
        </View>
      </ImageBackground>
      <View style={styles.cardTextPanel}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={AssetRegistry.bg_main}
      style={[styles.container, {paddingTop: insets.top}]}
      imageStyle={styles.bgImage}>
      <View style={styles.bgOverlay} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Pirate Stories</Text>
            <Text style={styles.headerCount}>
              {filtered.length} {filtered.length === 1 ? 'story' : 'stories'}
            </Text>
          </View>
          <Animated.View
            style={{
              transform: [{translateX: shakeAnim}, {scale: surpriseBtnScale}],
            }}>
            <TouchableOpacity
              style={styles.surpriseBtn}
              onPress={handleSurprise}
              activeOpacity={0.85}>
              <LinearGradient
                colors={['#A07810', '#F5C842']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.surpriseGradient}>
                <View style={styles.surpriseInner}>
                  <Text style={styles.surpriseIcon}>?</Text>
                  <Text style={styles.surpriseText}>Surprise</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
        <Text style={styles.headerSub}>
          Explore real stories and insights about pirate life, their ships,
          legends, and the world they left behind.
        </Text>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipsScroll}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.8}>
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 2-column grid */}
      <FlatList
        key={activeCategory}
        data={filtered}
        renderItem={renderCard}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {resizeMode: 'cover'},
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,8,32,0.88)',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.bg_dark,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 2,
  },
  headerCount: {
    fontSize: 12,
    color: Colors.text_muted,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.text_secondary,
    lineHeight: 20,
  },
  surpriseBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  surpriseGradient: {
    borderRadius: 14,
  },
  surpriseInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  surpriseIcon: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
  },
  surpriseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  chipsScroll: {
    flexShrink: 0,
    marginBottom: 4,
  },
  chips: {
    paddingHorizontal: H_PAD,
    paddingVertical: 6,
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  chipInactive: {
    backgroundColor: 'transparent',
    borderColor: Colors.gold_border,
  },
  chipText: {
    fontSize: 13,
    color: Colors.text_secondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 24,
    gap: COL_GAP,
  },
  columnWrapper: {
    gap: COL_GAP,
  },
  card: {
    width: CARD_W,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gold_border,
    backgroundColor: Colors.bg_card,
  },
  cardImageArea: {
    width: CARD_W,
    height: CARD_IMG_H,
    backgroundColor: Colors.bg_card_2,
    justifyContent: 'flex-end',
  },
  cardImageStyle: {
    resizeMode: 'cover',
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(13,8,32,0.82)',
    borderWidth: 1,
    borderColor: Colors.gold_border,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTextPanel: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: Colors.bg_card,
    minHeight: CARD_TEXT_H,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text_white,
    lineHeight: 18,
  },
});
