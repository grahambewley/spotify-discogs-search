import React from 'react';
import classes from './PlaylistGrid.module.css';

const PlaylistGrid = ({ playlists }) => {
  return (
    <div className={classes.grid}>
      {playlists.map(playlist => (
        <div key={playlist.id} className={classes.playlist}>
          <img
            src={playlist.images[0].url}
            className={classes.playlist__cover}
          />
          <div className={classes.playlist__info}>
            <h3>{playlist.name}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlaylistGrid;
