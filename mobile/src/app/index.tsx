import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Company, searchCompanies, yearsOf } from '../lib/breaches';
import { useBreachData } from '../lib/BreachData';
import { ALERTS_URL, colors, fonts } from '../theme';

const openCompany = (c: Company) => router.push({ pathname: '/company/[name]', params: { name: c.name } });

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { companies, source } = useBreachData();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const matches = useMemo(() => searchCompanies(companies, query), [companies, query]);
  const searching = query.trim().length > 0;

  const header = (
    <View>
      <View style={styles.brand}>
        <Image source={require('../../assets/mark.png')} style={styles.mark} accessibilityIgnoresInvertColors />
        <View style={styles.brandText}>
          <Text style={styles.title} accessibilityRole="header">I got breached.{'\n'}Now what?</Text>
          <Text style={styles.kicker}>breach response guide</Text>
        </View>
      </View>
      <Text style={styles.lead}>
        Tell us which company leaked your data. We’ll give you the exact steps to take, in order, starting with the one that matters most.
      </Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search a company, e.g. LinkedIn"
        placeholderTextColor={colors.textMuted}
        style={[styles.search, focused && styles.searchFocused]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        returnKeyType="search"
        onSubmitEditing={() => matches[0] && openCompany(matches[0].company)}
        accessibilityLabel="Search for a company"
      />
    </View>
  );

  return (
    <FlatList
      data={searching ? matches : []}
      keyExtractor={m => m.company.name}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}
      ListHeaderComponent={header}
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => openCompany(item.company)}
          style={({ pressed }) => [styles.result, index === 0 && styles.resultFirst, index === matches.length - 1 && styles.resultLast, pressed && styles.resultPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.resultName}>{item.company.name}</Text>
          <Text style={styles.resultYears}>{(item.alias ? item.alias + ' · ' : '') + yearsOf(item.company)}</Text>
        </Pressable>
      )}
      ListEmptyComponent={
        searching ? (
          <View style={styles.noMatch}>
            <Text style={styles.noMatchText}>No match in our list yet.</Text>
            <Text style={styles.link} onPress={() => Linking.openURL('https://haveibeenpwned.com')}>
              Check haveibeenpwned.com to see which breaches affect you
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.chips}>
              {companies.slice(0, 5).map(c => (
                <Pressable key={c.name} onPress={() => openCompany(c)} style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
                  <Text style={styles.chipText}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Get notified about new breaches</Text>
              <Text style={styles.cardBody}>
                We add new breaches as they’re disclosed. Sign up and we’ll email you when the list grows.
              </Text>
              <Pressable onPress={() => Linking.openURL(ALERTS_URL)} style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]} accessibilityRole="link">
                <Text style={styles.buttonText}>Sign up for alerts</Text>
              </Pressable>
            </View>
          </View>
        )
      }
      ListFooterComponent={
        <Text style={styles.footer}>
          {companies.length} companies ·{' '}
          {source === 'live' ? 'up to date' : source === 'offline' ? "offline, showing the list saved in the app" : 'checking for updates…'}
          {'\n'}Not affiliated with any company listed. Always verify breach notices through the company’s official site.
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 18 },
  mark: { width: 56, height: 67 },
  brandText: { flex: 1 },
  title: { fontFamily: fonts.serif, fontSize: 29, lineHeight: 34, color: colors.text, marginBottom: 6 },
  kicker: { fontFamily: fonts.monoMedium, fontSize: 13, color: colors.accent, letterSpacing: 0.3 },
  lead: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, color: colors.textSecondary, marginBottom: 24 },
  search: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  searchFocused: { borderColor: colors.accent },
  result: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
  },
  resultFirst: { borderTopWidth: 1, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  resultLast: { borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  resultPressed: { backgroundColor: colors.surface2 },
  resultName: { fontFamily: fonts.sans, fontSize: 15, color: colors.text, flexShrink: 1 },
  resultYears: { fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted },
  noMatch: { paddingVertical: 8, gap: 6 },
  noMatchText: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary },
  link: { fontFamily: fonts.sans, fontSize: 14, color: colors.accent },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 36 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6 },
  chipPressed: { borderColor: colors.borderStrong, backgroundColor: colors.surface },
  chipText: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 20 },
  cardTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.text, marginBottom: 6 },
  cardBody: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginBottom: 16 },
  button: { backgroundColor: colors.accent, borderRadius: 6, paddingVertical: 12, alignItems: 'center' },
  buttonText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.onAccent },
  footer: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: colors.textMuted, marginTop: 32 },
});
