import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, monoFont, useResponsiveLayout } from '../theme';
import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  chunkIntoWeeks,
  formatAccessibleDate,
  formatMonthYear,
  isSameDay,
  toDateKey,
} from '../utils/bookingCalendar';

export default function CalendarPicker({ value, onChange, today = new Date() }) {
  const layout = useResponsiveLayout();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const weeks = chunkIntoWeeks(buildMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth(), today));

  function shiftMonth(offset) {
    setVisibleMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + offset, 1));
  }

  return (
    <View testID="booking-calendar" style={styles.wrapper}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          testID="calendar-prev"
          onPress={() => shiftMonth(-1)}
          style={({ pressed }) => [styles.caret, pressed && styles.pressed]}
        >
          <Text style={styles.caretText}>‹</Text>
        </Pressable>
        <Text testID="calendar-month-label" accessibilityRole="header" style={[styles.month, layout.wide && styles.wideMonth]}>
          {formatMonthYear(visibleMonth)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          testID="calendar-next"
          onPress={() => shiftMonth(1)}
          style={({ pressed }) => [styles.caret, pressed && styles.pressed]}
        >
          <Text style={styles.caretText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} numberOfLines={1} style={[styles.weekday, layout.wide && styles.wideWeekday]}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {weeks.map((week) => (
          <View key={toDateKey(week[0].date)} style={styles.week}>
            {week.map((cell) => {
              const selected = cell.inMonth && isSameDay(cell.date, value);
              const disabled = !cell.available;
              const stateText = selected ? ', selected' : cell.available ? ', available' : ', unavailable';
              return (
                <View key={toDateKey(cell.date)} style={styles.cellWrap}>
                  <Pressable
                    testID={`calendar-day-${toDateKey(cell.date)}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatAccessibleDate(cell.date)}${stateText}`}
                    accessibilityState={{ selected, disabled }}
                    aria-selected={selected}
                    disabled={disabled}
                    onPress={() => onChange(new Date(cell.date))}
                    style={({ pressed }) => [
                      styles.cell,
                      cell.inMonth && !disabled && styles.availableCell,
                      selected && styles.selectedCell,
                      pressed && !disabled && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.day,
                        layout.wide && styles.wideDay,
                        !cell.inMonth && styles.outsideDay,
                        disabled && cell.inMonth && styles.disabledDay,
                        selected && styles.selectedDay,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <Text testID="calendar-footnote" style={styles.footnote}>• Sample availability · not live inventory.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  caret: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  caretText: { color: colors.accent, fontFamily: monoFont, fontSize: 24, lineHeight: 28 },
  month: { flex: 1, minWidth: 0, color: colors.text, fontFamily: monoFont, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  wideMonth: { fontSize: 18 },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { flex: 1, color: colors.muted, fontFamily: monoFont, fontSize: 8, textAlign: 'center', letterSpacing: 0.3 },
  wideWeekday: { fontSize: 10 },
  grid: { width: '100%' },
  week: { flexDirection: 'row' },
  cellWrap: { flex: 1, minWidth: 0, padding: 2 },
  cell: { aspectRatio: 1, minHeight: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 4, borderWidth: 1, borderColor: 'transparent' },
  availableCell: { backgroundColor: colors.field, borderColor: colors.border },
  selectedCell: { backgroundColor: colors.accent, borderColor: colors.accent },
  day: { color: colors.muted, fontFamily: monoFont, fontSize: 11, fontWeight: '700' },
  wideDay: { fontSize: 13 },
  outsideDay: { color: colors.border },
  disabledDay: { color: colors.border },
  selectedDay: { color: colors.background },
  footnote: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 12 },
  pressed: { opacity: 0.7 },
});
