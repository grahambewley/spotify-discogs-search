import React from 'react';
import classes from './ReleaseCover.module.css';
import Link from 'next/link';

const ReleaseCover = ({ release }) => {
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
    </div>
  );
};

export default ReleaseCover;
