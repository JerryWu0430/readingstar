import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    SafeAreaView,
    TextInput,
    useColorScheme,
} from 'react-native';
import WebView from 'react-native-webview';
import { SvgXml } from 'react-native-svg';
import { parseString } from 'react-native-xml2js';
import he from 'he';

const menuSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" /></svg>`;
const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path fill="#FFD700" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
</svg>`;
const accountSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6,17C6,15 10,13.9 12,13.9C14,13.9 18,15 18,17V18H6M15,9A3,3 0 0,1 12,12A3,3 0 0,1 9,9A3,3 0 0,1 12,6A3,3 0 0,1 15,9M3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3H5C3.89,3 3,3.9 3,5Z" /></svg>`;
const microphoneSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" /></svg>`;

export default function App() {
    const [score, setScore] = useState(550);
    const [selectedSong, setSelectedSong] = useState('Twinkle, Twinkle...');
    const [difficulty, setDifficulty] = useState('Easy');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [embedUrl, setEmbedUrl] = useState('');
    const [lyrics, setLyrics] = useState([]);
    const [currentLyric, setCurrentLyric] = useState('');
    const [startTime, setStartTime] = useState(null);
    const colorScheme = useColorScheme();
    const timerRef = useRef(null);
    const offset = 3; // 3 second offset
    const [showStar, setShowStar] = useState(false); 


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
        'Song #4',
    ];

    interface YoutubeUrl {
        url: string;
    }

    useEffect(() => {
        const startTranscription = async () => {
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
    
        startTranscription();
    }, []); 

    const getYoutubeEmbedUrl = (url: string): void => {
        const videoId: string | undefined = url.split('v=')[1];
        const ampersandPosition: number = videoId ? videoId.indexOf('&') : -1;
        const finalVideoId: string | undefined = ampersandPosition !== -1 ? videoId.substring(0, ampersandPosition) : videoId;
        setEmbedUrl(`https://www.youtube.com/embed/${finalVideoId}?autoplay=1&controls=0`);
        fetchYoutubeSubtitles(url);
        setStartTime(Date.now());
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
                setTimeout(() => setShowStar(false), 3000);
            }
        } catch (error) {
            console.error("Error checking the match:", error);
        }
    };


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
                const subtitleResponse = await fetch(subtitleUrl);
                const subtitleText = await subtitleResponse.text();

                parseString(subtitleText, (err, result) => {
                    if (err) {
                        console.error('Error parsing XML:', err);
                        return;
                    }
                    const lyricsArray = result.transcript.text.map((item: any) => ({
                        lyric: he.decode(item._),
                        time: parseFloat(item.$.start),
                    }));
                    setLyrics(lyricsArray);
                });
            }
        } catch (error) {
            console.error('Error fetching subtitles:', error);
        }
    };

    const previousLyricRef = useRef(''); 
    
    useEffect(() => {
        if (startTime) {
            
            timerRef.current = setInterval(async () => {
                const elapsedTime = (Date.now() - startTime) / 1000 - offset;
    
                // Find the current lyric based on elapsed time
                const currentLyric = lyrics.reduce(
                    (prev, curr) => (curr.time <= elapsedTime ? curr : prev),
                    { lyric: '' }
                ).lyric;
    
                // Only update and call startMatching if the lyric has changed
                if (currentLyric !== previousLyricRef.current) {
                    previousLyricRef.current = currentLyric; // Update previous lyric
                    setCurrentLyric(currentLyric); // Update state
                    await startMatching(currentLyric); // Call startMatching
                }
    
                await checkMatch(); // Check for matches (runs regardless)
            }, 1000);
    
            return () => clearInterval(timerRef.current);
        }
    }, [startTime, lyrics, offset]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.titleBar}>
                <SvgXml xml={menuSvg} width={24} height={24} />
                <Text style={styles.titleText}>Reading Star</Text>
                <SvgXml xml={starSvg} width={20} height={20} />
                <View style={styles.titleBarRight}>
                    <Text style={styles.emailText}> jerry.wu.23@ucl.ac.uk</Text>
                    <SvgXml xml={accountSvg} width={24} height={24} />
                </View>
            </View>

            
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
                <View style={styles.sidebar}>
                    <Text style={styles.playlistTitle}>Playlist #1</Text>
                    <ScrollView>
                        {playlist.map((song, index) => (
                            <Pressable
                                key={index}
                                style={[
                                    styles.playlistItem,
                                    song === selectedSong && styles.playlistItemSelected,
                                ]}
                                onPress={() => setSelectedSong(song)}
                            >
                                <Text
                                    style={[
                                        styles.playlistItemText,
                                        song === selectedSong && styles.playlistItemTextSelected,
                                    ]}
                                >
                                    {song}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.mainContent}>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreText}>Score: {score}</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[
                                styles.textInput,
                                colorScheme === 'dark' && styles.textInputDark,
                            ]}
                            placeholder="Paste YouTube URL here"
                            placeholderTextColor={colorScheme === 'dark' ? '#ccc' : '#999'}
                            value={youtubeUrl}
                            onChangeText={setYoutubeUrl}
                        />

                        <Pressable
                            style={({ pressed }) => [
                                {
                                    backgroundColor: pressed ? '#005bb5' : '#0078d4',
                                },
                                styles.goButton,
                                pressed && { backgroundColor: '#005bb5' },
                            ]}
                            onPress={() => getYoutubeEmbedUrl(youtubeUrl)}
                        >
                            <Text style={styles.goButtonText}>Go</Text>
                        </Pressable>
                    </View>

                    <View style={styles.videoContainer}>
                        <WebView
                            style={styles.webview}
                            source={{ uri: embedUrl }}
                            javaScriptEnabled={true}
                        />
                        <View style={styles.overlay} />
                    </View>

                    <View style={styles.lyricsContainer}>
                        <Text style={styles.lyricsText}>{currentLyric}</Text>
                        <SvgXml xml={microphoneSvg} width={32} height={32} />
                    </View>
                </View>

                <View style={styles.rightPanel}>
                    <View style={styles.difficultyContainer}>
                        <Text style={styles.sectionTitle}>Difficulty</Text>
                        <Text style={[styles.difficultyOption, { color: '#22c55e' }]}>Easy</Text>
                        <Text style={[styles.difficultyOption, { color: '#f97316' }]}>Medium</Text>
                        <Text style={[styles.difficultyOption, { color: '#dc2626' }]}>Hard</Text>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            pressed && { backgroundColor: '#005bb5' },
                        ]}
                        onPress={() => {
                            //test audio button logic
                        }}
                    >
                        <Text style={styles.buttonText}>Test Audio</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            styles.submitButton,
                            pressed && { backgroundColor: '#005bb5' },
                        ]}
                        onPress={() => {
                            // submit button logic
                        }}
                    >
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
        color: '#333',
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
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#444',
    },
    playlistItem: {
        padding: 8,
        borderRadius: 4,
        marginBottom: 4,
    },
    playlistItemSelected: {
        backgroundColor: '#e8f4ff',
    },
    playlistItemText: {
        fontSize: 14,
        color: '#333',
    },
    playlistItemTextSelected: {
        color: '#333',
        fontWeight: 'bold',
    },
    mainContent: {
        flex: 1,
        padding: 16,
    },
    scoreContainer: {
        backgroundColor: '#e8f4ff',
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
    scoreText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#005bb5',
    },
    videoContainer: {
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 16,
        marginLeft: 24,
        position: 'relative',
    },
    webview: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
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
    },
    lyricsText: {
        fontSize: 24,
        color: '#005bb5',
    },
    rightPanel: {
        width: 200,
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
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#444',
    },
    difficultyOption: {
        fontSize: 14,
        marginVertical: 4,
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
});


