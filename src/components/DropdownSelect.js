import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { useAccessibilityColors, useTapTargets } from './AccessibilityProvider';
import { colors } from '../theme';

export default function DropdownSelect({ label, value, options, onChange, testID }) {
  const [open, setOpen] = useState(false);
  const theme = useAccessibilityColors();
  const tapTargets = useTapTargets();
  const selected = options.find((option) => option.value === value) || options[0];

  function choose(optionValue) {
    onChange(optionValue);
    setOpen(false);
  }

  return (
    <View style={styles.wrap} testID={testID}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected ? selected.label : '' }}
        accessibilityState={{ expanded: open }}
        hitSlop={tapTargets.hitSlop}
        onPress={() => setOpen((previous) => !previous)}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: theme.field, borderColor: theme.border },
          open && styles.fieldOpen,
          tapTargets.style,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.value} numberOfLines={1}>{selected ? selected.label : ''}</Text>
        <Text style={styles.chevron}>{open ? '▴' : '▾'}</Text>
      </Pressable>
      {open && (
        <View style={[styles.panel, { backgroundColor: theme.field }]} testID={`${testID}-panel`}>
          <ScrollView style={styles.list} nestedScrollEnabled showsVerticalScrollIndicator>
            {options.map((option) => {
              const active = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: active }}
                  hitSlop={tapTargets.hitSlop}
                  onPress={() => choose(option.value)}
                  style={({ pressed }) => [
                    styles.option,
                    active && styles.optionActive,
                    tapTargets.style,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
                  {active && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 44, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.field },
  fieldOpen: { borderColor: colors.accent },
  value: { color: colors.text, fontSize: 13, flexShrink: 1 },
  chevron: { color: colors.accent, fontSize: 12 },
  panel: { marginTop: 6, borderWidth: 1, borderColor: colors.accent, borderRadius: 6, backgroundColor: colors.field, overflow: 'hidden' },
  list: { maxHeight: 180 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 44, paddingHorizontal: 12, paddingVertical: 8 },
  optionActive: { backgroundColor: colors.accentTint },
  optionText: { color: colors.text, fontSize: 13, flexShrink: 1 },
  optionTextActive: { color: colors.accent, fontWeight: '700' },
  check: { color: colors.accent, fontSize: 13 },
  pressed: { opacity: 0.7 },
});
