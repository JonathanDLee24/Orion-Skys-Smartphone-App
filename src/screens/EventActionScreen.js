import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { colors } from '../theme';

export default function EventActionScreen({ route, navigation }) {
  const s = useScreenStyles();
  const { title = 'Event action', description = '' } = route?.params || {};
  return (
    <ScreenLayout label="EVENT // SECONDARY MENU" caption="CLIENT OPERATIONS / EVENTS" title={title} onBack={() => navigation.goBack()} backLabel="BACK" showProgress={false}>
      <View style={s.card} testID="event-action-screen">
        <Text style={styles.title}>{title}</Text>
        <Text style={[s.body, styles.copy]}>{description}</Text>
        <PrimaryButton title="Back to event details" onPress={() => navigation.goBack()} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 10 },
  copy: { marginBottom: 20 },
});
