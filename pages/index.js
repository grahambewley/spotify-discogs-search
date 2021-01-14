import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCookies } from 'react-cookie';
import Header from '../components/Header/Header';
import ReleaseGrid from '../components/ReleaseGrid/ReleaseGrid';
import PlaylistGrid from '../components/PlaylistGrid/PlaylistGrid';
import classes from '../styles/Home.module.css';
import axios from 'axios';
import Loader from 'react-loader-spinner';

const SPOTIFY_ALBUM_LOAD_LIMIT = 20;

export default function Home() {
  const [accessToken, setAccessToken] = React.useState();
  const [userData, setUserData] = React.useState();

  const [userAlbums, setUserAlbums] = React.useState();
  const [allAlbumsLoaded, setAllAlbumsLoaded] = React.useState(false);
  const [userAlbumsSearchIndex, setUserAlbumsSearchIndex] = React.useState(0);
  const [matchedReleases, setMatchedReleases] = React.useState([]);

  const [userPlaylists, setUserPlaylists] = React.useState();
  const [allPlaylistsLoaded, setAllPlaylistsLoaded] = React.useState(false);

  const [width, setWidth] = React.useState();
  const [gridDisplayIndex, setGridDisplayIndex] = React.useState(0);
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
      getInitialSpotifyUserAlbums();
      getSpotifyPlaylists();
    }
  }, [accessToken]);

  // Watch for userAlbums to be set/changed - get Discogs releases
  React.useEffect(() => {
    if (userAlbums && userAlbumsSearchIndex == 0) {
      getInitialDiscogsReleases();
    }
  }, [userAlbums]);

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

  // Watch for gridDisplayIndex+gridDisplayCount to reach the end of the matchedReleases - then go get another
  React.useEffect(() => {
    // We have to have userAlbums already for any of this to matter...
    if (userAlbums) {
      // Make sure we have enough releases to display - get more if necessary
      if (gridDisplayIndex + gridDisplayCount == matchedReleases.length) {
        loadNextDiscogsRelease();
      }
    }
  }, [gridDisplayIndex, gridDisplayCount]);

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

  const getInitialSpotifyUserAlbums = async () => {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/albums', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        params: {
          limit: SPOTIFY_ALBUM_LOAD_LIMIT
        }
      });

      // If the number of albums we got back is less than the "limit", then we've loaded all albums
      if (response.data.items.length < SPOTIFY_ALBUM_LOAD_LIMIT) {
        setAllAlbumsLoaded(true);
      }

      setUserAlbums(response.data.items);
    } catch (error) {
      console.log(error);
      router.push('/connect');
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

      console.log(tempArray);
      setUserPlaylists(response.data.items);
    } catch (error) {
      console.log(error);
      router.push('/connect');
    }
  };

  const getInitialDiscogsReleases = async () => {
    let releaseArray = [];
    let i = userAlbumsSearchIndex;

    // Load the array of releases until we have enough to fill the grid + 1
    while (releaseArray.length < gridDisplayIndex + gridDisplayCount + 1) {
      // TODO
      // If i reaches userAlbums.length, then we need to load more Spotify albums

      let res = await getDiscogsRelease(userAlbums[i].album);
      if (res) {
        releaseArray = [...releaseArray, res];
      }
      i++;
    }

    // Then set the album search index to where we left off
    setUserAlbumsSearchIndex(i);
    // Initialize our matched releases array
    setMatchedReleases(releaseArray);
  };

  const loadNextDiscogsRelease = async () => {
    let releaseArray = matchedReleases;
    let i = userAlbumsSearchIndex;
    // When we run the function, get current userAlbums
    let albs = userAlbums;

    let foundMatch = false;

    const discogsGetter = async album => {
      let res = await getDiscogsRelease(album);
      if (res) {
        releaseArray = [...releaseArray, res];
        foundMatch = true;
      }
    };

    while (!foundMatch) {
      // If i reaches userAlbums.length, then we need to load more Spotify albums
      if (i == userAlbums.length) {
        // If we've already pulled all Spotify albums, just return - no more albums to search
        if (allAlbumsLoaded) {
          return;
        } else {
          albs = await getNextSpotifyUserAlbums();

          // Edge case: If 0 new albums come back, then our last load pulled the exact # albums remaining - we're done
          if (albs.length === userAlbums.length) {
            return;
          } else {
            await discogsGetter(albs[i].album);
            i++;
          }
        }
      } else {
        console.log('here we see userAlbums as ', albs);
        await discogsGetter(albs[i].album);
        i++;
      }
    }

    // Then set the album search index to where we left off
    setUserAlbumsSearchIndex(i);
    // and update our matchedReleases
    setMatchedReleases(releaseArray);
  };

  const getNextSpotifyUserAlbums = async () => {
    console.log('getNextSpotifyUserAlbums triggered...');
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/albums', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        params: {
          limit: SPOTIFY_ALBUM_LOAD_LIMIT,
          offset: userAlbums.length
        }
      });

      // If the number of albums we got back is less than the "limit", then we've loaded all albums
      if (response.data.items.length < SPOTIFY_ALBUM_LOAD_LIMIT) {
        setAllAlbumsLoaded(true);
      }

      let tempUserAlbums = [...userAlbums, ...response.data.items];
      console.log('Setting userAlbums to ', tempUserAlbums);
      setUserAlbums(tempUserAlbums);

      return tempUserAlbums;
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

        return match;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAlbumGridForward = () => {
    if (gridDisplayIndex + gridDisplayCount < matchedReleases.length) {
      setGridDisplayIndex(gridDisplayIndex + 1);
    }
  };
  const handleAlbumGridReverse = () => {
    if (gridDisplayIndex > 0) {
      setGridDisplayIndex(gridDisplayIndex - 1);
    }
  };
  const handleAlbumGridMore = () => {
    console.log('gridDisplayCount = ' + gridDisplayCount);
    console.log('matchedReleases.length = ' + matchedReleases.length);
    if (gridDisplayCount < matchedReleases.length) {
      console.log('displaying more...');
      setGridDisplayCount(gridDisplayCount + 1);
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
          <section className={classes.releaseSection}>
            <div className={classes.releaseSection__headerWrapper}>
              <h3 className={classes.releaseSection__header}>
                Albums From Your Library
              </h3>
            </div>
            {matchedReleases.length > 0 ? (
              <ReleaseGrid
                releases={matchedReleases.slice(
                  gridDisplayIndex,
                  gridDisplayIndex + gridDisplayCount
                )}
                albumGridForward={() => handleAlbumGridForward()}
                albumGridReverse={() => handleAlbumGridReverse()}
                albumGridMore={() => handleAlbumGridMore()}
                width={width}
              />
            ) : (
              <Loader type="TailSpin" color="#999999" height={35} width={35} />
            )}
          </section>

          <section className={classes.releaseSection}>
            <div className={classes.releaseSection__headerWrapper}>
              <h3 className={classes.releaseSection__header}>
                Explore Your Playlists (Coming Soon)
              </h3>
            </div>

            {userPlaylists ? (
              <PlaylistGrid playlists={userPlaylists} />
            ) : (
              <Loader type="TailSpin" color="#999999" height={35} width={35} />
            )}
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
