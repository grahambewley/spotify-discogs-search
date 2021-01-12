import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCookies } from 'react-cookie';

import classes from '../styles/Home.module.css';

export default function Home() {
  const [accessToken, setAccessToken] = React.useState();
  const [userAlbums, setUserAlbums] = React.useState();

  const router = useRouter();

  const [cookies, setCookie, removeCookie] = useCookies();

  // On page load, if there is an access_path in the URL, it means we just got redirected
  // from the Spotify authorization request - set accessToken in state and cookies and
  // clear the hash from the URL
  React.useEffect(() => {
    const path = router.asPath;

    if (path.includes('access_token')) {
      // Get access_token from hash (comes after first "=")
      const token = path.slice(path.indexOf('=') + 1, path.indexOf('&'));
      // Get expires_in from hash (comes after last "=")
      const maxAge = parseInt(path.slice(path.lastIndexOf('=') + 1));

      // Set accessToken in state
      setAccessToken(token);

      // Set spotifyAccessToken cookie, with appropriate expiration date
      setCookie('spotifyAccessToken', token, {
        maxAge
      });

      // Clear has from URL
      router.replace('/');
    } else if (cookies.spotifyAccessToken) {
      setAccessToken(cookies.spotifyAccessToken);
    } else {
      console.log('Pushing /connect to router...');
      router.push('/connect');
    }
  }, []);

  // On page load, if spotifyAccessToken cookie exists, add it to state
  // If there is no cookie, redirect to /connect page
  // React.useEffect(() => {

  //   if (cookies.spotifyAccessToken) {
  //     setAccessToken(cookies.spotifyAccessToken);
  //   } else {

  //   }
  // }, []);

  // If there is an accessToken but no user data, get user data
  React.useEffect(() => {
    if (accessToken && !userAlbums) {
      console.log('No user albums, going to fill them in now...');
    }
  }, [accessToken]);

  return (
    <div className={classes.container}>
      <Head>
        <title>Spotify Discogs Search</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={classes.main}>
        <h1>Hello world</h1>
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
