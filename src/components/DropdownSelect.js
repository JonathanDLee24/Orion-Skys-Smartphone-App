import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function DropdownSelect({ label, value, options, onChange, testID }) {
  const [open, setOpen] = useState(false);
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
        onPress={() => setOpen((previous) => !previous)}
        style={({ pressed }) => [styles.field, open && styles.fieldOpen, pressed && styles.pressed]}
      >
        <Text style={styles.value} numberOfLines={1}>{selected ? selected.label : ''}</Text>
        <Text style={styles.chevron}>{open ? '▴' : '▾'}</Text>
      </Pressable>
      {open && (
        <View style={styles.panel} testID={`${testID}-panel`}>
          <ScrollView style={styles.list} nestedScrollEnabled showsVerticalScrollIndicator>
            {options.map((option) => {
              const active = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: active }}
                  onPress={() => choose(option.value)}
                  style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.pressed]}
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
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 44, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: '#0B151E' },
  fieldOpen: { borderColor: colors.cyan },
  value: { color: colors.text, fontSize: 13, flexShrink: 1 },
  chevron: { color: colors.cyan, fontSize: 12 },
  panel: { marginTop: 6, borderWidth: 1, borderColor: colors.cyan, borderRadius: 6, backgroundColor: '#0B151E', overflow: 'hidden' },
  list: { maxHeight: 180 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 44, paddingHorizontal: 12, paddingVertical: 8 },
  optionActive: { backgroundColor: colors.cyanTint },
  optionText: { color: colors.text, fontSize: 13, flexShrink: 1 },
  optionTextActive: { color: colors.cyan, fontWeight: '700' },
  check: { color: colors.cyan, fontSize: 13 },
  pressed: { opacity: 0.7 },
});
