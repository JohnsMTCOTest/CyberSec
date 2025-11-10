import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  url?: string;
  token?: string;
};

const Terminal: React.FC<Props> = ({ url, token }) => {
  if (!url) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Start a lab to open the terminal.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.meta}>Token: {token?.substring(0, 8)}...</Text>
      <WebView source={{ uri: url }} style={styles.webview} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: 240, backgroundColor: '#000', marginBottom: 12 },
  webview: { flex: 1 },
  placeholder: {
    height: 240,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  placeholderText: { color: '#777' },
  meta: { color: '#ccc', fontSize: 10, padding: 4 }
});

export default Terminal;
