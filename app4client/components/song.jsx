import React, { useState } from 'react'

import styles from "../styles/song.module.css"

export default function Song({ song, onClick, dragStart, dragOver, dragLeave, dragEnd, drop }) {

    const timePrettify = (time) =>
        String(Math.floor(time / 60)).padStart(2, "0") + ":" + String(Math.floor(time % 60)).padStart(2, "0");

    return (
        <div draggable className={styles.songMain} onClick={onClick}
            onDragStart={dragStart}
            onDragLeave={dragLeave}
            onDragEnd={dragEnd}
            onDragOver={dragOver}
            onDrop={drop}
        >
            <div className={styles.songThumbnail} style={{
                backgroundImage: "url(" + song.thumbnail + ")"
            }}></div>
            <div className={styles.songTitle}>{song.title}</div>
            <div className={styles.songDuration}>{timePrettify(song.duration)}</div>
        </div>
    )
}
