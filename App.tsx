import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView from 'react-native-webview';

export default function App() {
  const [score, setScore] = useState(550);
  const [selectedSong, setSelectedSong] = useState('Twinkle, Twinkle...');
  const [difficulty, setDifficulty] = useState('Easy');

  const playlist = [
    'Humpty Dumpty',
    'The Hokey Pokey',
    'Looby Loo',
    'Twinkle, Twinkle...',
    'Apples and Bananas',
    'Hush Little Baby',
    'Song #1',
    'Song #2',
    'Song #3',
    'Song #4'
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Windows-style Title Bar */}
      <View style={styles.titleBar}>
        <Icon name="menu" size={24} color="#000" />
        <Text style={styles.titleText}>Reading Star</Text>
        <Icon name="star" size={20} color="#000" />
        <View style={styles.titleBarRight}>
          <Text>user.edu.uk</Text>
          <Icon name="account" size={24} color="#000" />
        </View>
      </View>

      <View style={styles.content}>
        {/* Playlist Sidebar (Windows-style) */}
        <View style={styles.sidebar}>
          <Text style={styles.playlistTitle}>Playlist #1</Text>
          <ScrollView>
            {playlist.map((song, index) => (
              <Pressable
                key={index}
                style={[
                  styles.playlistItem,
                  song === selectedSong && styles.playlistItemSelected
                ]}
                onPress={() => setSelectedSong(song)}
              >
                <Text
                  style={[
                    styles.playlistItemText,
                    song === selectedSong && styles.playlistItemTextSelected
                  ]}
                >
                  {song}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>Score: {score}</Text>
          </View>

          {/* Video Player */}
          <View style={styles.videoContainer}>
            <WebView
              style={styles.webview}
              source={{ uri: 'about:blank' }} // Replace with actual YouTube embed
              javaScriptEnabled={true}
            />
            {/* Media Controls */}
            <View style={styles.mediaControls}>
              <Icon name="play" size={24} color="#fff" />
              <Icon name="skip-forward" size={24} color="#fff" />
              <Icon name="volume-high" size={24} color="#fff" />
              <View style={styles.spacer} />
              <Text style={styles.ccButton}>CC</Text>
              <Icon name="fullscreen" size={24} color="#fff" />
            </View>
          </View>

          {/* Lyrics Display */}
          <View style={styles.lyricsContainer}>
            <Text style={styles.lyricsText}>Twinkle, twinkle, little star...</Text>
            <Icon name="microphone" size={32} color="#000" />
          </View>
        </View>

        {/* Right Panel */}
        <View style={styles.rightPanel}>
          <View style={styles.difficultyContainer}>
            <Text style={styles.sectionTitle}>Difficulty</Text>
            <Text style={[styles.difficultyOption, { color: '#22c55e' }]}>Easy</Text>
            <Text style={[styles.difficultyOption, { color: '#f97316' }]}>Medium</Text>
            <Text style={[styles.difficultyOption, { color: '#dc2626' }]}>Hard</Text>
          </View>

          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Test Audio</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.submitButton]}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Windows 10 background color
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e6e6e6', // Windows 10 title bar color
    borderBottomWidth: 1,
    borderBottomColor: '#d1d1d1',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    marginRight: 8,
  },
  titleBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 250,
    backgroundColor: '#fafafa', // Windows 10 sidebar color
    borderRightWidth: 1,
    borderRightColor: '#d1d1d1',
    padding: 16,
  },
  playlistTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  playlistItem: {
    padding: 8,
    borderRadius: 4,
  },
  playlistItemSelected: {
    backgroundColor: '#e1e1e1', // Windows 10 selected item color
  },
  playlistItemText: {
    fontSize: 14,
    color: '#000',
  },
  playlistItemTextSelected: {
    color: '#0078d4', // Windows 10 accent color
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  scoreContainer: {
    backgroundColor: '#e1f0ff', // Light blue background
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0078d4', // Windows 10 accent color
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  webview: {
    flex: 1,
  },
  mediaControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    gap: 16,
  },
  spacer: {
    flex: 1,
  },
  ccButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lyricsContainer: {
    alignItems: 'center',
    gap: 16,
  },
  lyricsText: {
    fontSize: 24,
    color: '#0078d4', // Windows 10 accent color
  },
  rightPanel: {
    width: 200,
    padding: 16,
    backgroundColor: '#fafafa', // Windows 10 sidebar color
    borderLeftWidth: 1,
    borderLeftColor: '#d1d1d1',
  },
  difficultyContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d1d1',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  difficultyOption: {
    fontSize: 14,
    marginVertical: 4,
  },
  button: {
    backgroundColor: '#e1e1e1', // Windows 10 button color
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  submitButton: {
    backgroundColor: '#0078d4', // Windows 10 accent color
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

