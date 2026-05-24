import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Radius } from '../theme';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  data: DataPoint[];
  title?: string;
  unit?: string;
  formatValue?: (v: number) => string;
}

export function ChartWithTableToggle({ data, title, unit = '', formatValue }: Props) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const max = Math.max(...data.map(d => d.value), 1);
  const fmt = formatValue || ((v: number) => `${v}${unit}`);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.toggle}>
        {(['chart', 'table'] as const).map(v => (
          <TouchableOpacity key={v} style={[styles.toggleBtn, view === v && styles.activeToggle]} onPress={() => setView(v)}>
            <Text style={[styles.toggleText, view === v && styles.activeToggleText]}>
              {v === 'chart' ? '📊 Grafiek' : '📋 Tabel'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {view === 'chart' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chart}>
            {data.map((d, i) => (
              <View key={i} style={styles.barWrapper}>
                <Text style={styles.barValue}>{fmt(d.value)}</Text>
                <View style={[styles.bar, { height: Math.max((d.value / max) * 120, 4), backgroundColor: d.color || Colors.primary }]} />
                <Text style={styles.barLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.headerCell]}>Datum</Text>
            <Text style={[styles.tableCell, styles.headerCell, { textAlign: 'right' }]}>Waarde</Text>
          </View>
          {data.map((d, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
              <Text style={styles.tableCell}>{d.label}</Text>
              <Text style={[styles.tableCell, { textAlign: 'right', color: Colors.primaryLight }]}>{fmt(d.value)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  title: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  toggle: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 3, marginBottom: 16, alignSelf: 'flex-start' },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.sm },
  activeToggle: { backgroundColor: Colors.primary },
  toggleText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  activeToggleText: { color: '#fff' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingBottom: 8, minHeight: 160 },
  barWrapper: { alignItems: 'center', minWidth: 40 },
  barValue: { color: Colors.textMuted, fontSize: 10, marginBottom: 4 },
  bar: { width: 28, borderRadius: 4, minHeight: 4 },
  barLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 4, textAlign: 'center' },
  table: { borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.surfaceBorder },
  tableHeader: { flexDirection: 'row', backgroundColor: Colors.surfaceElevated, paddingVertical: 8, paddingHorizontal: 12 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12 },
  tableRowAlt: { backgroundColor: Colors.surface },
  tableCell: { flex: 1, color: Colors.textPrimary, fontSize: 13 },
  headerCell: { color: Colors.textSecondary, fontWeight: '700', fontSize: 12 },
});
