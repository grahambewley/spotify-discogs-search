import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCookies } from 'react-cookie';
import Header from '../components/Header/Header';
import ReleaseGrid from '../components/ReleaseGrid/ReleaseGrid';
import classes from '../styles/Home.module.css';
import axios from 'axios';

const SPOTIFY_ALBUM_LOAD_LIMIT = 20;

export default function Home() {
  const [accessToken, setAccessToken] = React.useState();
  const [userData, setUserData] = React.useState();

  const [userAlbums, setUserAlbums] = React.useState();
  // This is set to true when we determine we've pulled all of a user's Spotify albums
  const [allAlbumsLoaded, setAllAlbumsLoaded] = React.useState(false);
  const [userAlbumsSearchIndex, setUserAlbumsSearchIndex] = React.useState(0);
  const [matchedReleases, setMatchedReleases] = React.useState([]);

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
    }
  }, [accessToken]);

  // Watch for userAlbums to be set/changed - get Discogs releases
  React.useEffect(() => {
    if (userAlbums && userAlbumsSearchIndex == 0) {
      getInitialDiscogsReleases();
    }
  }, [userAlbums]);

  // Watch for gridDisplayIndex+gridDisplayCount to reach the end of the matchedReleases - then go get another
  React.useEffect(() => {
    // We have to have userAlbums already for any of this to matter...
    if (userAlbums) {
      // Make sure we have enough releases to display - get more if necessary
      if (gridDisplayIndex + gridDisplayCount == matchedReleases.length) {
        loadNextDiscogsRelease();
      }
    }
  }, [gridDisplayIndex]);

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
      alert('Error getting Spotify albums for user');
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

    let foundMatch = false;

    while (!foundMatch) {
      // If i reaches userAlbums.length, then we need to load more Spotify albums
      if (i == userAlbums.length) {
        // If we've already pulled all Spotify albums, just return - no more albums to search
        if (allAlbumsLoaded) {
          return;
        }
        // otherwise go ahead and get more spotify albums
        else {
          const newUserAlbums = await getNextSpotifyUserAlbums();
          // If we went to get albums and the same number came back, that means there were 0 more to load
          // This happens when our last load from spotify pulled the exact number of remaining albums
          // which doesn't trigger allAlbumsLoaded to be set to true...
          if (newUserAlbums.length === userAlbums.length) {
            console.log('Edge case avoided!');
            return;
          } else {
            let res = await getDiscogsRelease(newUserAlbums[i].album);
            if (res) {
              releaseArray = [...releaseArray, res];
              foundMatch = true;
            }
            i++;
          }
        }
      } else {
        let res = await getDiscogsRelease(userAlbums[i].album);
        if (res) {
          releaseArray = [...releaseArray, res];
          foundMatch = true;
        }
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
    console.log(
      'searched index is currently ' +
        userAlbumsSearchIndex +
        ' and  userAlbums length is ' +
        userAlbums.length
    );
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
        console.log('ALL SPOTIFY ALBUMS LOADED!');
        setAllAlbumsLoaded(true);
      }

      let tempUserAlbums = [...userAlbums, ...response.data.items];
      console.log('Setting userAlbums to ', tempUserAlbums);
      setUserAlbums(tempUserAlbums);

      return tempUserAlbums;
    } catch (error) {
      console.log(error);
      alert('Error getting Spotify albums for user');
    }
  };

  // Takes in an album item from Spotify - returns a Discogs release if one exists
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
      alert('Error searching Discogs for releases: ' + error);
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
            <div className={classes.releaseSection__headerWrapper}>
              <h3 className={classes.releaseSection__header}>
                Albums From Your Library
              </h3>
            </div>
            <ReleaseGrid
              releases={matchedReleases.slice(
                gridDisplayIndex,
                gridDisplayIndex + gridDisplayCount
              )}
              albumGridForward={() => handleAlbumGridForward()}
              albumGridReverse={() => handleAlbumGridReverse()}
            />
          </section>

          <section className={classes.releaseSection}>
            <div className={classes.releaseSection__headerWrapper}>
              <h3 className={classes.releaseSection__header}>
                Explore Your Playlists
              </h3>
            </div>
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
