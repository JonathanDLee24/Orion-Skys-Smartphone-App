import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenLayout, { useScreenStyles } from '../components/ScreenLayout';
import { colors, useResponsiveLayout } from '../theme';

const CustomerSuccessfulScanScreen = ({ navigation, route }) => {
  const screenStyles = useScreenStyles();
  const layout = useResponsiveLayout();

  const templateCustomer = {
    initials: 'TV',
    name: 'TechVentures Guest',
    id: 'DSO-CLW-0012',
    role: 'Corporate Client',
    organization: 'TechVentures Inc.',
    accessLevel: 'VIP - ALL AREAS',
  };

  // Use the template customer as a placeholder for now
  const customer = templateCustomer;

  return (
    <ScreenLayout
      label="CUSTOMER CHECK-IN"
      title="Access Status"
      caption="VERIFICATION COMPLETE"
      backLabel="Close"
      onBack={() => navigation?.goBack?.()}
    >
      <View style={styles.resultSection}>
        <View style={styles.checkCircle}>
          <View style={styles.checkRing}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </View>
        <Text style={styles.grantedText}>ACCESS GRANTED</Text>
      </View>

      <View style={[screenStyles.card, styles.contentCard, styles.halfWidth]}>
        <View style={styles.personRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.initials}</Text>
          </View>
            <View style={styles.personDetails}>
              <Text numberOfLines={1} style={styles.personName}>
                {customer.name || 'TechVentures Guest'}
              </Text>
              <Text numberOfLines={1} style={styles.customerId}>
                ID: {customer.id || 'DSO-CLW-0012'}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Role</Text>
            <Text numberOfLines={1} style={styles.detailValue}>
              {customer.role || 'Corporate Client'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Organization</Text>
            <Text numberOfLines={1} style={styles.detailValue}>
              {customer.organization || 'TechVentures Inc.'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Access Level</Text>
            <Text numberOfLines={1} style={styles.detailValue}>
                {customer.accessLevel || 'VIP - ALL AREAS'}
            </Text>
          </View>
      </View>

      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.nextButton, styles.halfWidth, pressed && styles.nextButtonPressed]}
      >
        <Text style={styles.nextButtonText}>Scan Next Passenger</Text>
      </Pressable>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  resultSection: {
    alignItems: 'center',
    height: 177,
  },
  checkCircle: {
    alignItems: 'center',
    borderColor: colors.accent,
    borderRadius: 47,
    borderWidth: 2,
    height: 94,
    justifyContent: 'center',
    marginTop: 19,
    width: 94,
  },
  checkRing: {
    alignItems: 'center',
    borderColor: colors.accent,
    borderRadius: 31,
    borderWidth: 2,
    height: 62,
    justifyContent: 'center',
    position: 'relative',
    width: 62,
  },
  checkMark: {
    color: colors.accent,
    fontSize: 43,
    fontWeight: '300',
    marginLeft: 2,
    marginTop: -4,
  },
  grantedText: {
    color: colors.accent,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginTop: 10,
  },
  halfWidth: {
    alignSelf: 'center',
    width: '50%',
  },
  contentCard: {
    backgroundColor: '#111622',
    borderColor: '#1C2330',
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingBottom: 8,
    paddingTop: 17,
  },
  personRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatar: {
    alignItems: 'center',
    borderColor: colors.accent,
    borderRadius: 30,
    borderWidth: 2,
    height: 60,
    justifyContent: 'center',
    marginRight: 14,
    width: 60,
  },
  avatarText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    color: '#F7F8FA',
    fontSize: 20,
    fontWeight: '700',
  },
  customerId: {
    color: colors.accent,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    marginTop: 5,
  },
  cardDivider: {
    backgroundColor: '#222936',
    height: 1,
    marginTop: 14,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  detailLabel: {
    color: '#8792A7',
    fontSize: 16,
  },
  detailValue: {
    color: '#E9EDF5',
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    textAlign: 'right',
  },
  accessBadge: {
    borderColor: colors.accent,
    borderRadius: 5,
    borderWidth: 1,
    marginLeft: 12,
    maxWidth: '58%',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  accessBadgeText: {
    color: colors.accent,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
  nextButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 7,
    height: 52,
    justifyContent: 'center',
    marginTop: 16,
  },
  nextButtonPressed: {
    opacity: 0.82,
  },
  nextButtonText: {
    color: '#020306',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default CustomerSuccessfulScanScreen;
