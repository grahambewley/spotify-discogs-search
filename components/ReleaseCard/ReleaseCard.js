import React from 'react';
import classes from './ReleaseCard.module.css';
import Link from 'next/link';

const ReleaseCard = ({ release }) => {
  return (
    <div className={classes.container}>
      <a
        className={classes.releaseLink}
        href={release.releaseUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className={classes.releaseLinkLabel}>
          View Release on Discogs
        </span>
        <img className={classes.releaseCover} src={release.spotifyImageUrl} />
      </a>

      <div className={classes.releaseInfo}>
        <h3 className={classes.releaseName}>{release.spotifyAlbumName}</h3>
        <h4 className={classes.releaseArtist}>{release.spotifyArtist}</h4>
      </div>
    </div>
  );
};

export default ReleaseCard;
