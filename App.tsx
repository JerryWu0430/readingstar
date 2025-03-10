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
    Animated,
} from 'react-native';
import WebView from 'react-native-webview';
import { SvgXml } from 'react-native-svg';
import { parseString } from 'react-native-xml2js';
import he from 'he';
import { AppState, AppStateStatus } from "react-native";

const menuSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" /></svg>`;
const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path fill="#FFD700" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
</svg>`;
const accountSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6,17C6,15 10,13.9 12,13.9C14,13.9 18,15 18,17V18H6M15,9A3,3 0 0,1 12,12A3,3 0 0,1 9,9A3,3 0 0,1 12,6A3,3 0 0,1 15,9M3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3H5C3.89,3 3,3.9 3,5Z" /></svg>`;
const microphoneSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" /></svg>`;

export default function App() {
    const [score, setScore] = useState(0);
    const [finalScore, setFinalScore] = useState(0);
    const [selectedSong, setSelectedSong] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [embedUrl, setEmbedUrl] = useState('');
    const [lyrics, setLyrics] = useState([]);
    const [currentLyric, setCurrentLyric] = useState('');
    const [inputUrl, setInputUrl] = useState('');
    const [currentTime, setCurrentTime] = useState(-1);
    const [songTitle, setSongTitle] = useState('');
    const colorScheme = useColorScheme();
    const timerRef = useRef(null);
    const [showStar, setShowStar] = useState(false);
    const [videoPlaying, setVideoPlaying] = useState(false);
    const [playlist, setPlaylist] = useState<{id: number, name: string, url: string}[]>([]); // Initial playlist [name, url]
    const [playlistName, setPlaylistName] = useState('Classic Nursery Rhymes');
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [createdPlaylist, setCreatedPlaylist] = useState('');
    const [allPlaylistNames, setAllPlaylistNames] = useState<string[]>([]);
    const [allPlaylistsGetter, setAllPlaylistsGetter] = useState<{ [key: string]: {id: number, name: string, url: string}[] }>({});
    const [playlistLoaded, setPlaylistLoaded] = useState(false);
    
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


    const getYoutubeEmbedUrl = async (url: string): Promise<void> => {
        const videoId: string | undefined = url.split('v=')[1];
        const ampersandPosition: number = videoId ? videoId.indexOf('&') : -1;
        const finalVideoId: string | undefined = ampersandPosition !== -1 ? videoId.substring(0, ampersandPosition) : videoId;
        setEmbedUrl(`https://www.youtube.com/embed/${finalVideoId}?autoplay=1&controls=0&encrypted-media=1`);
        getSongTitle(url);
        setVideoPlaying(true);
        fetchYoutubeSubtitles(url);
        try{
            const response = await fetch('http://localhost:8000/close_microphone', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
        catch (error) {
            
        }
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

    const removePlaylistJson = async (playlistName: string, song: string) => {
        try {
            console.log('Removing playlist:', playlistName);
            await fetch('http://localhost:8000/update_playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({"name": playlistName, "song": song, "action": "remove"}),
            });
        } catch (error) {
            console.error('Error removing playlist:', error);
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
            setPlaylist(allPlaylistsGetter[playlistName]);
            console.log('Switching playlist:', playlistName);
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
            const currentLyric = lyrics.reduce(
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
        if (showStar) {
            setScore(prevScore => prevScore + 100);
        }
    }, [showStar]);

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
                                        </Pressable>
                                    ))
                        ) : (
                            <Text>Loading...</Text>
                        ) }
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

                    <View style={styles.videoContainer}>
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
                                        
                                            const data = await response.json(); // Extract JSON response
                                            setFinalScore(data.final_score); // Store score in state
                                        
                                            console.log("Final Score:", data.final_score);
                                        } catch (error) {
                                            console.error("Error fetching final score:", error);
                                        }

                                    } else {
                                        /*if (cTime === currentTime) {
                                            if (songInPlaylist(selectedSong)) {
                                                removePlaylistJson(playlistName, selectedSong);
                                                fetchPlaylists();
                                            }
                                        }*/
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

                    <View style={styles.lyricsContainer}>
                        <Text style={styles.lyricsText}>{currentLyric}</Text>
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

                <View style={styles.rightPanel}>
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
                            <Text style={styles.goButtonText}>Go</Text>
                        </Pressable>

                    </View>
                        <ScrollView style={{ height: 400}}>
                            {allPlaylistNames.map(name => (
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
                                </Pressable>
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
                                    difficulty === label && { backgroundColor: color, borderColor: color }, // Selected state
                                    pressed && { backgroundColor: '#e5e5e5' }, // Pressed state
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
        minWidth: 500, // Add fixed min width
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
        minWidth: 300, // Add fixed min width
        maxWidth: 800,  // Add fixed max width
        maxHeight: 450, // Add fixed max height
        width: '100%',  // Take available width up to max
        alignSelf: 'center',
        flex: 0,
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
    },
    lyricsText: {
        fontSize: 32,
        color: '#005bb5',
    },
    rightPanel: {
        width: 250,
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
});


