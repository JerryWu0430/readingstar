import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Button,
    StyleSheet,
    SafeAreaView,
    TextInput,
    useColorScheme,
    Animated,
} from 'react-native';
import Slider from '@react-native-community/slider';
import WebView from 'react-native-webview';
import { SvgXml } from 'react-native-svg';
import { parseString } from 'react-native-xml2js';
import he from 'he';
import { AppState, AppStateStatus } from 'react-native';

const menuSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" /></svg>`;
const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path fill="#FFD700" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
</svg>`;
const accountSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6,17C6,15 10,13.9 12,13.9C14,13.9 18,15 18,17V18H6M15,9A3,3 0 0,1 12,12A3,3 0 0,1 9,9A3,3 0 0,1 12,6A3,3 0 0,1 15,9M3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3H5C3.89,3 3,3.9 3,5Z" /></svg>`;
const microphoneSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" /></svg>`;
const closeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d0021b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
const deleteSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d0021b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`
const fullscreenSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5,5H10V7H7V10H5V5M14,5H19V10H17V7H14V5M17,14H19V19H14V17H17V14M10,17V19H5V14H7V17H10Z" /></svg>`;
const focusSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" /></svg>`;
const settingsSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19.14,12.94c0.04,-0.3 0.06,-0.61 0.06,-0.94c0,-0.32 -0.02,-0.64 -0.07,-0.94l2.03,-1.58c0.18,-0.14 0.23,-0.41 0.12,-0.61l-1.92,-3.32c-0.12,-0.22 -0.39,-0.29 -0.61,-0.22l-2.39,0.96c-0.5,-0.38 -1.03,-0.7 -1.62,-0.94L14.4,2.81c-0.04,-0.24 -0.24,-0.41 -0.48,-0.41h-3.84c-0.24,0 -0.43,0.17 -0.47,0.41L9.25,5.35C8.66,5.59 8.12,5.92 7.63,6.29L5.24,5.33c-0.22,-0.08 -0.49,0 -0.61,0.22L2.62,8.87C2.52,9.08 2.57,9.34 2.75,9.48l2.03,1.58C4.84,11.36 4.8,11.69 4.8,12s0.02,0.64 0.07,0.94l-2.03,1.58c-0.18,0.14 -0.23,0.41 -0.12,0.61l1.92,3.32c0.12,0.22 0.39,0.29 0.61,0.22l2.39,-0.96c0.5,0.38 1.03,0.7 1.62,0.94l0.36,2.54c0.05,0.24 0.24,0.41 0.48,0.41h3.84c0.24,0 0.44,-0.17 0.47,-0.41l0.36,-2.54c0.59,-0.24 1.13,-0.56 1.62,-0.94l2.39,0.96c0.22,0.08 0.49,0 0.61,-0.22l1.92,-3.32c0.12,-0.22 0.07,-0.47 -0.12,-0.61L19.14,12.94zM12,15.6c-1.98,0 -3.6,-1.62 -3.6,-3.6s1.62,-3.6 3.6,-3.6s3.6,1.62 3.6,3.6S13.98,15.6 12,15.6z"/></svg>`;

export default function App() {
    const [score, setScore] = useState(0);
    const [finalScore, setFinalScore] = useState(-1);
    const [selectedSong, setSelectedSong] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [embedUrl, setEmbedUrl] = useState('');
    const [lyrics, setLyrics] = useState([]);
    const [currentLyric, setCurrentLyric] = useState('');
    const [inputUrl, setInputUrl] = useState('');
    const [currentTime, setCurrentTime] = useState(-1);
    const [songTitle, setSongTitle] = useState('');
    const [isFocusMode, setIsFocusMode] = useState(false);
    const colorScheme = useColorScheme();
    const [showStar, setShowStar] = useState(false);
    const [videoPlaying, setVideoPlaying] = useState(false);
    const [playlist, setPlaylist] = useState<{id: number, name: string, url: string}[]>([]); // Initial playlist [name, url]
    const [playlistName, setPlaylistName] = useState('Classic Nursery Rhymes');
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [allPlaylistNames, setAllPlaylistNames] = useState<string[]>([]);
    const [allPlaylistsGetter, setAllPlaylistsGetter] = useState<{ [key: string]: {id: number, name: string, url: string}[] }>({});
    const [playlistLoaded, setPlaylistLoaded] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    
    interface LyricsSettings {
        fontSize: number;
        fontColor: string;
        fontStyle: 'normal' | 'italic';
        fontWeight: 'normal' | 'bold';
        lineSpacing: number;
        fontFamily: string;
    }

    const [lyricsSettings, setLyricsSettings] = useState<LyricsSettings>({
        fontSize: 32,
        fontColor: '#005bb5',
        fontStyle: 'normal',
        fontWeight: 'normal',
        lineSpacing: 16,
        fontFamily: 'System',
    });
    
    const allPlaylists: { [key: string]: {id: number, name: string, url: string}[] } = {};

    interface YoutubeUrl {
        url: string;
    }

    const fetchPlaylists = () => {
        return new Promise<void>(async (resolve, reject) => {
            setPlaylistLoaded(false);
            try {
                const response = await fetch("http://localhost:8000/playlists", {
                    method: "GET",
                });
                const playlistData = await response.json();

                for (const playlist of playlistData.playlists) {
                    allPlaylists[playlist?.name] = playlist.songs;

                }
                setAllPlaylistNames(Object.keys(allPlaylists));
                playlistName ?? setPlaylistName(Object.keys(allPlaylists)[0]);
                setPlaylist(allPlaylists[playlistName]);
                setAllPlaylistsGetter(allPlaylists);
                console.log('Playlists loaded:', allPlaylists);
                resolve();
            } catch (error) {
                allPlaylists['Nursery Rhymes OG'] = [
                    {id: 0, name: 'Humpty Dumpty', url: 'https://www.youtube.com/watch?v=nrv495corBc'},
                    {id: 1, name: 'The Hokey Cokey', url: 'https://www.youtube.com/watch?v=YAMYsNe7DMQ'},
                    {id: 2, name: 'Looby Loo', url: 'https://www.youtube.com/watch?v=EHaoEKcuX0g'},
                    {id: 3, name: 'Twinkle, Twinkle...', url: 'https://www.youtube.com/watch?v=yCjJyiqpAuU'},
                    {id: 4, name: 'Apples and Bananas', url: 'https://www.youtube.com/watch?v=r5WLXZspD1M'},
                    {id: 5, name: 'Hush Little Baby', url: 'https://www.youtube.com/watch?v=f_raDpgx_3M'},
                ];
                reject(error);
            }
            setAllPlaylistNames(Object.keys(allPlaylists));
            setPlaylistLoaded(true);
        });
    };

    function findFromPlaylist(url: string) {
        return playlist.find((item) => item.url === url) ?? {};
    }

    const useMountEffect = (f: () => void) => useEffect(() => { f(); }, []);

    const 
    getYoutubeEmbedUrl = async (url: string): Promise<void> => {
        const videoId: string | undefined = url.split('v=')[1];
        const ampersandPosition: number = videoId ? videoId.indexOf('&') : -1;
        const finalVideoId: string | undefined = ampersandPosition !== -1 ? videoId.substring(0, ampersandPosition) : videoId;
        setEmbedUrl(`https://www.youtube.com/embed/${finalVideoId}?autoplay=1&controls=0&encrypted-media=1`);
        getSongTitle(url);
        setVideoPlaying(true);
        fetchYoutubeSubtitles(url);
        try {
            const response = await fetch('http://localhost:8000/close_microphone', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
        catch (error) {}
        
        try {
            const response = await fetch('http://localhost:8000/transcribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log('Transcription started');
        } catch (error) {
            console.error('Failed to start transcription:', error);
        }
    };

    const startMatching = async (lyric : string) => {
        try {
                await fetch('http://localhost:8000/update_lyric', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lyric }),
            });
        } catch (error) {
            console.error('Error starting phrase matching:', error);
        }
    };

    const checkMatch = async () => {
        try {
            // Call GET /match to check if the server matched the current lyric
            const response = await fetch("http://localhost:8000/match", {
                method: "GET",
            });
            const result = await response.json(); // Expecting "yes" or "no"

            if (result.match === "yes") {
                setShowStar(true);
                setScore(prevScore => prevScore + Math.round(result.similarity * 100));
                setTimeout(() => setShowStar(false), 3000);
            }
            
        } catch (error) {
            console.error("Error checking the match:", error);
        }
    };

    const updatePlaylistJson = async (playlist : {id: number, name: string, url: string}[]) => {
        try {
            console.log('Updating playlist:', playlistName, "with", playlist);
            await fetch('http://localhost:8000/update_playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({"name": playlistName, "songs": playlist, "action": "update"}),
            });
        } catch (error) {
            console.error('Error updating playlist:', error);
        }
    };

    const removePlaylistJson = async (name: string, song: string) => {
        try {
            console.log('Removing playlist:', name);
            await fetch('http://localhost:8000/update_playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({"name": name, "song": song, "action": "remove"}),
            });
            await fetchPlaylists();
        } catch (error) {
            console.error('Error removing playlist:', error);
        }
        if (playlistName === name) {
            switchPlaylist(Object.keys(allPlaylistsGetter)[0]);
        }
    };

    const createPlaylistJson = async (playlistName: string) => {
        try {
            console.log('Creating playlist:', playlistName);
            await fetch('http://localhost:8000/update_playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({"id": allPlaylistsGetter.length, "name": playlistName, "songs": [], "action": "create"}),
            });
            fetchPlaylists();
            setPlaylistName(playlistName);
            setPlaylist([]);
        } catch (error) {
            console.error('Error creating playlist:', error);
        }
    }

    const songInPlaylist = (song: string) => {
        return playlist.find((item) => item.name === song) ? true : false;
    }

    const getSongTitle = async (url : string) => {
        try {
            let title = findFromPlaylist(url).name ?? '';
            // if url not in playlist, fetch song title
            if (!title) {
                console.log('Fetching song title...');
                const response = await fetch(url);
                const html = await response.text();
                const titleIndex = html.indexOf('<title>');
                const titleEndIndex = html.indexOf('</title>');
                title = html.substring(titleIndex+7, titleEndIndex);
                if (title.includes('YouTube')) {
                    title = title.substring(0, title.indexOf(' - YouTube'));
                }
                const songItem = {id: playlist.length, name: title, url: url};
                setPlaylist([...playlist, songItem]);
                allPlaylists[playlistName] = [...playlist, songItem];
                setAllPlaylistsGetter(allPlaylists);
                updatePlaylistJson([...playlist, songItem]);
                fetchPlaylists();
            }

            setScore(0);
            console.log('Loading song:', title);
            setSongTitle(title);
            setSelectedSong(title);
        } catch (error) {
            console.error('Error fetching song title:', error);
        }
    };

    const playFromCurrentPlaylist = async (song: string) => {
        setSelectedSong(song);
        const songUrl = playlist.find((item) => item.name === song)?.url;
        if (songUrl) {
            setYoutubeUrl(songUrl);
            getYoutubeEmbedUrl(songUrl);
        }
    }

    useMountEffect(fetchPlaylists);

    const switchPlaylist = (playlistName: string) => {
        if (allPlaylistsGetter[playlistName]) {
            setPlaylistLoaded(false);
            setPlaylistName(playlistName);
            console.log('Switching playlist:', playlistName);
            setPlaylist(allPlaylistsGetter[playlistName]);
            setPlaylistLoaded(true);
        } else {
            console.log('Playlist not found:', playlistName);
        }
    }

    const switchDifficulty = (difficulty: string) => {
        setDifficulty(difficulty);
        console.log('Switching difficulty to:', difficulty);
    }

    const fetchYoutubeSubtitles = async (url: string) => {
        try {
            const response = await fetch(url);
            const html = await response.text();
            const timedTextIndex = html.indexOf('timedtext');
            if (timedTextIndex !== -1) {
                const startIndex = html.lastIndexOf('"', timedTextIndex) + 1;
                const endIndex = html.indexOf('"', timedTextIndex);
                let subtitleUrl = html.substring(startIndex, endIndex);
                subtitleUrl = subtitleUrl.replace(/\\u0026/g, '&');

                const langIndex = subtitleUrl.indexOf('&lang=');
                if (langIndex === -1) {
                    // No language parameter, add it
                    subtitleUrl += '&lang=en';
                } else {
                    // Check if not already English
                    const langStart = langIndex + 6;
                    const langEnd = subtitleUrl.indexOf('&', langStart);
                    const currentLang = langEnd === -1 
                        ? subtitleUrl.substring(langStart)
                        : subtitleUrl.substring(langStart, langEnd);
                        
                    if (currentLang !== 'en') {
                        const prefix = subtitleUrl.substring(0, langStart);
                        const suffix = langEnd === -1 
                            ? '' 
                            : subtitleUrl.substring(langEnd);
                        subtitleUrl = prefix + 'en' + suffix;
                    }
                }

                const subtitleResponse = await fetch(subtitleUrl);
                const subtitleText = await subtitleResponse.text();

                parseString(subtitleText, async (err, result) => {
                    if (err) {
                        console.error('Error parsing XML:', err);
                        return;
                    }
                    const lyricsArray = result.transcript.text.map((item: any) => ({
                        lyric: he.decode(item._),
                        time: parseFloat(item.$.start),
                    }));
                    setLyrics(lyricsArray);
                    try{
                        //call Post method full_lyrics to provide lyrics
                        await fetch('http://localhost:8000/full_lyric', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ lyric: lyricsArray}),
                        });
                    }
                    catch (error) {
                        console.error('Error setting lyrics:', error);
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching subtitles:', error);
        }
    };

    const previousLyricRef = useRef(''); 
    
    useEffect(() => {
        if (currentTime) {
            const elapsedTime = currentTime;

            // Find the current lyric based on elapsed time
            var currentLyric = lyrics.reduce(
                (prev, curr) => (curr.time <= elapsedTime ? curr : prev),
                { lyric: '' }
            ).lyric;


            // Only update and call startMatching if the lyric has changed
            if (currentLyric !== previousLyricRef.current) {
                console.log('Updating Lyric:', currentLyric);
                previousLyricRef.current = currentLyric; // Update previous lyric
                setCurrentLyric(currentLyric); // Update state
                startMatching(currentLyric); // Call startMatching
                checkMatch();
            }

        }
    }, [currentTime, lyrics]);


    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
          console.log("App state changed to:", nextAppState);
      
          if (nextAppState === "inactive") {
            try {
              fetch("http://localhost:8000/close_microphone", {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              });
            } catch (error) {
              console.error("Failed to stop microphone:", error);
            }
          }
        };
      
        // Subscribe to app state changes
        const subscription = AppState.addEventListener("change", handleAppStateChange);
      
        // Cleanup function to remove the event listener on unmount
        return () => {
          subscription.remove();
        };
    }, []);

    const removeBracketedText = (lyric: string) => {
        if (lyric.includes('[') && lyric.includes(']')) {
            return lyric.replace(/\[.*?\]/g, '');
        }
        if (lyric.includes('(') && lyric.includes(')')) {
            return lyric.replace(/\(.*?\)/g, '');
        }
        return lyric;
    }

    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (currentLyric) {
            const currentIndex = lyrics.findIndex(lyric => lyric.lyric === currentLyric);
            const nextLyric = lyrics[currentIndex + 1];
            const duration = nextLyric ? (nextLyric.time - lyrics[currentIndex].time) * 1000 : 2000;

            Animated.timing(animatedValue, {
                toValue: 1,
                duration: duration,
                useNativeDriver: false,
            }).start(() => {
                animatedValue.setValue(0);
            });
        }
    }, [currentLyric]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.titleBar}>
                <Text style={styles.titleText}>ReadingStar</Text>
                <SvgXml xml={starSvg} width={20} height={20} />
                <View style={styles.titleBarRight}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.iconButtonPressed,
                        ]}
                        onPress={() => setShowSettingsModal(true)}
                    >
                        <SvgXml xml={settingsSvg} width={24} height={24} />
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [
                            styles.focusButton,
                            pressed && styles.focusButtonPressed,
                            isFocusMode && styles.focusButtonActive
                        ]}
                        onPress={() => setIsFocusMode(!isFocusMode)}
                    >
                        <View style={styles.focusButtonContent}>
                            <SvgXml xml={fullscreenSvg} width={20} height={20} />
                            <Text style={[styles.focusButtonText, isFocusMode && styles.focusButtonTextActive]}>
                                Focus Mode
                            </Text>
                        </View>
                    </Pressable>
                </View>
            </View>

            {/* Settings Modal */}
            {showSettingsModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Settings</Text>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.closeButton,
                                    pressed && styles.closeButtonPressed,
                                ]}
                                onPress={() => setShowSettingsModal(false)}
                            >
                                <SvgXml xml={closeSvg} width={24} height={24} />
                            </Pressable>
                        </View>
                        <ScrollView style={styles.modalScroll}>
                            <View style={styles.settingsContainer}>
                                <View style={styles.settingBox}>
                                    <Text style={styles.settingLabel}>Font Size</Text>
                                    <View style={styles.customSliderContainer}>
                                        <Text style={styles.sliderValue}>{Math.round(lyricsSettings.fontSize)}px</Text>
                                        <View style={styles.customSlider}>
                                            <View style={styles.customSliderTrack} />
                                            <View 
                                                style={[
                                                    styles.customSliderFill,
                                                    {
                                                        width: `${((lyricsSettings.fontSize - 16) / (64 - 16)) * 100}%`
                                                    }
                                                ]} 
                                            />
                                            <View style={styles.customSliderButtonContainer}>
                                                <Pressable
                                                    style={styles.customSliderButton}
                                                    onPress={() => {
                                                        const newValue = Math.max(16, lyricsSettings.fontSize - 4);
                                                        setLyricsSettings(prev => ({
                                                            ...prev,
                                                            fontSize: newValue
                                                        }));
                                                    }}
                                                >
                                                    <Text style={styles.customSliderButtonText}>-</Text>
                                                </Pressable>
                                                <Pressable
                                                    style={styles.customSliderButton}
                                                    onPress={() => {
                                                        const newValue = Math.min(64, lyricsSettings.fontSize + 4);
                                                        setLyricsSettings(prev => ({
                                                            ...prev,
                                                            fontSize: newValue
                                                        }));
                                                    }}
                                                >
                                                    <Text style={styles.customSliderButtonText}>+</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.sliderLabels}>
                                        <Text style={styles.sliderMinMax}>16px</Text>
                                        <Text style={styles.sliderMinMax}>64px</Text>
                                    </View>
                                </View>

                                <View style={styles.settingBox}>
                                    <Text style={styles.settingLabel}>Line Spacing</Text>
                                    <View style={styles.customSliderContainer}>
                                        <Text style={styles.sliderValue}>{Math.round(lyricsSettings.lineSpacing)}px</Text>
                                        <View style={styles.customSlider}>
                                            <View style={styles.customSliderTrack} />
                                            <View 
                                                style={[
                                                    styles.customSliderFill,
                                                    {
                                                        width: `${((lyricsSettings.lineSpacing - 8) / (32 - 8)) * 100}%`
                                                    }
                                                ]} 
                                            />
                                            <View style={styles.customSliderButtonContainer}>
                                                <Pressable
                                                    style={styles.customSliderButton}
                                                    onPress={() => {
                                                        const newValue = Math.max(8, lyricsSettings.lineSpacing - 2);
                                                        setLyricsSettings(prev => ({
                                                            ...prev,
                                                            lineSpacing: newValue
                                                        }));
                                                    }}
                                                >
                                                    <Text style={styles.customSliderButtonText}>-</Text>
                                                </Pressable>
                                                <Pressable
                                                    style={styles.customSliderButton}
                                                    onPress={() => {
                                                        const newValue = Math.min(32, lyricsSettings.lineSpacing + 2);
                                                        setLyricsSettings(prev => ({
                                                            ...prev,
                                                            lineSpacing: newValue
                                                        }));
                                                    }}
                                                >
                                                    <Text style={styles.customSliderButtonText}>+</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.sliderLabels}>
                                        <Text style={styles.sliderMinMax}>8px</Text>
                                        <Text style={styles.sliderMinMax}>32px</Text>
                                    </View>
                                </View>

                                <View style={styles.settingBox}>
                                    <Text style={styles.settingLabel}>Font Style</Text>
                                    <View style={styles.fontStyleContainer}>
                                        {[
                                            { style: 'normal' as const, weight: 'normal' as const, label: 'Normal' },
                                            { style: 'italic' as const, weight: 'normal' as const, label: 'Italic' },
                                            { style: 'normal' as const, weight: 'bold' as const, label: 'Bold' },
                                            { style: 'italic' as const, weight: 'bold' as const, label: 'Bold Italic' }
                                        ].map(({ style, weight, label }) => (
                                            <Pressable
                                                key={label}
                                                style={({ pressed }) => [
                                                    styles.fontStyleButton,
                                                    lyricsSettings.fontStyle === style && lyricsSettings.fontWeight === weight && styles.fontStyleButtonActive,
                                                    pressed && styles.fontStyleButtonPressed,
                                                ]}
                                                onPress={() => setLyricsSettings({
                                                    ...lyricsSettings,
                                                    fontStyle: style,
                                                    fontWeight: weight
                                                })}
                                            >
                                                <Text style={[
                                                    styles.fontStyleText,
                                                    lyricsSettings.fontStyle === style && lyricsSettings.fontWeight === weight && styles.fontStyleTextActive,
                                                    { fontStyle: style, fontWeight: weight }
                                                ]}>
                                                    {label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.settingBox}>
                                    <Text style={styles.settingLabel}>Font Color</Text>
                                    <View style={styles.colorPickerContainer}>
                                        {[
                                            '#000000', // Black
                                            '#FF0000', // Red
                                            '#FF4500', // Orange Red
                                            '#FFA500', // Orange
                                            '#FFD700', // Gold/Yellow
                                            '#32CD32', // Lime Green
                                            '#00FF00', // Green
                                            '#00FFFF', // Cyan
                                            '#0000FF', // Blue
                                            '#4B0082', // Indigo
                                            '#800080'  // Purple
                                        ].map((color) => (
                                            <Pressable
                                                key={color}
                                                style={({ pressed }) => [
                                                    styles.colorButton,
                                                    { backgroundColor: color },
                                                    lyricsSettings.fontColor === color && styles.colorButtonActive,
                                                    pressed && styles.colorButtonPressed,
                                                ]}
                                                onPress={() => setLyricsSettings({...lyricsSettings, fontColor: color})}
                                            />
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.settingBox}>
                                    <Text style={styles.settingLabel}>Font Family</Text>
                                    <View style={styles.fontFamilyContainer}>
                                        {[
                                            { name: 'System', label: 'System Default' },
                                            { name: 'Arial', label: 'Arial' },
                                            { name: 'Helvetica', label: 'Helvetica' },
                                            { name: 'Verdana', label: 'Verdana' },
                                            { name: 'Times New Roman', label: 'Times New Roman' },
                                            { name: 'Georgia', label: 'Georgia' },
                                            { name: 'Courier New', label: 'Courier New' },
                                            { name: 'Trebuchet MS', label: 'Trebuchet MS' }
                                        ].map(({ name, label }) => (
                                            <Pressable
                                                key={name}
                                                style={({ pressed }) => [
                                                    styles.fontFamilyButton,
                                                    lyricsSettings.fontFamily === name && styles.fontFamilyButtonActive,
                                                    pressed && styles.fontFamilyButtonPressed,
                                                ]}
                                                onPress={() => setLyricsSettings({...lyricsSettings, fontFamily: name})}
                                            >
                                                <Text style={[
                                                    styles.fontFamilyText,
                                                    { fontFamily: name },
                                                    lyricsSettings.fontFamily === name && styles.fontFamilyTextActive
                                                ]}>
                                                    {label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            )}

            <View style={[styles.starContainer, {marginTop: 280, marginLeft: 300}]}>
                {showStar && ( // Conditionally render the star
                        <SvgXml
                        xml={starSvg.replace('fill="#000000"', 'fill="#FFD700"')} // Sets the fill color to yellow
                        width={100}
                        height={100}
                        style={styles.star}
                    />
                )}
            </View>

            <View style={styles.content}>
                {!isFocusMode && (
                    <View style={styles.sidebar}>
                        <Text style={styles.playlistTitle}>{playlistName}</Text>
                        <ScrollView>
                            {playlistLoaded && playlist ? (
                                playlist.map((song, index) => (
                                    <Pressable
                                        key={index}
                                        style={[
                                            styles.playlistItem,
                                            song.name === selectedSong && styles.playlistItemSelected,
                                        ]}
                                        onPress={() => playFromCurrentPlaylist(song.name)}
                                    >
                                        <Text
                                            style={[
                                                styles.playlistItemText,
                                                song.name === selectedSong && styles.playlistItemTextSelected,
                                            ]}
                                        >
                                            {song.name}
                                        </Text>
                                        <SvgXml xml={deleteSvg} width={20} height={20} style={styles.iconTag} onPress={() => {removePlaylistJson(playlistName, song.name)}}/>
                                    </Pressable>
                                ))
                            ) : (
                                <Text>Loading...</Text>
                            )}
                        </ScrollView>
                    </View>
                )}

                <View style={[styles.mainContent, isFocusMode && styles.mainContentFocus]}>
                    <View style={[styles.scoreContainer, isFocusMode && styles.scoreContainerFocus]}>
                        <Text style={styles.scoreText}>Score: {score}</Text>
                    </View>

                    {!isFocusMode && (
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    colorScheme === 'dark' && styles.textInputDark,
                                ]}
                                placeholder="Paste YouTube URL here"
                                placeholderTextColor={colorScheme === 'dark' ? '#ccc' : '#999'}
                                value={inputUrl}
                                onChangeText={setInputUrl}
                            />

                            <Pressable
                                style={({ pressed }) => [
                                    {
                                        backgroundColor: pressed ? '#005bb5' : '#0078d4',
                                    },
                                    styles.goButton,
                                    pressed && { backgroundColor: '#005bb5' },
                                ]}
                                onPress={() => {
                                    setYoutubeUrl(inputUrl);
                                    getYoutubeEmbedUrl(inputUrl);
                                }}
                            >
                                <Text style={styles.goButtonText}>Go</Text>
                            </Pressable>
                        </View>
                    )}

                    <View style={[styles.videoContainer, isFocusMode && styles.videoContainerFocus]}>
                        {youtubeUrl ? (
                            videoPlaying ?
                            (<WebView
                                style={styles.webview}
                                source={{
                                    html: `
                <!DOCTYPE html>
                <html>
                  <body style="margin:0;">
                    <div id="player" style="position:absolute;top:0;left:0;width:100%;height:100%;"></div>
                    <script>
                      var tag = document.createElement('script');
                      tag.src = "https://www.youtube.com/iframe_api";
                      var firstScriptTag = document.getElementsByTagName('script')[0];
                      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                      var player;
                      function onYouTubeIframeAPIReady() {
                        player = new YT.Player('player', {
                          height: '100%',
                          width: '100%',
                          videoId: '${youtubeUrl.split('v=')[1]}',
                          useLocalHtml: false,
                          playerVars: {
                            'playsinline': 1
                          },
                          events: {
                            'onReady': onPlayerReady,
                            'onStateChange': onPlayerStateChange
                          }
                        });
                      }

                      function onPlayerReady(event) {
                        event.target.playVideo();
                        setInterval(() => {
                            window.ReactNativeWebView.postMessage(JSON.stringify(player.getCurrentTime()));
                        }, 300);
                        window.ReactNativeWebView.postMessage(JSON.stringify(player.getDuration(), 'duration'));
                      }

                      function onPlayerStateChange(event) {
                        if (event.data == YT.PlayerState.PLAYING) {
                          // Handle player state change
                        } else if (event.data == YT.PlayerState.PAUSED) {
                          window.ReactNativeWebView.postMessage(JSON.stringify('video_pause'));
                        } else if (event.data == YT.PlayerState.ENDED) {
                          window.ReactNativeWebView.postMessage(JSON.stringify('video_end'));
                        } else {
                          // Handle other states
                          window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
                        }
                      }
                    </script>
                  </body>
                </html>
            `,
                                }}
                                javaScriptEnabled={true}
                                onMessage={async (event) => {
                                    const cTime = JSON.parse(event.nativeEvent.data);
                                    if (cTime === 'video_end') {
                                        console.log('Video ended');
                                        setVideoPlaying(false);
                                        try {
                                            await fetch('http://localhost:8000/close_microphone', {
                                                method: 'GET',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                            });
                                            console.log('Microphone stopped');
                                        } catch (error) {
                                            console.error('Failed to stop microphone:', error);
                                        }
                                        await new Promise(resolve => setTimeout(resolve, 1000));
                                        try {
                                            const response = await fetch('http://localhost:8000/final_score', {
                                                method: 'GET',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                            });
                                        
                                            if (!response.ok) {
                                                throw new Error('Failed to fetch final score');
                                            }
                                        
                                            const data = await response.json();
                                            setFinalScore(data.final_score);
                                        
                                            console.log("Final Score:", data.final_score);
                                        } catch (error) {
                                            console.error("Error fetching final score:", error);
                                        }
                                    } else {
                                        setCurrentTime(cTime);
                                    }
                                }}
                            />) : 
                            (<View style={styles.overlay}>
                                <Text style={{ fontSize: 20, textAlign: 'center' }}>
                                    Well done for completing the song "{songTitle}"!
                                </Text>
                                {score > 0 ? (
                                    <Text style={{ fontSize: 20, textAlign: 'center' }}>
                                        You won {score} points!
                                    </Text>
                                ) : null}
                                {finalScore > 0 ? (
                                    <Text style={{ fontSize: 20, textAlign: 'center' }}>
                                        You were {Math.round(finalScore * 100)}% accurate!
                                    </Text>
                                ) : null}
                            </View>
                            )
                        ) : (
                            <View style={styles.overlay}>
                                <Text style={{ fontSize: 20, textAlign: 'center' }}>
                                    Click the sidebar or enter a YouTube link to start!
                                </Text>
                            </View>
                        )}
                        <View style={styles.overlay} />
                    </View>

                    <View style={[styles.lyricsContainer, isFocusMode && styles.lyricsContainerFocus]}>
                        <Text style={[
                            styles.lyricsText,
                            {
                                fontSize: lyricsSettings.fontSize,
                                color: lyricsSettings.fontColor,
                                fontStyle: lyricsSettings.fontStyle,
                                fontWeight: lyricsSettings.fontWeight,
                                lineHeight: lyricsSettings.lineSpacing + lyricsSettings.fontSize,
                                fontFamily: lyricsSettings.fontFamily,
                            }
                        ]}>{removeBracketedText(currentLyric)}</Text>
                        <View style={styles.slidingBarContainer}>
                            <Animated.View
                                style={[
                                    styles.slidingBar,
                                    {
                                        width: animatedValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                    },
                                ]}
                            />
                        </View>
                    </View>
                </View>
                {!isFocusMode && (
                    <ScrollView style={styles.rightPanel}>
                        <View style={styles.difficultyContainer}>
                            <Text style={styles.sectionTitle}>Playlists</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[
                                        styles.textInput,
                                        colorScheme === 'dark' && styles.textInputDark,
                                    ]}
                                    value={newPlaylistName}
                                    onChangeText={setNewPlaylistName}
                                    placeholder="Create playlist:"
                                    placeholderTextColor={colorScheme === 'dark' ? '#ccc' : '#999'}
                                />

                                <Pressable
                                    style={({ pressed }) => [
                                        {
                                            backgroundColor: pressed ? '#005bb5' : '#0078d4',
                                        },
                                        styles.goButton,
                                        pressed && { backgroundColor: '#005bb5' },
                                    ]}
                                    onPress={() => {
                                        createPlaylistJson(newPlaylistName);
                                        setNewPlaylistName('');
                                    }}
                                >
                                    <Text style={styles.goButtonText}>Ok</Text>
                                </Pressable>
                            </View>
                            <ScrollView style={{ height: 200}}>
                                {allPlaylistNames.map(name => (
                                    <View style={styles.blockIcon}>
                                        <Pressable
                                            key={name}
                                            style={({ pressed }) => [
                                                styles.button,
                                                styles.submitButton,
                                                (pressed || name == playlistName) && { backgroundColor: '#00b533' },
                                            ]}
                                            onPress={() => switchPlaylist(name)}>
                                            
                                            <Text style={[styles.buttonText]}>
                                                {name}
                                            </Text>
                                            <SvgXml xml={deleteSvg} width={20} height={20} style={styles.iconTag} onPress={() => {removePlaylistJson(name, '')}}/>
                                        </Pressable>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                        <View style={styles.difficultyContainer}>
                            <Text style={styles.sectionTitle}>AI Difficulty</Text>
                            <ScrollView horizontal>
                                {[
                                    { label: 'Easy', color: '#22c55e' },
                                    { label: 'Medium', color: '#f97316' },
                                    { label: 'Hard', color: '#dc2626' }
                                ].map(({ label, color }) => (
                                    <Pressable
                                        key={label}
                                        style={({ pressed }) => [
                                            styles.difficultyOption,
                                            difficulty === label && { backgroundColor: color, borderColor: color },
                                            pressed && { backgroundColor: '#e5e5e5' },
                                        ]}
                                        onPress={() => {
                                            setDifficulty(label);
                                            switchDifficulty(label);
                                            try{
                                                fetch('http://localhost:8000/change_threshold', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                    },
                                                    body: JSON.stringify({ level: label }),
                                                });
                                            }
                                            catch (error) {
                                                console.error('Error changing difficulty:', error);
                                            }
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.difficultyText,
                                                difficulty== label ? { color: '#fff' } : { color },
                                            ]}
                                        >
                                            {label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    titleBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#e0e0e0', // Bright background for header
        borderBottomWidth: 1,
        borderBottomColor: '#c0c0c0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        elevation: 2,
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
        marginRight: 8,
        color: '#333',
    },
    emailText: {
        fontSize: 13,
        marginLeft: 12,
        marginRight: 8,
        color: '#333',
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
        backgroundColor: '#ffffff',
        borderRightWidth: 1,
        borderRightColor: '#dcdcdc',
        padding: 16,
    },
    playlistTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#444',
    },
    playlistItem: {
        backgroundColor: '#e8f4ff',
        fontSize: 16,
        padding: 8,
        borderRadius: 4,
        marginBottom: 4,
    },
    playlistItemSelected: {
        backgroundColor: '#00008B',
    },
    playlistItemText: {
        fontSize: 14,
        color: '#333',
    },
    playlistItemTextSelected: {
        color: '#FAF9F6',
        fontWeight: 'bold',
    },
    mainContent: {
        flex: 1,
        padding: 16,
        minWidth: 500,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    scoreContainer: {
        backgroundColor: '#005bb5',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dcdcdc',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        elevation: 3,
    },
    scoreContainerFocus: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        marginBottom: 0,
        padding: 8,
    },
    scoreText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FAF9F6',
    },
    videoContainer: {
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        maxWidth: 800,
        maxHeight: 450,
        alignSelf: 'center',
        flex: 0,
        marginVertical: 8,
    },
    videoContainerFocus: {
        maxWidth: 1400,
        maxHeight: 600,
        marginTop: 15,
        marginBottom: 2,
        borderRadius: 0,
    },
    webview: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        justifyContent: 'center',
    },
    mediaControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        gap: 16,
    },
    spacer: {
        flex: 1,
    },
    lyricsContainer: {
        alignItems: 'center',
        gap: 16,
        marginTop: 16,
        paddingHorizontal: 16,
    },
    lyricsContainerFocus: {
        marginTop: 16,
        paddingHorizontal: 32,
    },
    lyricsText: {
        fontSize: 32,
        color: '#005bb5',
    },
    rightPanel: {
        maxWidth: 250,
        padding: 16,
        backgroundColor: '#ffffff',
        borderLeftWidth: 1,
        borderLeftColor: '#dcdcdc',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        elevation: 3,
    },
    difficultyContainer: {
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dcdcdc',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#444',
    },
    difficultyOption: {
        paddingVertical: 8,
        paddingHorizontal: 6,
        marginVertical: 4,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    difficultyText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#0078d4',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 8,

        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        elevation: 2,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
        textAlign: 'center'
    },
    submitButton: {
        backgroundColor: '#0078d4',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    textInput: {
        flex: 1,
        height: 40,
        borderColor: '#d1d1d1',
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 8,
        marginRight: 8,
        textAlignVertical: 'center',

    },
    goButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 4,
        backgroundColor: '#0078d4',
    },
    goButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    textInputDark: {
        backgroundColor: '#fff',
        color: '#444',
    },
    starContainer: {
        position: 'absolute', // Position the star overlay
        top: '50%',
        left: '50%',
        transform: [{ translateX: -50 }, { translateY: -50 }], // Center the star
        zIndex: 10, // Ensure it's above other components
    },
    star: {
        opacity: 1, // Optional styling for animation
    },
    slidingBarContainer: {
        width: '100%',
        maxWidth: 500,
        height: 5,
        backgroundColor: 'transparent',
        overflow: 'hidden',
        alignItems: 'center',
    },
    slidingBar: {
        height: 5,
        backgroundColor: '#FFD700',
        alignSelf: 'flex-start',
    },
    blockIcon: {
        position: 'relative',
        display: 'flex',
    },
    iconTag: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 1,
        width: 12,
        height: 12,
    },
    focusButton: {
        marginLeft: 'auto',
        padding: 8,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
    },
    focusButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    focusButtonPressed: {
        backgroundColor: '#e0e0e0',
    },
    focusButtonActive: {
        backgroundColor: '#0078d4',
    },
    focusButtonText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    focusButtonTextActive: {
        color: '#fff',
    },
    mainContentFocus: {
        marginLeft: 0,
        marginRight: 0,
        padding: 0,
        justifyContent: 'flex-start',
    },
    settingsContainer: {
        padding: 8,
    },
    settingBox: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#dcdcdc',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        elevation: 2,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    customSliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        width: '100%',
    },
    customSlider: {
        flex: 1,
        height: 40,
        marginHorizontal: 8,
        position: 'relative',
        justifyContent: 'center',
    },
    customSliderTrack: {
        position: 'absolute',
        left: 16,
        right: 16,
        height: 4,
        backgroundColor: '#d1d1d1',
        borderRadius: 2,
    },
    customSliderFill: {
        position: 'absolute',
        left: 16,
        height: 4,
        backgroundColor: '#0078d4',
        borderRadius: 2,
    },
    customSliderButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    customSliderButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0078d4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    customSliderButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 24,
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
        marginTop: -2, // Adjust for visual centering
    },
    sliderValue: {
        width: 50,
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    sliderMinMax: {
        fontSize: 12,
        color: '#999',
    },
    fontStyleContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    fontStyleButton: {
        flex: 1,
        minWidth: '45%',
        padding: 12,
        borderRadius: 6,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dcdcdc',
    },
    fontStyleButtonActive: {
        backgroundColor: '#0078d4',
        borderColor: '#0078d4',
    },
    fontStyleButtonPressed: {
        backgroundColor: '#e0e0e0',
    },
    fontStyleText: {
        fontSize: 14,
        color: '#666',
    },
    fontStyleTextActive: {
        color: '#fff',
    },
    colorPickerContainer: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    colorButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        elevation: 2,
    },
    colorButtonActive: {
        borderColor: '#0078d4',
        transform: [{ scale: 1.1 }],
    },
    colorButtonPressed: {
        opacity: 0.7,
    },
    iconButton: {
        padding: 8,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
    },
    iconButtonPressed: {
        backgroundColor: '#e0e0e0',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 8,
        width: '80%',
        maxWidth: 500,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#dcdcdc',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 4,
        borderRadius: 4,
    },
    closeButtonPressed: {
        backgroundColor: '#f0f0f0',
    },
    modalScroll: {
        maxHeight: '80%',
    },
    fontFamilyContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingVertical: 4,
    },
    fontFamilyButton: {
        flex: 1,
        minWidth: '45%',
        padding: 12,
        borderRadius: 6,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dcdcdc',
        marginBottom: 8,
    },
    fontFamilyButtonActive: {
        backgroundColor: '#0078d4',
        borderColor: '#0078d4',
    },
    fontFamilyButtonPressed: {
        backgroundColor: '#e0e0e0',
    },
    fontFamilyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    fontFamilyTextActive: {
        color: '#fff',
    },
});


