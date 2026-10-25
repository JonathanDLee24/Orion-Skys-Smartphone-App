import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

// Shared line icons for the employee portal chrome (bottom navigation, cards).
export default function EmployeeIcon({ type, color, size = 22 }) {
  if (Platform.OS === 'web') {
    const stroke = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    const calendar = [
      React.createElement('rect', { key: 'body', x: 3, y: 4, width: 18, height: 18, rx: 2, ...stroke }),
      React.createElement('path', { key: 'rings', d: 'M16 2v4M8 2v4M3 10h18', ...stroke }),
    ];
    const shape = {
      home: [3, 14].flatMap((x) => [3, 14].map((y) => React.createElement('rect', { key: `${x}-${y}`, x, y, width: 7, height: 7, rx: 1, ...stroke }))),
      schedule: [...calendar, React.createElement('path', { key: 'plus', d: 'M12 13v6M9 16h6', ...stroke })],
      events: [...calendar, React.createElement('path', { key: 'dots', d: 'M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01', ...stroke })],
      calendar,
      account: [
        React.createElement('circle', { key: 'head', cx: 12, cy: 8, r: 4, ...stroke }),
        React.createElement('path', { key: 'body', d: 'M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1', ...stroke }),
      ],
      pin: [
        React.createElement('path', { key: 'pin', d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z', ...stroke }),
        React.createElement('circle', { key: 'dot', cx: 12, cy: 10, r: 3, ...stroke }),
      ],
      document: [
        React.createElement('path', { key: 'page', d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z', ...stroke }),
        React.createElement('path', { key: 'lines', d: 'M14 2v6h6M16 13H8M16 17H8M10 9H8', ...stroke }),
      ],
      chat: [React.createElement('path', { key: 'bubble', d: 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z', ...stroke })],
    };
    return React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true }, shape[type]);
  }
  if (type === 'home') return <View style={styles.gridIcon}>{[0, 1, 2, 3].map((cell) => <View key={cell} style={[styles.gridCell, { borderColor: color }]} />)}</View>;
  if (type === 'account') return <View style={styles.personIcon}><View style={[styles.personHead, { borderColor: color }]} /><View style={[styles.personBody, { borderColor: color }]} /></View>;
  if (type === 'pin') return <View style={[styles.pinIcon, { borderColor: color }]}><View style={[styles.pinDot, { borderColor: color }]} /></View>;
  if (type === 'document') return <View style={[styles.docIcon, { borderColor: color }]}>{[0, 1, 2].map((line) => <View key={line} style={[styles.docLine, { backgroundColor: color }]} />)}</View>;
  if (type === 'chat') return <View style={[styles.chatIcon, { borderColor: color }]} />;
  return (
    <View style={[styles.calendarIcon, { borderColor: color }]}>
      <View style={[styles.calendarBar, { backgroundColor: color }]} />
      {type === 'schedule' && <Text style={[styles.calendarGlyph, { color }]}>+</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  gridIcon: { width: 22, height: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gridCell: { width: 9, height: 9, borderWidth: 2, borderRadius: 2 },
  calendarIcon: { width: 20, height: 20, borderWidth: 2, borderRadius: 3, alignItems: 'center', justifyContent: 'center', paddingTop: 3 },
  calendarBar: { position: 'absolute', top: 4, left: 0, right: 0, height: 2 },
  calendarGlyph: { fontSize: 12, lineHeight: 13, fontWeight: '700' },
  personIcon: { width: 22, height: 22, alignItems: 'center' },
  personHead: { width: 9, height: 9, borderWidth: 2, borderRadius: 5 },
  personBody: { width: 18, height: 10, borderWidth: 2, borderBottomWidth: 0, borderTopLeftRadius: 9, borderTopRightRadius: 9, marginTop: 2 },
  pinIcon: { width: 16, height: 16, borderWidth: 2, borderRadius: 8, borderBottomRightRadius: 0, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  pinDot: { width: 5, height: 5, borderWidth: 1.5, borderRadius: 3 },
  docIcon: { width: 16, height: 20, borderWidth: 2, borderRadius: 2, paddingHorizontal: 2, paddingTop: 4, gap: 2 },
  docLine: { height: 1.5 },
  chatIcon: { width: 17, height: 17, borderWidth: 2, borderRadius: 9, borderBottomLeftRadius: 2 },
});
