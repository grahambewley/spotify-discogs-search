import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCookies } from 'react-cookie';
import Header from '../components/Header/Header';
import AlbumMatch from '../components/AlbumMatch/AlbumMatch';
import TrackMatch from '../components/TrackMatch/TrackMatch';
import ReleaseGrid from '../components/ReleaseGrid/ReleaseGrid';
import classes from '../styles/Home.module.css';
import axios from 'axios';
import Loader from 'react-loader-spinner';
import PlaylistGrid from '../components/PlaylistGrid/PlaylistGrid';

const SPOTIFY_ALBUM_LOAD_LIMIT = 20;

export default function Home() {
  const [accessToken, setAccessToken] = React.useState();
  const [userData, setUserData] = React.useState();

  const [userPlaylists, setUserPlaylists] = React.useState();
  const [allPlaylistsLoaded, setAllPlaylistsLoaded] = React.useState(false);

  const [width, setWidth] = React.useState();

  const [gridDisplayCount, setGridDisplayCount] = React.useState(4);

  const router = useRouter();
  const [cookies, setCookie, removeCookie] = useCookies();

  // On page load, if there is an access_path in the URL, it means we just got redirected
  // from the Spotify authorization request - set accessToken in state and cookies and
  // clear the hash from the URL
  React.useEffect(() => {
    const path = router.asPath;

    if (path.includes('access_token')) {
      const token = path.slice(path.indexOf('=') + 1, path.indexOf('&'));
      const maxAge = parseInt(path.slice(path.lastIndexOf('=') + 1));

      setAccessToken(token);
      setCookie('spotifyAccessToken', token, {
        maxAge
      });

      router.replace('/');
    } else if (cookies.spotifyAccessToken) {
      setAccessToken(cookies.spotifyAccessToken);
    } else {
      router.push('/connect');
    }
  }, []);

  // If there is an accessToken but no user data, get user data
  React.useEffect(() => {
    if (accessToken && !userData) {
      getSpotifyUserData();
      getSpotifyPlaylists();
    }
  }, [accessToken]);

  React.useLayoutEffect(() => {
    function updateWidth() {
      setWidth(window.innerWidth);
    }
    window.addEventListener('resize', updateWidth);
    updateWidth();
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  React.useEffect(() => {
    if (width) {
      if (width > 1200 || width <= 500) {
        setGridDisplayCount(4);
      } else if (width > 700) {
        setGridDisplayCount(3);
      } else {
        setGridDisplayCount(2);
      }
    }
  }, [width]);

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

  const getDiscogsRelease = async album => {
    let params = {
      q: album.name,
      type: 'release',
      format: 'Vinyl'
    };

    // If album isn't by "various artists", add the artist's name to the query
    if (album.artists[0].name.toLowerCase() != 'various artists') {
      params.q = album.name + ' ' + album.artists[0].name;
    }

    try {
      const response = await axios.get(
        'https://api.discogs.com/database/search',
        {
          headers: {
            Authorization: `Discogs key=${process.env.NEXT_PUBLIC_DISCOGS_KEY}, secret=${process.env.NEXT_PUBLIC_DISCOGS_SECRET}`
          },
          params
        }
      );

      //If we get back one or more results from Discogs search, return the first (most relevant) one
      if (response.data.results.length > 0) {
        const topResult = response.data.results[0];

        // If the Spotify release has multiple artists - stick them together in one string
        let artistList = album.artists[0].name;
        if (album.artists.length > 1) {
          let artistList = '';
          album.artists.forEach(artist => {
            artistList = artistList + artist + ', ';
          });
          artistList = artistList.slice(0, -2);
        }

        // Create a match object to return out
        const match = {
          spotifyAlbumName: album.name,
          spotifyArtist: artistList,
          spotifyImageUrl: album.images[0].url,
          releaseCountry: topResult.country,
          releaseYear: topResult.year,
          releaseUrl: 'https://www.discogs.com' + topResult.uri,
          releaseId: topResult.id
        };

        console.log('Got discogs release: ', match.spotifyAlbumName);
        return match;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getSpotifyPlaylists = async () => {
    try {
      const response = await axios.get(
        'https://api.spotify.com/v1/me/playlists',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          params: {
            limit: 12
          }
        }
      );

      if (response.data.items.length === response.data.items.total) {
        setAllPlaylistsLoaded(true);
      }

      setUserPlaylists(response.data.items);
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
          <AlbumMatch
            accessToken={accessToken}
            gridDisplayCount={gridDisplayCount}
            width={width}
            getDiscogsRelease={getDiscogsRelease}
          />
          <TrackMatch
            accessToken={accessToken}
            gridDisplayCount={gridDisplayCount}
            width={width}
            getDiscogsRelease={getDiscogsRelease}
          />

          <section className={classes.releaseSection}>
            <div className={classes.releaseSection__headerWrapper}>
              <h3 className={classes.releaseSection__header}>
                Explore Your Playlists
              </h3>
            </div>
            {userPlaylists && <PlaylistGrid playlists={userPlaylists} />}
          </section>
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
