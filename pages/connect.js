import React from 'react';
import Head from 'next/head';
import { useCookies } from 'react-cookie';
import { Router, useRouter } from 'next/router';
import classes from '../styles/Connect.module.css';
import Image from 'next/image';

export default function Home() {
  const [cookies, setCookie, removeCookie] = useCookies();

  const router = useRouter();

  const redirectURI = encodeURI(process.env.NEXT_PUBLIC_REDIRECT_URL);
  const spotifyAuthorizationUrl = `https://accounts.spotify.com/authorize?client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}&redirect_uri=${redirectURI}&scope=user-read-private%20user-library-read&response_type=token`;

  // Check cookies for spotifyAccessToken - if it exists, redirect to index page
  React.useEffect(() => {
    if (cookies.spotifyAccessToken) {
      router.push('/');
    }
  }, []);

  return (
    <div className={classes.container}>
      <Head>
        <title>FindOnVinyl | Spotify Vinyl Records Search</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={classes.main}>
        <h1 className={classes.title}>FindOnVinyl</h1>
        <p className={classes.description}>
          Discover vinyl releases in your Spotify library
        </p>
        <a className={classes.loginButton} href={spotifyAuthorizationUrl}>
          <span>Log In With </span>
          <img
            className={classes.loginButtonSpotifyLogo}
            src="./spotify-white.png"
          />
        </a>
      </main>

      <footer className={classes.footer}>
        <p>
          Created by{' '}
          <a
            href="https://grahambewley.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            Graham Bewley
          </a>
        </p>
      </footer>
    </div>
  );
}
