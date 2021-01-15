import React from 'react';
import classes from './PlaylistGrid.module.css';

const PlaylistGrid = ({ playlists }) => {
  return (
    <div className={classes.grid}>
      {playlists.map(playlist => (
        <a
          key={playlist.id}
          className={classes.playlist__link}
          href={'/playlist/' + playlist.id}
        >
          <div className={classes.playlist}>
            <div className={classes.playlist__coverWrapper}>
              <img
                src={playlist.images[0].url}
                className={classes.playlist__cover}
              />
            </div>
            <div className={classes.playlist__info}>
              <h3>{playlist.name}</h3>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

export default PlaylistGrid;
