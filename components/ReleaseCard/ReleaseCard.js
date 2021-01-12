import React from 'react';
import classes from './ReleaseCard.module.css';
import Link from 'next/link';

const ReleaseCard = ({ release }) => {
  return (
    <div className={classes.container}>
      <a href={release.releaseUrl} rel="noopener noreferrer" target="_blank">
        <img className={classes.releaseCover} src={release.spotifyImageUrl} />
      </a>

      <h3 className={classes.releaseName}>{release.spotifyAlbumName}</h3>
      <h4 className={classes.releaseArtist}>{release.spotifyArtist}</h4>
    </div>
  );
};

export default ReleaseCard;
