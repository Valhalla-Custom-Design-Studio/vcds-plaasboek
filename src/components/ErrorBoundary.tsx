import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <View style={styles.container}>
          <Text style={styles.title}>Iets het verkeerd gegaan</Text>
          <Text style={styles.msg}>{this.state.error?.message}</Text>
          <TouchableOpacity style={styles.btn} onPress={this.reset}>
            <Text style={styles.btnText}>Probeer weer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0A0A0F' },
  title: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  msg: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 },
  btn: { backgroundColor: '#2D6A4F', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  btnText: { color: '#FFFFFF', fontWeight: '600' },
});
