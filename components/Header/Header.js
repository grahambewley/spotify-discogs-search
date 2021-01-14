import React from 'react';
import classes from './Header.module.css';
import Link from 'next/link';

const Header = ({ userData }) => {
  return (
    <header className={classes.container}>
      <Link href="/">
        <a className={classes.tempLogoLink}>
          <h3 className={classes.tempLogo}>FindOnVinyl</h3>
        </a>
      </Link>

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
