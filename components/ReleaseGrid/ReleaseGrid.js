import React from 'react';
import classes from './ReleaseGrid.module.css';
import ReleaseCover from '../ReleaseCover/ReleaseCover';
import ReleaseDetails from '../ReleaseDetails/ReleaseDetails';

const ReleaseGrid = ({
  releases,
  albumGridForward,
  albumGridReverse,
  albumGridMore,
  width
}) => {
  return (
    <>
      {width > 500 ? (
        <>
          <div className={classes.coverGridWrapper}>
            <button className={classes.backButton} onClick={albumGridReverse}>
              <span>Back</span>
            </button>
            <button className={classes.nextButton} onClick={albumGridForward}>
              <span>Next</span>
            </button>
            <div className={classes.grid}>
              {releases.map(release => (
                <ReleaseCover key={release.releaseId} release={release} />
              ))}
            </div>
          </div>

          <div className={classes.grid}>
            {releases.map(release => (
              <ReleaseDetails key={release.releaseId} release={release} />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className={classes.grid}>
            {releases.map(release => (
              <div key={release.releaseId}>
                <ReleaseCover release={release} />
                <ReleaseDetails release={release} />
              </div>
            ))}
          </div>
          <button className={classes.moreButton} onClick={albumGridMore}>
            Show More
          </button>
        </>
      )}
    </>
  );
};

export default ReleaseGrid;
