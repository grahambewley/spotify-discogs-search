import React from 'react';
import classes from './ReleaseGrid.module.css';
import ReleaseCover from '../ReleaseCover/ReleaseCover';
import ReleaseDetails from '../ReleaseDetails/ReleaseDetails';

const ReleaseGrid = ({ releases, albumGridForward, albumGridReverse }) => {
  return (
    <>
      <div className={classes.coverGridWrapper}>
        <div className={classes.grid}>
          {releases.map(release => (
            <ReleaseCover key={release.releaseId} release={release} />
          ))}
        </div>
        <button className={classes.backButton} onClick={albumGridReverse}>
          Back
        </button>
        <button className={classes.nextButton} onClick={albumGridForward}>
          Next
        </button>
      </div>
      <div className={classes.grid}>
        {releases.map(release => (
          <ReleaseDetails key={release.releaseId} release={release} />
        ))}
      </div>
    </>
  );
};

export default ReleaseGrid;
