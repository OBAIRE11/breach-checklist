import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { yearsOf } from '../../lib/breaches';
import { useBreachData } from '../../lib/BreachData';
import { DATA_TYPES, orderTypes, stepsFor, typeSummary } from '../../lib/checklist';
import { ALERTS_URL, colors, fonts } from '../../theme';

type Which = number | 'all';

export default function CompanyScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { companies } = useBreachData();
  const company = companies.find(c => c.name === name);
  const insets = useSafeAreaInsets();

  const multiple = (company?.breaches.length ?? 0) > 1;
  // "Not sure / all of them" is the default for companies with several breaches.
  const [which, setWhich] = useState<Which>(multiple ? 'all' : 0);
  const [done, setDone] = useState<Set<number>>(new Set());

  const selected = company ? (which === 'all' ? company.breaches : [company.breaches[which]]) : [];
  const types = orderTypes(selected.flatMap(b => b.types));
  const steps = stepsFor(types);
  const complete = steps.length > 0 && done.size === steps.length;

  const scrollRef = useRef<ScrollView>(null);
  const cardY = useRef(0);
  const [cardAnim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(cardAnim, { toValue: complete ? 1 : 0, useNativeDriver: true, friction: 7 }).start();
    if (complete) setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(cardY.current - 120, 0), animated: true }), 150);
  }, [complete, cardAnim]);

  if (!company) {
    return (
      <View style={[styles.container, { paddingTop: 24 }]}>
        <Text style={styles.body}>We couldn’t find that company. It may have been renamed in the latest list.</Text>
      </View>
    );
  }

  const pick = (w: Which) => { setWhich(w); setDone(new Set()); };
  const toggle = (i: number) => setDone(prev => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    return next;
  });
  const note = selected.length === 1 && selected[0].note ? (multiple ? selected[0].year + ': ' : '') + selected[0].note : '';

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
      <View style={styles.headRow}>
        <Text style={styles.name} accessibilityRole="header">{company.name}</Text>
        <Text style={styles.years}>{yearsOf(company)}</Text>
      </View>

      {multiple && (
        <View style={styles.picker} accessibilityRole="radiogroup" accessibilityLabel="Which breach?">
          <Text style={styles.pickerLabel}>Which breach?</Text>
          {[...company.breaches.map((b, i) => [i, b.year + ' · ' + typeSummary(b.types)] as const), ['all', 'Not sure / all of them'] as const].map(([value, label]) => {
            const active = which === value;
            return (
              <Pressable key={String(value)} onPress={() => pick(value)} style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="radio" accessibilityState={{ checked: active }}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!!note && <Text style={styles.note}>{note}</Text>}

      <View style={styles.exposed}>
        <Text style={styles.exposedLabel}>Data exposed:</Text>
        {types.map(t => (
          <View key={t} style={[styles.tag, DATA_TYPES[t].severity === 'high' ? styles.tagHigh : styles.tagMid]}>
            <Text style={[styles.tagText, { color: DATA_TYPES[t].severity === 'high' ? colors.danger : colors.accent }]}>{DATA_TYPES[t].label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.progressMeta}>
        <Text style={styles.progressLabel}>your progress</Text>
        <Text style={styles.progressCount}>{done.size} of {steps.length} done</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${steps.length ? (done.size / steps.length) * 100 : 0}%` }]} />
      </View>

      {steps.map((s, i) => {
        const checked = done.has(i);
        return (
          <Pressable key={s.title} onPress={() => toggle(i)} style={styles.step}
            accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={s.title}>
            <View style={[styles.box, checked && styles.boxChecked]}>{checked && <Text style={styles.tick}>✓</Text>}</View>
            <View style={styles.stepBody}>
              <View style={styles.stepTitleRow}>
                <Text style={[styles.stepTitle, checked && styles.stepTitleDone]}>{s.title}</Text>
                <View style={[styles.priority, s.priority === 'now' ? styles.tagHigh : styles.tagMid]}>
                  <Text style={[styles.priorityText, { color: s.priority === 'now' ? colors.danger : colors.accent }]}>
                    {s.priority === 'now' ? 'do now' : 'do soon'}
                  </Text>
                </View>
              </View>
              <Text style={styles.stepDetail}>{s.detail}</Text>
            </View>
          </Pressable>
        );
      })}

      {complete ? (
        <Animated.View
          onLayout={e => { cardY.current = e.nativeEvent.layout.y; }}
          style={[styles.doneCard, { opacity: cardAnim, transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }]}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.badge}><Text style={styles.badgeTick}>✓</Text></View>
          <Text style={styles.doneTitle}>You’ve covered everything.</Text>
          <Text style={styles.doneBody}>
            All {steps.length} steps for {company.name} are done.{' '}
            {types.includes('ssn')
              ? 'Keep your credit freezes in place and stay alert for phishing over the next few months.'
              : 'Stay alert for phishing and unexpected account activity over the next few months.'}
          </Text>
          <Pressable onPress={() => Linking.openURL(ALERTS_URL)} style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}>
            <Text style={styles.buttonText}>Get alerts for new breaches</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.buttonOutline, pressed && { borderColor: colors.accent }]}>
            <Text style={styles.buttonOutlineText}>Check another breach</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <View style={styles.panic}>
          <Text style={styles.panicText}>
            Do these in order. The first one or two matter most — if you only have five minutes, that’s where to spend them.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 8 },
  body: { fontFamily: fonts.sans, fontSize: 15, color: colors.textSecondary },
  headRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 4 },
  name: { fontFamily: fonts.serif, fontSize: 24, color: colors.text, flexShrink: 1 },
  years: { fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted },
  picker: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 6 },
  pickerLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, width: '100%' },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.surface },
  chipText: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSecondary },
  chipTextActive: { color: colors.accent },
  note: { fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted, marginTop: 8 },
  exposed: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 24 },
  exposedLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary, marginRight: 2 },
  tag: { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  tagHigh: { backgroundColor: colors.dangerDim },
  tagMid: { backgroundColor: colors.accentDim },
  tagText: { fontFamily: fonts.mono, fontSize: 12 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },
  progressCount: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.surface2, overflow: 'hidden', marginBottom: 16 },
  fill: { height: '100%', backgroundColor: colors.accent },
  step: { flexDirection: 'row', gap: 14, paddingVertical: 16, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  box: { width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  boxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  tick: { color: colors.onAccent, fontSize: 14, fontWeight: '700', lineHeight: 16 },
  stepBody: { flex: 1 },
  stepTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 3 },
  stepTitle: { fontFamily: fonts.sansMedium, fontSize: 15.5, color: colors.text, flexShrink: 1 },
  stepTitleDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  priority: { borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1 },
  priorityText: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 0.3 },
  stepDetail: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
  panic: { marginTop: 28, padding: 14, backgroundColor: colors.surface, borderLeftWidth: 2, borderLeftColor: colors.accent, borderRadius: 6 },
  panicText: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
  doneCard: { marginTop: 28, padding: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accentDim, borderRadius: 8, alignItems: 'center' },
  badge: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  badgeTick: { color: colors.accent, fontSize: 28, fontWeight: '700' },
  doneTitle: { fontFamily: fonts.serif, fontSize: 21, color: colors.text, marginBottom: 6, textAlign: 'center' },
  doneBody: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: colors.textSecondary, textAlign: 'center', marginBottom: 18 },
  button: { alignSelf: 'stretch', backgroundColor: colors.accent, borderRadius: 6, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  buttonText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.onAccent },
  buttonOutline: { alignSelf: 'stretch', borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 6, paddingVertical: 12, alignItems: 'center' },
  buttonOutlineText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.text },
});
