import React from 'react';
import Head from 'next/head';
import axios from 'axios';
import { useCookies } from 'react-cookie';
import { useRouter } from 'next/router';
import Header from '../../components/Header/Header';
import classes from '../../styles/Home.module.css';

const PlaylistPage = () => {
  const router = useRouter();
  const { playlist_id } = router.query;

  const [cookies, setCookie, removeCookie] = useCookies();

  const [accessToken, setAccessToken] = React.useState();
  const [userData, setUserData] = React.useState();
  const [playlistName, setPlaylistName] = React.useState();
  const [playlistItems, setPlaylistItems] = React.useState();
  const [playlistTotalSize, setPlaylistTotalSize] = React.useState();

  // Get Spotify user data to display - if we can't, redirect to /connect
  React.useEffect(() => {
    if (cookies.spotifyAccessToken) {
      setAccessToken(cookies.spotifyAccessToken);
    } else {
      router.push('/connect');
    }
  }, []);

  // If there is an accessToken but no user data, get user data
  React.useEffect(() => {
    if (accessToken && !userData) {
      getSpotifyUserData();
    }
  }, [accessToken]);

  React.useEffect(() => {
    if (playlist_id) {
      getSpotifyPlaylistInfo();
      getSpotifyPlaylistItems();
    }
  }, [playlist_id]);

  const getSpotifyUserData = async () => {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      setUserData(response.data);
    } catch (error) {
      console.log(error);
      router.push('/connect');
    }
  };

  const getSpotifyPlaylistInfo = async () => {
    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlist_id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      setPlaylistName(response.data.name);
    } catch (error) {
      console.log(error);
      router.push('/connect');
    }
  };

  const getSpotifyPlaylistItems = async () => {
    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      console.log('playlist items response, ', response.data);
      setPlaylistTotalSize(response.data.total);
      setPlaylistItems();
    } catch (error) {
      console.log(error);
      router.push('/connect');
    }
  };

  return (
    <>
      <Head>
        <title>FindOnVinyl | Spotify Vinyl Records Search</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header userData={userData} />
      <div className={classes.container}>
        <main className={classes.main}>
          <h1>{playlistName}</h1>

          <h4>[Playlist functionality coming soon]</h4>
        </main>
      </div>
    </>
  );
};

export default PlaylistPage;
