import React from 'react';
import classes from './ReleaseDetails.module.css';

const ReleaseDetails = ({ release }) => {
  return (
    <div className={classes.releaseInfo}>
      <h3 className={classes.releaseName}>{release.spotifyAlbumName}</h3>
      <h4 className={classes.releaseArtist}>{release.spotifyArtist}</h4>
    </div>
  );
};

export default ReleaseDetails;
