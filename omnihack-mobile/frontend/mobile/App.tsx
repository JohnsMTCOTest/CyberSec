import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Provider as PaperProvider, Button, TextInput, Card } from 'react-native-paper';
import axios from 'axios';
import Terminal from './src/components/Terminal';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000';

type Lab = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
};

export default function App() {
  const [userId, setUserId] = useState('mobile-demo');
  const [labList, setLabList] = useState<Lab[]>([]);
  const [session, setSession] = useState<any>(null);
  const [accepted, setAccepted] = useState(false);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [submission, setSubmission] = useState('');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`${API_BASE}/api/labs`).then((response) => {
      setLabList(response.data.labs);
    });
  }, []);

  const acknowledgeEthics = async () => {
    await axios.post(`${API_BASE}/api/ethics/ack`, { userId });
    setAccepted(true);
  };

  const startLab = async (lab: Lab) => {
    const res = await axios.post(`${API_BASE}/api/labs/${lab.id}/start`, { userId });
    setSession(res.data.session);
    setSelectedLab(lab);
    setResult(null);
  };

  const submitProof = async () => {
    if (!session) return;
    const res = await axios.post(`${API_BASE}/api/labs/${session.labId}/submit`, {
      sessionId: session.sessionId,
      submission
    });
    setResult(res.data.passed ? 'Passed!' : 'Failed');
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card style={styles.card}>
            <Card.Title title="OmniHack Mobile" subtitle="Ethics & Login" />
            <Card.Content>
              <TextInput label="User ID" value={userId} onChangeText={setUserId} style={styles.input} />
              <Button mode="contained" onPress={acknowledgeEthics} disabled={accepted}>
                {accepted ? 'Ethics Completed' : 'Complete Ethics Module'}
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Available Labs" />
            <Card.Content>
              {labList.map((lab) => (
                <TouchableOpacity key={lab.id} onPress={() => startLab(lab)} disabled={!accepted}>
                  <View style={styles.labItem}>
                    <Text style={styles.labTitle}>{lab.title}</Text>
                    <Text style={styles.labMeta}>{lab.difficulty}</Text>
                    <Text style={styles.labDescription}>{lab.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>

          {session && (
            <Card style={styles.card}>
              <Card.Title title={`Session ${session.sessionId}`} subtitle={selectedLab?.title} />
              <Card.Content>
                <Terminal url={session.tty?.url} token={session.tty?.token} />
                <View style={styles.helperBar}>
                  {['ls', 'cat flag.txt', 'whoami'].map((cmd) => (
                    <Button key={cmd} onPress={() => setSubmission(cmd)} style={styles.helperButton}>
                      {cmd}
                    </Button>
                  ))}
                </View>
                <TextInput
                  label="Submission"
                  value={submission}
                  onChangeText={setSubmission}
                  style={styles.input}
                />
                <Button mode="contained" onPress={submitProof}>
                  Submit Proof
                </Button>
                {result && <Text style={styles.result}>{result}</Text>}
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c' },
  scroll: { padding: 16 },
  card: { marginBottom: 16 },
  labItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  labTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  labMeta: { fontSize: 12, color: '#ccc' },
  labDescription: { fontSize: 12, color: '#bbb' },
  input: { marginVertical: 8 },
  helperBar: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
  helperButton: { margin: 4 },
  result: { marginTop: 8, fontWeight: 'bold', color: '#29bf12' }
});
