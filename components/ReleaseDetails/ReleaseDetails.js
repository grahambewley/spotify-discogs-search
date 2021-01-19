import React from 'react';
import classes from './ReleaseDetails.module.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faGlobe,
  faCalendar,
  faMusic
} from '@fortawesome/free-solid-svg-icons';

const ReleaseDetails = ({ release }) => {
  return (
    <>
      {release.spotifyTrackName ? (
        <div className={classes.releaseInfo}>
          <h3 className={classes.releaseName}>{release.spotifyAlbumName}</h3>
          <h4 className={classes.releaseDetail}>
            <FontAwesomeIcon
              icon={faMusic}
              className={classes.releaseDetailIcon}
            />
            {release.spotifyTrackName} &mdash; {release.spotifyArtist}
          </h4>
          {/* {release.spotifyArtist && (
            <h4 className={classes.releaseDetail}>
              <FontAwesomeIcon
                className={classes.releaseDetailIcon}
                icon={faUser}
              />
              {release.spotifyArtist}
            </h4>
          )} */}
          {release.releaseCountry && (
            <h4 className={classes.releaseDetail}>
              <FontAwesomeIcon
                className={classes.releaseDetailIcon}
                icon={faGlobe}
              />
              {release.releaseCountry}
            </h4>
          )}
          {release.releaseYear && (
            <h4 className={classes.releaseDetail}>
              <FontAwesomeIcon
                className={classes.releaseDetailIcon}
                icon={faCalendar}
              />
              {release.releaseYear}
            </h4>
          )}
        </div>
      ) : (
        <div className={classes.releaseInfo}>
          <h3 className={classes.releaseName}>{release.spotifyAlbumName}</h3>
          {release.spotifyArtist && (
            <h4 className={classes.releaseDetail}>
              <FontAwesomeIcon
                className={classes.releaseDetailIcon}
                icon={faUser}
              />
              {release.spotifyArtist}
            </h4>
          )}
          {release.releaseCountry && (
            <h4 className={classes.releaseDetail}>
              <FontAwesomeIcon
                className={classes.releaseDetailIcon}
                icon={faGlobe}
              />
              {release.releaseCountry}
            </h4>
          )}
          {release.releaseYear && (
            <h4 className={classes.releaseDetail}>
              <FontAwesomeIcon
                className={classes.releaseDetailIcon}
                icon={faCalendar}
              />
              {release.releaseYear}
            </h4>
          )}
        </div>
      )}
    </>
  );
};

export default ReleaseDetails;
