import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import classes from '../styles/Home.module.css';
import axios from 'axios';
import { createFactory } from 'react';

export default function Home() {
  const [accessToken, setAccessToken] = React.useState();

  const router = useRouter();

  const redirectURI = encodeURI(process.env.NEXT_PUBLIC_REDIRECT_URL);
  const spotifyAuthorizationUrl = `https://accounts.spotify.com/authorize?client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}&redirect_uri=${redirectURI}&scope=user-read-private%20user-read-email&response_type=token`;

  // On initial load, go off and try to get authorization from Spotify
  // If user has visited already, they'll be authenticated
  // React.useEffect(() => {
  //   checkSpotifyAuthorization();
  // }, []);

  // async function checkSpotifyAuthorization() {
  //   try {
  //     const response = await axios.get(spotifyAuthorizationUrl);
  //     console.log(response);
  //   } catch (error) {
  //     console.log(error);
  //     alert('There was an error getting Spotify authorization');
  //   }
  // }

  React.useEffect(() => {
    const path = router.asPath;
    if (path.includes('access_token')) {
      const temp = path.slice(path.indexOf('=') + 1, path.indexOf('&'));
      console.log('Setting access token to: ' + temp);
      setAccessToken(temp);
    }
  }, []);

  return (
    <div className={classes.container}>
      <Head>
        <title>Spotify Discogs Search</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={classes.main}>
        <h1 className={classes.title}>Welcome to Spotify Discogs Search</h1>
        <p className={classes.description}>Find your Spotify music on vinyl</p>
        <a href={spotifyAuthorizationUrl}>Log In With Spotify</a>
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
