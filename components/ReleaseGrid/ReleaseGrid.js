import React from 'react';
import classes from './ReleaseGrid.module.css';
import ReleaseCard from '../ReleaseCard/ReleaseCard';

const ReleaseGrid = ({ releases, albumGridForward, albumGridReverse }) => {
  return (
    <>
      <div className={classes.container}>
        {releases.map(release => (
          <ReleaseCard key={release.releaseId} release={release} />
        ))}
      </div>
      <button onClick={albumGridReverse}>Back</button>
      <button onClick={albumGridForward}>Next</button>
    </>
  );
};

export default ReleaseGrid;
