import React from 'react';
import classes from './Header.module.css';

const Header = ({ userData }) => {
  return (
    <header className={classes.container}>
      <h3 className={classes.tempLogo}>Spotify Discogs Search</h3>

      <div className={classes.user}>
        {userData && (
          <>
            <img className={classes.user__image} src={userData.images[0].url} />
            <h4 className={classes.user__name}>{userData.display_name}</h4>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
