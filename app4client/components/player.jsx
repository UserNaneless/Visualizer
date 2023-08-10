import React, { useEffect, useRef, useState } from 'react'
import styles from "../styles/player.module.css"
import { config } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '@fortawesome/fontawesome-svg-core/styles.css'
import { faPlus, faPause, faPlay, faCircleNotch, faForwardStep, faBackwardStep, faList } from '@fortawesome/free-solid-svg-icons';
import Playlist from './playlist';
import { useRouter } from 'next/router';

config.autoAddCss = false

const shuffle = (array) => {
    const arrayToShuffle = [...array];

    let currentIndex = arrayToShuffle.length, randomIndex;

    while (currentIndex != 0) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [arrayToShuffle[currentIndex], arrayToShuffle[randomIndex]] = [
            arrayToShuffle[randomIndex], arrayToShuffle[currentIndex]];
    }

    return arrayToShuffle;
}

let volumeDrag = false;

let scrollTitleEnd = 1;


export default function Player(props) {
    const [server, setServer] = useState("");
    const video = useRef();
    const video1 = useRef();
    const inputUrl = useRef();
    const audioSettings = useRef();
    const audioTitle = useRef();
    const [playlistSetuped, setPlaylistSetuped] = useState(false)
    const [playerCanBeOpened, setPlayerOpen] = useState(false);
    const [loaded, setLoaded] = useState(true);
    const [audioBuffer, setAudioBuffer] = useState([video, video1]); // [0] - active, [1] - buffer
    const [playlist, setPlaylist] = useState([]);
    const [currentAudio, setCurrentAudio] = useState(0);
    const [formOpened, setFormOpened] = useState(true);
    const [audioPaused, setAudioPaused] = useState(true);
    const [audioVolume, setAudioVolume] = useState(1);
    const [looped, setLooped] = useState(false);
    const [playlistOpened, setPlaylistOpened] = useState(false);
    const [currentAudioInfo, setCurrentAudioInfo] = useState({
        currentTime: 0,
        audioDuration: 0,
        thumbnail: "",
        title: ""
    });

    const playPlaylist = (e) => {
        e.preventDefault();
        let url = null;
        try {
            url = new window.URL(inputUrl.current.value);
        }
        catch (err) {
            return;
        }

        setLoaded(false);
        try {
            if (url) {
                if (url.searchParams.has("v")) {
                    fetch(server + "/videoInfo?link=" + url.toString())
                        .then(res => res.json())
                        .then(json => {
                            setPlaylist([...playlist, json]);
                            setLoaded(true);
                        })
                }
                else if (url.searchParams.has("list")) {
                    fetch(server + "/playlist?link=" + url.toString() + "&limit=100")
                        .then(res => res.json())
                        .then(json => {
                            setPlaylist([...playlist, ...json]);
                            setLoaded(true);
                        });
                }
            }
        } catch (err) {
            console.log("Server is unavaliable");
            setLoaded(true);
        }



    }

    const end = () => {
        if (currentAudio + 1 < playlist.length)
            setCurrentAudio(currentAudio + 1);
        else if (looped) {
            setCurrentAudio(0);
        }

        setCurrentAudioInfo(info => ({
            ...info,
            currentTime: 0
        }))
    }

    const startSong = () => {
        if (playlist.length > 0) {
            if (!audioBuffer[0].current.hasAttribute("src")) {
                audioBuffer[0].current.setAttribute("src", server + "/video?link=" + playlist[currentAudio].id);
            }

            if (audioBuffer[0].current.getAttribute("src") !== server + "/video?link=" + playlist[currentAudio].id) {
                audioBuffer[0].current.setAttribute("src", server + "/video?link=" + playlist[currentAudio].id);
            }
            let bufferUrl = server + "/video?link=";
            if (looped) bufferUrl += playlist[currentAudio + 1 < playlist.length ? currentAudio + 1 : 0].id;
            else bufferUrl = "";
            audioBuffer[1].current.setAttribute("src", bufferUrl);
            audioBuffer[0].current.play().catch(error => error);
            setCurrentAudioInfo(info => ({
                ...info,
                audioDuration: playlist[currentAudio].duration,
                thumbnail: playlist[currentAudio].thumbnail,
                title: playlist[currentAudio].title
            }))
        }

    }

    const requestNextSong = () => {
        setAudioBuffer([audioBuffer[1], audioBuffer[0]]);
    };


    const playNextSong = () => {
        startSong();
    }

    const onMetaDataLoad = (e) => {
        if (e.target.dataset.active == "0")
            e.target.pause();
    }

    const timePrettify = (time) =>
        String(Math.floor(time / 60)).padStart(2, "0") + ":" + String(Math.floor(time % 60)).padStart(2, "0");

    const currentTimeUpdate = (e) => {
        if (e.target.dataset.active == "1") {
            setCurrentAudioInfo(info => ({
                ...info,
                currentTime: e.target.currentTime
            }))
        }
    }

    const currentDurationUpdate = (e) => {
        if (e.target.dataset.active == "1") {
            setCurrentAudioInfo(info => ({
                ...info,
                audioDuration: e.target.duration
            }))
        }
    }

    const scrollTitle = () => {
        let title = audioTitle.current;
        if (scrollTitleEnd > 0)
            title.scrollLeft += 1.0 * scrollTitleEnd;
        if (Math.ceil(title.scrollLeft) >= title.scrollWidth - 125) {
            scrollTitleEnd = 0;
        }

        if (scrollTitleEnd == 0) {
            setTimeout(() => {
                title.scrollLeft = 0;
                scrollTitleEnd = -1;
                requestAnimationFrame(scrollTitle);
            }, 2000)
            return;
        }

        if (scrollTitleEnd == -1) {
            setTimeout(() => {
                scrollTitleEnd = 1;
                requestAnimationFrame(scrollTitle);
            }, 2000)
            return;
        }
        requestAnimationFrame(scrollTitle);
    }

    useEffect(() => {
        props.setVideo(audioBuffer);
        setServer(window.location.href + "/api");
        scrollTitle();
    }, [])

    useEffect(() => {
        if (!playlistSetuped && playlist.length > 0) {
            props.setVideo(audioBuffer);
            startSong();
            setPlaylistSetuped(true);
        }


    }, [playlist])

    useEffect(() => {
        if (playlist.length > 0)
            requestNextSong();
    }, [currentAudio])

    useEffect(() => {
        audioBuffer[0].current.dataset.active = "1";
        audioBuffer[1].current.dataset.active = "0";

        playNextSong();
    }, [audioBuffer])

    useEffect(() => {
        if (audioBuffer[0]) {
            if (audioPaused) {
                audioBuffer[0].current.pause();
            } else {
                audioBuffer[0].current.play();
            }
        }

    }, [audioPaused])

    useEffect(() => {
        audioBuffer[0].current.volume = audioBuffer[1].current.volume = audioVolume;
    }, [audioVolume])

    return (
        <div className={styles.playerWrapper}
            onMouseEnter={() => {
                if (!playerCanBeOpened)
                    setPlayerOpen(true);
            }}

            onMouseLeave={() => {
                if (playerCanBeOpened)
                    setPlayerOpen(false);
                setPlaylistOpened(false);

            }}>
            <div ref={audioSettings} className={`${styles.audioSettings} ${playerCanBeOpened ? styles.dropDown : ""} `}>

                <div className={styles.audioSettingsCentral}>

                    <form className={styles.musicForm} onSubmit={playPlaylist} style={{
                        opacity: Number(formOpened),
                        zIndex: Number(formOpened)
                    }}>
                        <input ref={inputUrl} className={styles.musicInput} type="text" placeholder="Link to playlist" />
                        <button className={styles.musicButton} onClick={props.activateContext}>{playlist.length > 0 ? "Add" : "Play"}</button>
                    </form>



                    <div className={styles.currentlyPlaying} style={{
                        opacity: Number(!formOpened),
                        zIndex: Number(!formOpened)
                    }}>
                        <div className={styles.img} style={{
                            backgroundImage: "url(" + (currentAudioInfo.thumbnail.length > 0 ? currentAudioInfo.thumbnail : "https://www.thoughtco.com/thmb/g8h6NnWWWVkm-KXNBgMx-0Edd2U=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages_482194715-56a1329e5f9b58b7d0bcf666.jpg") + ")"
                        }}></div>
                        <div className={styles.currentlyPlayingInfo}>
                            <div ref={audioTitle} className={styles.currentlyPlayingTitle}>{currentAudioInfo.title.length > 0 ? currentAudioInfo.title : "Music - Music - Music - Music - Music"}</div>
                            <div className={styles.currentPlayingTime}>{timePrettify(currentAudioInfo.currentTime)} / {timePrettify(currentAudioInfo.audioDuration)}</div>
                        </div>
                        <div className={styles.currentPlayingTimeBar} style={{
                            "--time-width": (currentAudioInfo.currentTime / currentAudioInfo.audioDuration) * 100 + "%"
                        }}></div>

                        <div className={styles.volume}>

                            <div className={styles.musicSteps} >
                                <div className={styles.forwardStep} onClick={() => {
                                    if (currentAudio - 1 < 0)
                                        setCurrentAudio(playlist.length - 1);
                                    else
                                        setCurrentAudio(currentAudio - 1)
                                }}>
                                    <FontAwesomeIcon icon={faBackwardStep} />
                                </div>
                                <div className={styles.forwardStep}

                                    onClick={() => {
                                        if (currentAudio + 1 >= playlist.length)
                                            setCurrentAudio(0);
                                        else
                                            setCurrentAudio(currentAudio + 1)
                                    }}>
                                    <FontAwesomeIcon icon={faForwardStep} />
                                </div>


                            </div>



                            <div className={styles.volumeBar} style={{
                                "--time-width": audioVolume * 100 + "%"
                            }}
                                onMouseDown={e => {
                                    if (!volumeDrag)
                                        volumeDrag = true;
                                }}

                                onMouseUp={e => {
                                    if (volumeDrag)
                                        volumeDrag = false;
                                }}

                                onMouseMove={e => {
                                    if (volumeDrag) {
                                        let rect = e.target.getBoundingClientRect();
                                        e.target.style.setProperty("--time-width", (e.clientX - rect.left) / rect.width * 100 + "%");
                                        setAudioVolume(Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1));
                                    }
                                }}></div>
                        </div>
                    </div>

                </div>

                <div className={styles.playlistOpener} onClick={() => {
                    setPlaylistOpened(!playlistOpened);
                }}>
                    <FontAwesomeIcon icon={faList} />
                </div>

                <div className={styles.startButton} onClick={() => {
                    setAudioPaused(!audioPaused);
                }}>
                    <div className={styles.startRed} style={{
                        display: audioPaused ? "block" : "none"
                    }}>
                        <FontAwesomeIcon icon={faPlay} />
                    </div>
                    <div className={styles.stopRed} style={{
                        display: !audioPaused ? "block" : "none"
                    }}>
                        <FontAwesomeIcon icon={faPause} />
                    </div>
                </div>


                <div className={styles.addNewAudio} onClick={() => {
                    setFormOpened(!formOpened);
                }}>
                    <div className={styles.plusRotator} style={{
                        transform: "rotateZ(" + (formOpened ? "135deg" : "0deg") + ")",
                        display: loaded ? "block" : "none"
                    }}>
                        <FontAwesomeIcon icon={faPlus} />

                    </div>

                    <div className={styles.loader} style={{
                        display: loaded ? "none" : "block"
                    }}>
                        <FontAwesomeIcon icon={faCircleNotch} />
                    </div>

                </div>

            </div>


            <video ref={video} className={styles.video}
                crossOrigin='anonymous'
                controls
                onEnded={end}
                onLoadedMetadata={onMetaDataLoad}
                onTimeUpdate={currentTimeUpdate}
                onDurationChange={currentDurationUpdate}
                onPlay={() => {
                    setAudioPaused(false);
                }}
                data-active="1"
                autoPlay
            ></video>
            <video ref={video1} className={styles.video}
                crossOrigin='anonymous'
                controls
                onEnded={end}
                onLoadedMetadata={onMetaDataLoad}
                onTimeUpdate={currentTimeUpdate}
                onDurationChange={currentDurationUpdate}
                onPlay={() => {
                    setAudioPaused(false);
                }}
                autoPlay
            ></video>

            <Playlist playlist={playlist} songOnClick={(i) => setCurrentAudio(i)} setPlaylist={setPlaylist} playlistShuffle={() => setPlaylist(shuffle(playlist))} looped={looped} setLooped={setLooped} playlistOpened={playlistOpened} />

        </div>
    )
}
