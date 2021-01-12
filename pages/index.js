import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCookies } from 'react-cookie';
import Header from '../components/Header/Header';
import ReleaseGrid from '../components/ReleaseGrid/ReleaseGrid';
import classes from '../styles/Home.module.css';
import axios from 'axios';

export default function Home() {
  const [accessToken, setAccessToken] = React.useState();
  const [userData, setUserData] = React.useState();
  const [userAlbums, setUserAlbums] = React.useState();
  const [matchedReleases, setMatchedReleases] = React.useState([]);
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
      getSpotifyUserAlbums();
    }
  }, [accessToken]);

  // Watch for userAlbums to be set/changed - get Discogs releases
  React.useEffect(() => {
    if (userAlbums) {
      getDiscogsReleases(userAlbums);
    }
  }, [userAlbums]);

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
      alert('Error getting Spotify user data');
    }
  };

  const getSpotifyUserAlbums = async () => {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/albums', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      setUserAlbums(response.data.items);
    } catch (error) {
      console.log(error);
      alert('Error getting Spotify albums for user');
    }
  };

  const getDiscogsReleases = async userAlbums => {
    let tempArray = [];
    for (let i = 0; i < 6; i++) {
      let res = await getDiscogsRelease(userAlbums[i].album);
      if (res) {
        tempArray = [...tempArray, res];
      }
    }

    setMatchedReleases(tempArray);
  };

  const getDiscogsRelease = async album => {
    let params = {
      q: album.name,
      type: 'release',
      format: 'Vinyl'
    };

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

      //If we get back one or more results from Discogs search, add the first (most relevant) one to matchedReleases
      if (response.data.results.length > 0) {
        const topResult = response.data.results[0];

        let artistList = album.artists[0].name;

        // If the Spotify release has multiple artists - stick them together in one string
        if (album.artists.length > 1) {
          let artistList = '';
          album.artists.forEach(artist => {
            artistList = artistList + artist + ', ';
          });
          artistList = artistList.slice(0, -2);
        }

        const match = {
          spotifyAlbumName: album.name,
          spotifyArtist: artistList,
          spotifyImageUrl: album.images[0].url,
          releaseCountry: topResult.country,
          releaseYear: topResult.year,
          releaseUrl: 'https://www.discogs.com' + topResult.uri
        };

        return match;
      }
    } catch (error) {
      console.log(error);
      alert('Error searching Discogs for releases');
    }
  };

  return (
    <>
      <Head>
        <title>Spotify Discogs Search</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header userData={userData} />
      <div className={classes.container}>
        <main className={classes.main}>
          <section className={classes.releaseSection}>
            <h4 className={classes.releaseSection__header}>Saved Albums</h4>
            <ReleaseGrid releases={matchedReleases} />
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
