import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCookies } from 'react-cookie';
import Header from '../components/Header/Header';
import classes from '../styles/Home.module.css';
import axios from 'axios';

export default function Home() {
  const [accessToken, setAccessToken] = React.useState();
  const [userData, setUserData] = React.useState();

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

  // If there is an accessToken but no user data, get user data
  React.useEffect(() => {
    if (accessToken && !userData) {
      console.log('No user data, getting that now...');
      getSpotifyUserData();
    }
  }, [accessToken]);

  const getSpotifyUserData = async () => {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      console.log(response);
      setUserData(response.data);
    } catch (error) {
      console.log(error);
      alert('Error getting Spotify user data');
    }
  };

  return (
    <>
      <Header userData={userData} />
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
    </>
  );
}
