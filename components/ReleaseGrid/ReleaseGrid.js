import React from 'react';
import classes from './ReleaseGrid.module.css';
import ReleaseCard from '../ReleaseCard/ReleaseCard';

const ReleaseGrid = ({ releases }) => {
  return (
    <div className={classes.container}>
      {releases.map(release => (
        <ReleaseCard key={release.releaseId} release={release} />
      ))}
    </div>
  );
};

export default ReleaseGrid;
