import React from 'react';
import Head from 'next/head';
import { useCookies } from 'react-cookie';
import { useRouter } from 'next/router';
import Header from '../../components/Header/Header';

const PlaylistPage = () => {
  const router = useRouter();
  const { playlist_id } = router.query;
  const [cookies, setCookie, removeCookie] = useCookies();

  const [accessToken, setAccessToken] = React.useState();

  // Get Spotify user data to display - if we can't, redirect to /connect
  React.useEffect(() => {
    if (cookies.spotifyAccessToken) {
      setAccessToken(cookies.spotifyAccessToken);
    } else {
      router.push('/connect');
    }
  }, []);

  return (
    <>
      <Head>
        <title>FindOnVinyl | Spotify Vinyl Records Search</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
    </>
  );
};

export default PlaylistPage;
