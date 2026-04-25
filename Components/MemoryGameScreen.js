import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  Animated,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ARTIFACTS} from './ArtifactsData';
import AssetRegistry from './AssetRegistry';
import Colors from './Colors';

const {width} = Dimensions.get('window');
const TOTAL_ROUNDS = 10;
const CARD_W = Math.floor((width - 48) / 3);
const CARD_H = Math.floor(CARD_W * 1.2);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeRound(usedIds) {
  const pool = shuffle(ARTIFACTS);
  const correct = pool.find(a => !usedIds.has(a.id)) || pool[0];
  const decoys = pool.filter(a => a.id !== correct.id).slice(0, 2);
  const options = shuffle([correct, ...decoys]);
  return {correct, options};
}

export default function MemoryGameScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [done, setDone] = useState(false);
  const [usedIds] = useState(new Set());
  const [currentRound, setCurrentRound] = useState(() => makeRound(new Set()));

  const timerRef = useRef(null);
  const doneAnim = useRef(new Animated.Value(0)).current;
  const flashAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (done) {
      clearInterval(timerRef.current);
      Animated.spring(doneAnim, {toValue: 1, friction: 5, useNativeDriver: true}).start();
    }
  }, [done]);

  const flash = useCallback((index, correct) => {
    const anim = flashAnims[index];
    anim.setValue(correct ? 1 : -1);
    Animated.timing(anim, {
      toValue: 0,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [flashAnims]);

  const handleSelect = useCallback((artifact, optionIndex) => {
    if (selected !== null) return;
    const correct = artifact.id === currentRound.correct.id;
    setSelected(optionIndex);
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
    flash(optionIndex, correct);

    // flash correct card green if wrong answer
    if (!correct) {
      const correctIdx = currentRound.options.findIndex(
        o => o.id === currentRound.correct.id,
      );
      if (correctIdx !== -1) flash(correctIdx, true);
    }

    setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound > TOTAL_ROUNDS) {
        setDone(true);
      } else {
        usedIds.add(currentRound.correct.id);
        setCurrentRound(makeRound(usedIds));
        setRound(nextRound);
        setSelected(null);
        setIsCorrect(null);
        flashAnims.forEach(a => a.setValue(0));
      }
    }, 1100);
  }, [selected, currentRound, round, usedIds, flash, flashAnims]);

  const restart = () => {
    clearInterval(timerRef.current);
    usedIds.clear();
    setRound(1);
    setScore(0);
    setSeconds(0);
    setSelected(null);
    setIsCorrect(null);
    setDone(false);
    setCurrentRound(makeRound(new Set()));
    doneAnim.setValue(0);
    flashAnims.forEach(a => a.setValue(0));
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  };

  const formatTime = s =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60)
      .toString()
      .padStart(2, '0')}`;

  const progressPct = ((round - 1) / TOTAL_ROUNDS) * 100;

  return (
    <ImageBackground
      source={AssetRegistry.bg_main}
      style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}
      imageStyle={styles.bgImage}>
      <View style={styles.overlay} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}>
          <Image source={AssetRegistry.icon_back} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.titleText}>Artifact Hunt</Text>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{formatTime(seconds)}</Text>
          </View>
        </View>
      </View>

      {/* Round progress */}
      <View style={styles.roundRow}>
        <Text style={styles.roundLabel}>
          Round {round} of {TOTAL_ROUNDS}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {width: `${progressPct}%`}]} />
        </View>
      </View>

      {/* Clue card */}
      <View style={styles.clueCard}>
        <Text style={styles.clueHeading}>Which artifact is described?</Text>
        <Text style={styles.clueText}>{currentRound.correct.short}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsRow}>
        {currentRound.options.map((artifact, i) => {
          const isSelected = selected === i;
          const isThisCorrect = artifact.id === currentRound.correct.id;

          const borderColor = flashAnims[i].interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [Colors.incorrect, Colors.gold_border, Colors.correct],
          });
          const bgColor = flashAnims[i].interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [
              'rgba(110,32,32,0.55)',
              'rgba(22,14,53,0.95)',
              'rgba(58,100,40,0.55)',
            ],
          });

          return (
            <TouchableOpacity
              key={artifact.id}
              onPress={() => handleSelect(artifact, i)}
              activeOpacity={0.85}
              style={styles.optionWrap}>
              <Animated.View
                style={[
                  styles.optionCard,
                  {borderColor, backgroundColor: bgColor},
                ]}>
                <Image
                  source={AssetRegistry[artifact.key]}
                  style={styles.optionImage}
                />
                <Text style={styles.optionTitle} numberOfLines={2}>
                  {artifact.title}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Instruction hint */}
      {selected === null && (
        <Text style={styles.hint}>Tap the matching artifact</Text>
      )}
      {selected !== null && (
        <Text style={[styles.hint, isCorrect ? styles.hintCorrect : styles.hintWrong]}>
          {isCorrect ? 'Correct!' : `It was: ${currentRound.correct.title}`}
        </Text>
      )}

      {/* Done overlay */}
      <Modal visible={done} transparent animationType="none" statusBarTranslucent>
        <Animated.View
          style={[styles.doneOverlay, {opacity: doneAnim, transform: [{scale: doneAnim}]}]}>
          <View style={styles.doneCard}>
            <Image source={AssetRegistry.chest_open} style={styles.doneIcon} />
            <Text style={styles.doneTitle}>Hunt Complete!</Text>
            <View style={styles.doneStats}>
              <View style={styles.doneStatChip}>
                <Text style={styles.doneStatVal}>{score}/{TOTAL_ROUNDS}</Text>
                <Text style={styles.doneStatLbl}>correct</Text>
              </View>
              <View style={styles.doneStatDivider} />
              <View style={styles.doneStatChip}>
                <Text style={styles.doneStatVal}>{formatTime(seconds)}</Text>
                <Text style={styles.doneStatLbl}>time</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.doneBtn} onPress={restart} activeOpacity={0.85}>
              <View style={styles.doneBtnInner}>
                <Text style={styles.doneBtnText}>Play Again</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.doneBtnSecondary}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}>
              <Text style={styles.doneBtnTextSecondary}>Back</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {resizeMode: 'cover'},
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,8,32,0.90)',
  },
  container: {flex: 1},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.gold,
    borderWidth: 1,
    borderColor: Colors.gold_light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {width: 20, height: 20, resizeMode: 'contain', tintColor: '#fff'},
  titleText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text_white,
  },
  statsRow: {flexDirection: 'row', gap: 8},
  statChip: {
    backgroundColor: 'rgba(22,14,53,0.90)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gold_border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    minWidth: 52,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.text_muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {fontSize: 14, fontWeight: '700', color: Colors.gold},
  roundRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 6,
  },
  roundLabel: {fontSize: 12, color: Colors.text_secondary, marginBottom: 4},
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(40,40,40,0.86)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {height: 5, backgroundColor: Colors.gold, borderRadius: 3},
  clueCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(22,14,53,0.95)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.gold_border,
    padding: 18,
  },
  clueHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  clueText: {
    fontSize: 16,
    color: Colors.text_white,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  optionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    justifyContent: 'center',
  },
  optionWrap: {
    width: CARD_W,
  },
  optionCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    paddingBottom: 8,
  },
  optionImage: {
    width: CARD_W - 28,
    height: CARD_W - 28,
    resizeMode: 'contain',
  },
  optionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text_secondary,
    textAlign: 'center',
    lineHeight: 15,
  },
  hint: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: 14,
    color: Colors.text_muted,
    fontStyle: 'italic',
  },
  hintCorrect: {
    color: Colors.correct,
    fontWeight: '700',
    fontStyle: 'normal',
  },
  hintWrong: {
    color: Colors.incorrect,
    fontWeight: '600',
    fontStyle: 'normal',
  },
  doneOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  doneCard: {
    backgroundColor: 'rgba(22,14,53,0.98)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.gold_border,
    paddingVertical: 28,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 18,
    marginHorizontal: 28,
    alignSelf: 'stretch',
  },
  doneIcon: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },
  doneTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.gold,
    textAlign: 'center',
  },
  doneStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: Colors.gold_muted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gold_border,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  doneStatChip: {alignItems: 'center', gap: 2},
  doneStatVal: {fontSize: 24, fontWeight: '800', color: Colors.text_white},
  doneStatLbl: {
    fontSize: 11,
    color: Colors.text_muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  doneStatDivider: {width: 1, height: 36, backgroundColor: Colors.gold_border},
  doneBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 14,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  doneBtnInner: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  doneBtnText: {fontSize: 16, fontWeight: '700', color: '#fff'},
  doneBtnSecondary: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gold_border,
    paddingVertical: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  doneBtnTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text_secondary,
  },
});
