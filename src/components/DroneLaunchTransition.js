import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import DroneGlyph from './DroneGlyph';
import { colors } from '../theme';

// react-native-web has no native animated module, so fall back to the JS driver there.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const FLY_DURATION = 1000;

// The drone icon "splits" into this fleet, each one drifting off in its own direction.
const FLEET = [
  { angle: -104, distance: 1.05, size: 34, spin: -28, color: colors.accent },
  { angle: -72, distance: 1.18, size: 24, spin: 22, color: colors.cyan },
  { angle: -38, distance: 0.94, size: 30, spin: 34, color: colors.accent },
  { angle: -140, distance: 0.98, size: 20, spin: -40, color: colors.cyan },
  { angle: 4, distance: 1.08, size: 28, spin: 18, color: colors.accent },
  { angle: 44, distance: 1.12, size: 22, spin: -26, color: colors.cyan },
  { angle: 130, distance: 1.02, size: 26, spin: 30, color: colors.accent },
  { angle: -172, distance: 0.88, size: 18, spin: -18, color: colors.cyan },
  { angle: 74, distance: 1.16, size: 32, spin: -34, color: colors.accent },
  { angle: 158, distance: 0.92, size: 20, spin: 24, color: colors.cyan },
];

const DroneLaunchContext = createContext({ launch: () => {} });

export function useDroneLaunch() {
  return useContext(DroneLaunchContext);
}

function DroneLaunchOverlay({ onFinished }) {
  const { width, height } = useWindowDimensions();
  const intro = useRef(new Animated.Value(0)).current;
  const fly = useRef(new Animated.Value(0)).current;
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;

  useEffect(() => {
    intro.setValue(0);
    fly.setValue(0);
    const animation = Animated.parallel([
      Animated.timing(intro, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(fly, {
        toValue: 1,
        duration: FLY_DURATION,
        delay: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished) finishedRef.current?.();
    });
    return () => animation.stop();
  }, [intro, fly]);

  const heroOpacity = intro.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });
  const heroScale = intro.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.92, 1.1, 1.4],
    extrapolate: 'clamp',
  });
  const glowOpacity = intro.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.16, 0.14, 0],
    extrapolate: 'clamp',
  });
  const heroRotate = intro.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-12deg'],
    extrapolate: 'clamp',
  });
  const ringStyle = {
    opacity: intro.interpolate({ inputRange: [0, 0.08, 1], outputRange: [0, 0.6, 0], extrapolate: 'clamp' }),
    transform: [{ scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.6], extrapolate: 'clamp' }) }],
  };
  const backdropOpacity = fly.interpolate({
    inputRange: [0, 0.62, 1],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  const drones = useMemo(() => FLEET.map((drone, index) => {
    const radians = (drone.angle * Math.PI) / 180;
    const radius = Math.hypot(width, height) * 0.62 * drone.distance;
    const dx = Math.cos(radians) * radius;
    const dy = Math.sin(radians) * radius;
    const start = (index % 5) * 0.022;
    return {
      ...drone,
      key: `${drone.angle}-${index}`,
      style: {
        opacity: fly.interpolate({
          inputRange: [start, start + 0.1, 0.78, 1],
          outputRange: [0, 1, 1, 0],
          extrapolate: 'clamp',
        }),
        transform: [
          { translateX: fly.interpolate({ inputRange: [start, 1], outputRange: [0, dx], extrapolate: 'clamp' }) },
          { translateY: fly.interpolate({ inputRange: [start, 1], outputRange: [0, dy], extrapolate: 'clamp' }) },
          { rotate: fly.interpolate({ inputRange: [start, 1], outputRange: ['0deg', `${drone.spin}deg`], extrapolate: 'clamp' }) },
          { scale: fly.interpolate({ inputRange: [start, start + 0.2, 1], outputRange: [0.35, 1, 0.75], extrapolate: 'clamp' }) },
        ],
      },
    };
  }), [fly, width, height]);

  return (
    <Animated.View
      testID="drone-launch-overlay"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.layer, { opacity: backdropOpacity }]}
    >
      <View style={styles.center}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: heroScale }] }]} />
        <Animated.View style={{ opacity: heroOpacity, transform: [{ scale: heroScale }, { rotate: heroRotate }] }}>
          <DroneGlyph size={96} color={colors.accent} />
        </Animated.View>
      </View>
      {drones.map((drone) => (
        <View key={drone.key} style={styles.center}>
          <Animated.View style={drone.style}>
            <DroneGlyph size={drone.size} color={drone.color} />
          </Animated.View>
        </View>
      ))}
    </Animated.View>
  );
}

export function DroneLaunchProvider({ children }) {
  const [run, setRun] = useState(0);
  const launch = useCallback(() => setRun((current) => current + 1), []);
  const value = useMemo(() => ({ launch }), [launch]);
  const finish = useCallback(() => setRun(0), []);

  return (
    <DroneLaunchContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {run > 0 && <DroneLaunchOverlay key={run} onFinished={finish} />}
      </View>
    </DroneLaunchContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1500,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  glow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: colors.accent,
  },
});
