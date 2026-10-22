import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, monoFont, useResponsiveLayout } from '../theme';
import {
  MONTH_NAMES,
  MONTH_SHORT,
  WEEKDAY_LABELS,
  buildMonthGrid,
  chunkIntoWeeks,
  formatAccessibleDate,
  formatMonthYear,
  getEarliestBookableDate,
  isSameDay,
  toDateKey,
} from '../utils/bookingCalendar';

const FUTURE_YEAR_SPAN = 10;

function buildYearOptions(currentYear, visibleYear) {
  const years = Array.from({ length: FUTURE_YEAR_SPAN + 1 }, (_, index) => currentYear + index);
  if (!years.includes(visibleYear)) years.unshift(visibleYear);
  return years.sort((first, second) => first - second);
}

export default function CalendarPicker({ value = null, onChange, today = new Date(), unavailableDates = [] }) {
  const layout = useResponsiveLayout();
  const earliestBookable = getEarliestBookableDate(today);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    // Until a day is tapped nothing is highlighted, so open on the first month
    // that can actually be booked instead of an arbitrary date.
    const anchor = value || earliestBookable;
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => (value || earliestBookable).getFullYear());
  const weeks = chunkIntoWeeks(buildMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth(), today));
  const bookedDates = new Set(unavailableDates);
  const currentYear = today.getFullYear();
  const yearOptions = buildYearOptions(currentYear, visibleMonth.getFullYear());

  function shiftMonth(offset) {
    setVisibleMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + offset, 1));
  }

  function togglePicker() {
    setPickerYear(visibleMonth.getFullYear());
    setPickerOpen((previous) => !previous);
  }

  function chooseMonth(monthIndex) {
    setVisibleMonth(new Date(pickerYear, monthIndex, 1));
    setPickerOpen(false);
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Select month and year"
          testID="calendar-month-trigger"
          accessibilityState={{ expanded: pickerOpen }}
          onPress={togglePicker}
          style={({ pressed }) => [styles.monthTrigger, pressed && styles.pressed]}
        >
          <Text testID="calendar-month-label" accessibilityRole="header" style={[styles.month, layout.wide && styles.wideMonth]}>
            {formatMonthYear(visibleMonth)}
          </Text>
          <Text style={styles.triggerChevron}>{pickerOpen ? '▴' : '▾'}</Text>
        </Pressable>
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

      {pickerOpen && (
        <View testID="calendar-month-year-panel" style={styles.pickerPanel}>
          <Text style={styles.pickerLabel}>// JUMP TO MONTH & YEAR</Text>
          <View style={styles.yearRow}>
            {yearOptions.map((year) => {
              const active = year === pickerYear;
              const disabled = year < currentYear;
              return (
                <Pressable
                  key={year}
                  testID={`calendar-year-${year}`}
                  accessibilityRole="button"
                  accessibilityLabel={String(year)}
                  accessibilityState={{ selected: active, disabled }}
                  disabled={disabled}
                  onPress={() => setPickerYear(year)}
                  style={({ pressed }) => [
                    styles.yearChip,
                    active && styles.activeChip,
                    disabled && styles.disabledChip,
                    pressed && !disabled && styles.pressed,
                  ]}
                >
                  <Text style={[styles.yearText, active && styles.activeChipText, disabled && styles.disabledText]}>{year}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.monthGrid}>
            {MONTH_SHORT.map((label, index) => {
              const monthEnd = new Date(pickerYear, index + 1, 0);
              const disabled = monthEnd.getTime() < earliestBookable.getTime();
              const active = pickerYear === visibleMonth.getFullYear() && index === visibleMonth.getMonth();
              return (
                <Pressable
                  key={label}
                  testID={`calendar-month-${pickerYear}-${String(index + 1).padStart(2, '0')}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${MONTH_NAMES[index]} ${pickerYear}`}
                  accessibilityState={{ selected: active, disabled }}
                  disabled={disabled}
                  onPress={() => chooseMonth(index)}
                  style={({ pressed }) => [
                    styles.monthOption,
                    active && styles.activeChip,
                    disabled && styles.disabledChip,
                    pressed && !disabled && styles.pressed,
                  ]}
                >
                  <Text style={[styles.monthOptionText, active && styles.activeChipText, disabled && styles.disabledText]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View testID="calendar-legend" style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.legendAvailable]} />
          <Text style={styles.legendText}>AVAILABLE</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.legendSelected]} />
          <Text style={styles.legendText}>SELECTED</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.legendBooked]} />
          <Text style={[styles.legendText, styles.legendBookedText]}>BOOKED</Text>
        </View>
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
              const selected = cell.inMonth && Boolean(value) && isSameDay(cell.date, value);
              const booked = cell.inMonth && bookedDates.has(toDateKey(cell.date));
              const disabled = !cell.available || booked;
              const stateText = booked ? ', booked' : selected ? ', selected' : cell.available ? ', available' : ', unavailable';
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
                      booked && !selected && styles.bookedCell,
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
                        booked && !selected && styles.bookedDay,
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

      <Text testID="calendar-footnote" style={styles.footnote}>
        • One show per day. Red days are already booked. Bookings open 7 days ahead, including Sundays. Sample availability · not live inventory.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  caret: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  caretText: { color: colors.accent, fontFamily: monoFont, fontSize: 24, lineHeight: 28 },
  monthTrigger: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  month: { color: colors.text, fontFamily: monoFont, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  wideMonth: { fontSize: 18 },
  triggerChevron: { color: colors.accent, fontFamily: monoFont, fontSize: 12 },
  pickerPanel: { borderWidth: 1, borderColor: colors.accent, borderRadius: 6, backgroundColor: colors.field, padding: 10, marginBottom: 12 },
  pickerLabel: { color: colors.accent, fontFamily: monoFont, fontSize: 9, letterSpacing: 0.5, marginBottom: 8 },
  yearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  yearChip: { minWidth: 44, minHeight: 36, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  monthOption: { flexBasis: '22%', flexGrow: 1, minWidth: 0, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  monthOptionText: { color: colors.text, fontFamily: monoFont, fontSize: 10, fontWeight: '700' },
  activeChip: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  activeChipText: { color: colors.accent },
  disabledChip: { opacity: 0.35 },
  disabledText: { color: colors.muted },
  yearText: { color: colors.text, fontFamily: monoFont, fontSize: 11, fontWeight: '700' },
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
  bookedCell: { backgroundColor: colors.error, borderColor: colors.error },
  bookedDay: { color: colors.text },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2, borderWidth: 1 },
  legendAvailable: { backgroundColor: colors.field, borderColor: colors.border },
  legendSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  legendBooked: { backgroundColor: colors.error, borderColor: colors.error },
  legendText: { color: colors.muted, fontFamily: monoFont, fontSize: 9, letterSpacing: 0.4 },
  legendBookedText: { color: colors.error, fontWeight: '700' },
  selectedDay: { color: colors.background },
  footnote: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 12 },
  pressed: { opacity: 0.7 },
});
