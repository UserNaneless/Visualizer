import React, { useState, useRef } from 'react'

import styles from "../styles/playlist.module.css"
import Song from './song';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faShuffle, faTrashCan, faXmark } from '@fortawesome/free-solid-svg-icons';


export default function Playlist({ playlist, songOnClick, playlistShuffle, setPlaylist, setLooped, looped, playlistOpened }) {
    const input = useRef();

    const [currentItem, setCurrentItem] = useState();
    const [search, setSearch] = useState("");
    const [currentItemDOM, setCurrentItemDOM] = useState(null);

    const searchSong = (e) => {
        setSearch(e.target.value)
    }

    const requestShuffle = () => {
        playlistShuffle()
    }

    const requestPlaylistClear = () => {
        setPlaylist([]);
    }

    const requestPlaylistLoop = () => {
        setLooped(!looped);
    }

    const dragStart = (e, data) => {
        const img = new Image();
        e.dataTransfer.setDragImage(img, 0, 0);
        setCurrentItem(data);
        setCurrentItemDOM(e.currentTarget);

        e.currentTarget.style.transform = "scale(.9)";
    }

    const dragEnd = (e, data) => {
        //console.log(e, data);
    }

    const drop = (e, data) => {
        e.preventDefault();

        e.currentTarget.style.background = "white";
        e.currentTarget.style.color = "#767676";
        e.currentTarget.style.transform = "scale(1)";

        currentItemDOM.style.transform = "scale(1)";

        setCurrentItemDOM(null);

        setPlaylist(playlist.map(item => {
            if (item == data) {
                return currentItem;
            }

            if (item == currentItem) {
                return data;
            }

            return item;

        }))

    }

    const dragOver = (e, data) => {
        e.preventDefault();
        e.currentTarget.style.background = "#ededed";
        e.currentTarget.style.color = "black";
        e.currentTarget.style.transform = "scale(1.1)";
        //console.log(e, data);
    }

    const dragLeave = (e) => {
        //console.log(e, data);
        e.currentTarget.style.background = "white";
        e.currentTarget.style.color = "#767676";
        e.currentTarget.style.transform = "scale(1)";
        if(e.currentTarget == currentItemDOM){
            currentItemDOM.style.transform = "scale(.9)";
        }
    }

    return (
        <div className={`${styles.playlistMain} ${playlistOpened  ? styles.playlistOpen : ""}`} >
            <div className={styles.playlistTop}>
                <div className={styles.searchWrapper}>
                    <input ref={input} className={styles.searchBar} type="text" placeholder="Search song "
                        onInput={searchSong} />
                    <button className={styles.clearButton} onClick={() => {
                        input.current.value = "";
                        setSearch("");
                    }}>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <button className={`${styles.playlistButton}`} onClick={requestShuffle}>
                    <FontAwesomeIcon icon={faShuffle} />
                </button>

                <button className={`${styles.playlistButton}`} onClick={requestPlaylistLoop}
                    style={{
                        background: looped ? "#767676" : "white",
                        color: looped ? "white" : "#767676"
                    }}
                >
                    <FontAwesomeIcon icon={faArrowsRotate} />
                </button>

                <button className={`${styles.playlistButton}`} onClick={requestPlaylistClear}>
                    <FontAwesomeIcon icon={faTrashCan} />
                </button>
            </div>

            <hr className={styles.line} />

            <div className={styles.playlistScrollbox}>
                {playlist.length > 0 && playlist.filter(item =>
                    item.title.toLowerCase().includes(search.toLowerCase())
                ).map((item, i) =>
                    <Song song={item} key={i} onClick={() => songOnClick(i)}
                        dragStart={(e) => dragStart(e, item)}
                        dragEnd={dragEnd}
                        drop={(e) => drop(e, item)}
                        dragOver={dragOver}
                        dragLeave={dragLeave}
                    />
                )}
            </div>
        </div>
    )
}
