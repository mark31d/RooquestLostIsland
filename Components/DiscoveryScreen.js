import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  Animated,
  StyleSheet,
  Dimensions,
  Share,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {FACTS} from './DiscoveryData';
import AssetRegistry from './AssetRegistry';
import Colors from './Colors';
import {useApp} from '../App';

const {width, height} = Dimensions.get('window');
const PARTICLE_COUNT = 10;
const PARTICLE_COLORS = [
  '#D4A017', '#F5C842', '#A855F7', '#ffffff',
  '#D4A017', '#F5C842', '#A855F7', '#ffffff',
  '#D4A017', '#F5C842',
];

const MILESTONE_TITLES = {
  5:  'First Cache Found',
  10: 'Island Explorer',
  15: 'Seasoned Wanderer',
  20: 'Keeper of Secrets',
  25: 'Master of the Island',
};
const getMilestoneTitle = n =>
  MILESTONE_TITLES[n] ?? `${n} Discoveries`;
const getMilestoneSub = n =>
  n <= 5  ? 'Your first 5 finds. The island opens its gates.' :
  n <= 10 ? 'Ten secrets uncovered. The path runs deep.' :
  n <= 15 ? 'You read the island like an old map.' :
  n <= 20 ? 'Few explorers venture this far.' :
            'The island holds no secrets from you.';

function shufflePool() {
  const indices = Array.from({length: FACTS.length}, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

export default function DiscoveryScreen() {
  const insets = useSafeAreaInsets();
  const {discoveryCount, bumpDiscovery} = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [currentFact, setCurrentFact] = useState('');
  const [pool, setPool] = useState([]);
  const [bonusVisible, setBonusVisible] = useState(false);
  const [bonusCount, setBonusCount] = useState(0);

  const chestScale = useRef(new Animated.Value(1)).current;
  const factSlide = useRef(new Animated.Value(60)).current;
  const factOpacity = useRef(new Animated.Value(0)).current;
  const bonusScale = useRef(new Animated.Value(0)).current;
  const bonusOpacity = useRef(new Animated.Value(0)).current;

  const particles = useRef(
    Array.from({length: PARTICLE_COUNT}, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(1),
    })),
  ).current;

  const CHEST_SIZE = Math.min(
    width * 0.88,
    (height - insets.top - insets.bottom) * 0.42,
  );

  const burstParticles = () => {
    const anims = particles.map((p, i) => {
      const angle = (i / PARTICLE_COUNT) * 2 * Math.PI;
      const dist = 80 + Math.random() * 60;
      p.x.setValue(0);
      p.y.setValue(0);
      p.opacity.setValue(1);
      p.scale.setValue(1);
      return Animated.parallel([
        Animated.timing(p.x, {toValue: Math.cos(angle) * dist, duration: 700, useNativeDriver: true}),
        Animated.timing(p.y, {toValue: Math.sin(angle) * dist - 20, duration: 700, useNativeDriver: true}),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(p.opacity, {toValue: 0, duration: 500, useNativeDriver: true}),
        ]),
        Animated.timing(p.scale, {toValue: 0.3, duration: 700, useNativeDriver: true}),
      ]);
    });
    Animated.parallel(anims).start();
  };

  const triggerBonus = count => {
    setBonusCount(count);
    setBonusVisible(true);
    bonusScale.setValue(0.5);
    bonusOpacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(bonusScale, {toValue: 1, friction: 5, useNativeDriver: true}),
        Animated.timing(bonusOpacity, {toValue: 1, duration: 300, useNativeDriver: true}),
      ]),
      Animated.delay(2200),
      Animated.timing(bonusOpacity, {toValue: 0, duration: 400, useNativeDriver: true}),
    ]).start(() => setBonusVisible(false));
  };

  const pickNextFact = currentPool => {
    let nextPool = currentPool.length > 0 ? [...currentPool] : shufflePool();
    const idx = nextPool.shift();
    setPool(nextPool);
    return FACTS[idx];
  };

  const showFact = () => {
    factSlide.setValue(60);
    factOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(factSlide, {toValue: 0, friction: 7, useNativeDriver: true}),
      Animated.timing(factOpacity, {toValue: 1, duration: 350, delay: 120, useNativeDriver: true}),
    ]).start();
  };

  const handleOpen = () => {
    const fact = pickNextFact(pool);
    setCurrentFact(fact);
    const newCount = discoveryCount + 1;
    bumpDiscovery();
    setIsOpen(true);

    Animated.sequence([
      Animated.spring(chestScale, {toValue: 1.12, friction: 4, useNativeDriver: true}),
      Animated.spring(chestScale, {toValue: 1, friction: 6, useNativeDriver: true}),
    ]).start();

    burstParticles();
    showFact();

    if (newCount % 5 === 0) {
      setTimeout(() => triggerBonus(newCount), 700);
    }
  };

  const handleNext = () => {
    const fact = pickNextFact(pool);
    setCurrentFact(fact);
    const newCount = discoveryCount + 1;
    bumpDiscovery();

    Animated.sequence([
      Animated.spring(chestScale, {toValue: 1.07, friction: 5, useNativeDriver: true}),
      Animated.spring(chestScale, {toValue: 1, friction: 6, useNativeDriver: true}),
    ]).start();
    burstParticles();

    Animated.timing(factOpacity, {toValue: 0, duration: 130, useNativeDriver: true})
      .start(() => showFact());

    if (newCount % 5 === 0) {
      setTimeout(() => triggerBonus(newCount), 700);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({message: currentFact});
    } catch {}
  };

  return (
    <ImageBackground
      source={AssetRegistry.bg_main}
      style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}
      imageStyle={styles.bgImage}>
      <View style={styles.bgOverlay} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Discovery</Text>
          {discoveryCount > 0 && (
            <View style={styles.countChip}>
              <Text style={styles.countNum}>{discoveryCount}</Text>
              <Text style={styles.countSuffix}> opened</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSub}>
          Each chest holds a new find. Open it and see what the island reveals
          today.
        </Text>
      </View>

      <View style={styles.centerArea}>
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                backgroundColor: PARTICLE_COLORS[i],
                transform: [{translateX: p.x}, {translateY: p.y}, {scale: p.scale}],
                opacity: p.opacity,
              },
            ]}
          />
        ))}

        <Animated.Image
          source={isOpen ? AssetRegistry.chest_open : AssetRegistry.chest_closed}
          style={[styles.chest, {width: CHEST_SIZE, height: CHEST_SIZE, transform: [{scale: chestScale}]}]}
        />
      </View>

      {isOpen && (
        <Animated.View
          style={[styles.factCard, {transform: [{translateY: factSlide}], opacity: factOpacity}]}>
          <Text style={styles.factText}>"{currentFact}"</Text>
        </Animated.View>
      )}

      <View style={styles.bottomArea}>
        {!isOpen ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleOpen} activeOpacity={0.85}>
            <LinearGradient
              colors={['#A07810', '#F5C842']}
              start={{x: 0, y: 0.5}}
              end={{x: 1, y: 0.5}}
              style={styles.btnGradient}>
              <View style={styles.btnInner}>
                <Text style={styles.primaryBtnText}>Open discovery</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.openedBtns}>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
              <LinearGradient
                colors={['#A07810', '#F5C842']}
                start={{x: 0, y: 0.5}}
                end={{x: 1, y: 0.5}}
                style={styles.btnGradient}>
                <View style={styles.btnInner}>
                  <Text style={styles.primaryBtnText}>Next</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <LinearGradient
                colors={['#A07810', '#F5C842']}
                start={{x: 0, y: 0.5}}
                end={{x: 1, y: 0.5}}
                style={styles.shareBtnGradient}>
                <View style={styles.btnInner}>
                  <Image source={AssetRegistry.icon_share} style={styles.shareIcon} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Milestone bonus overlay */}
      {bonusVisible && (
        <Animated.View
          style={[
            styles.bonusOverlay,
            {opacity: bonusOpacity, transform: [{scale: bonusScale}]},
          ]}
          pointerEvents="none">
          <LinearGradient
            colors={['#A07810', '#D4A017', '#F5C842']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.bonusGradient}>
            <View style={styles.bonusInner}>
              <Image source={AssetRegistry.chest_open} style={styles.bonusIcon} />
              <View style={styles.bonusTextWrap}>
                <Text style={styles.bonusLabel}>Milestone Reached</Text>
                <Text style={styles.bonusTitle}>{getMilestoneTitle(bonusCount)}</Text>
                <Text style={styles.bonusSub}>{getMilestoneSub(bonusCount)}</Text>
              </View>
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusBadgeNum}>{bonusCount}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {resizeMode: 'cover'},
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,8,32,0.88)',
  },
  container: {flex: 1},
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 7,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.gold,
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold_muted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold_border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countNum: {fontSize: 14, fontWeight: '800', color: Colors.gold},
  countSuffix: {fontSize: 12, color: Colors.text_muted},
  headerSub: {
    fontSize: 14,
    color: Colors.text_secondary,
    lineHeight: 20,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  chest: {resizeMode: 'contain'},
  factCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(22,14,53,0.96)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.gold_border,
    padding: 18,
  },
  factText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: Colors.text_secondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  primaryBtn: {borderRadius: 16, overflow: 'hidden'},
  btnGradient: {
    height: 56,
    borderRadius: 16,
  },
  btnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {color: '#fff', fontSize: 17, fontWeight: '700'},
  openedBtns: {flexDirection: 'row', gap: 12},
  nextBtn: {flex: 1, borderRadius: 16, overflow: 'hidden'},
  shareBtn: {width: 56, height: 56, borderRadius: 16, overflow: 'hidden'},
  shareBtnGradient: {flex: 1},
  shareIcon: {width: 22, height: 22, resizeMode: 'contain', tintColor: '#fff'},
  bonusOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 220,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.gold,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  bonusGradient: {
    borderRadius: 20,
  },
  bonusInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  bonusIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  bonusTextWrap: {
    flex: 1,
  },
  bonusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(13,8,32,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  bonusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A0A3E',
    marginBottom: 2,
  },
  bonusSub: {
    fontSize: 12,
    color: 'rgba(13,8,32,0.75)',
    lineHeight: 16,
  },
  bonusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13,8,32,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusBadgeNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A0A3E',
  },
});
