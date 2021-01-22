import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCookies } from 'react-cookie';
import Header from '../components/Header/Header';
import AlbumMatch from '../components/AlbumMatch/AlbumMatch';
import ReleaseGrid from '../components/ReleaseGrid/ReleaseGrid';
import classes from '../styles/Home.module.css';
import axios from 'axios';
import Loader from 'react-loader-spinner';
import PlaylistGrid from '../components/PlaylistGrid/PlaylistGrid';

const SPOTIFY_ALBUM_LOAD_LIMIT = 20;

export default function Home() {
  const [accessToken, setAccessToken] = React.useState();
  const [userData, setUserData] = React.useState();

  const [userAlbums, setUserAlbums] = React.useState();
  // This is set to true when we determine we've pulled all of a user's Spotify albums
  const [allAlbumsLoaded, setAllAlbumsLoaded] = React.useState(false);
  const [userAlbumsSearchIndex, setUserAlbumsSearchIndex] = React.useState(0);
  const [matchedReleases, setMatchedReleases] = React.useState([]);
  const [albumGridDisplayIndex, setAlbumGridDisplayIndex] = React.useState(0);

  const [userTracks, setUserTracks] = React.useState();
  const [matchedTracks, setMatchedTracks] = React.useState([]);
  const [allTracksLoaded] = React.useState(false);
  const [userTracksSearchIndex, setUserTracksSearchIndex] = React.useState(0);
  const [trackGridDisplayIndex, setTrackGridDisplayIndex] = React.useState(0);

  const [userPlaylists, setUserPlaylists] = React.useState();
  const [allPlaylistsLoaded, setAllPlaylistsLoaded] = React.useState(false);

  const [width, setWidth] = React.useState();

  const [gridDisplayCount, setGridDisplayCount] = React.useState(4);
  const [trackGridDisplayCount, setTrackGridDisplayCount] = React.useState(4);

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
      getInitialSpotifyTracks();
      getSpotifyPlaylists();
    }
  }, [accessToken]);

  // Watch for userTracks to be set/changed - get Discogs releases for tracks
  React.useEffect(() => {
    if (userTracks && userTracksSearchIndex == 0) {
      getInitialDiscogsReleasesFromTracks();
    }
  }, [userTracks]);

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
        setTrackGridDisplayCount(4);
      } else if (width > 700) {
        setGridDisplayCount(3);
        setTrackGridDisplayCount(3);
      } else {
        setGridDisplayCount(2);
        setTrackGridDisplayCount(2);
      }
    }
  }, [width]);

  // Watch for trackGridDisplayIndex+trackGridDisplayCount to reach the end of the matchedTracks
  // -- then go get another
  React.useEffect(() => {
    // We have to have userTracks already for any of this to matter...
    if (userTracks) {
      // Make sure we have enough releases to display - get more if necessary
      if (
        trackGridDisplayIndex + trackGridDisplayCount ==
        matchedTracks.length
      ) {
        loadNextDiscogsReleaseFromTrack();
      }
    }
  }, [trackGridDisplayIndex, trackGridDisplayCount]);

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

  const getInitialSpotifyTracks = async () => {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/tracks', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        params: {
          limit: SPOTIFY_ALBUM_LOAD_LIMIT
        }
      });

      console.log('Spotify tracks: ', response.data.items);
      if (response.data.items.length === response.data.items.total) {
        setAllTracksLoaded(true);
      }

      setUserTracks(response.data.items);
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

      setUserPlaylists(response.data.items);
    } catch (error) {
      console.log(error);
      router.push('/connect');
    }
  };

  const getInitialDiscogsReleasesFromTracks = async () => {
    let releaseArray = [];
    let i = userTracksSearchIndex;

    //Load the array of releases from track albums until we have enough to fill the grid + 1
    while (
      releaseArray.length <
      trackGridDisplayIndex + trackGridDisplayCount + 1
    ) {
      // TODO
      // If i reaches userTracks.length, then we need to load more Spotify albums

      const currentTrack = userTracks[i].track;

      // If the current release array already includes this album, skip it
      if (
        releaseArray.findIndex(rel => {
          return rel.spotifyAlbumName == userTracks[i].track.album.name;
        }) === -1
      ) {
        let res = await getDiscogsRelease(userTracks[i].track.album);

        if (res) {
          const newTrackMatch = res;
          newTrackMatch.spotifyTrackName = currentTrack.name;
          releaseArray = [...releaseArray, newTrackMatch];
        }
        i++;
      } else {
        i++;
      }
    }

    //Then set the album search index to where we left off
    setUserTracksSearchIndex(i);
    // Initialize our matched releases array
    setMatchedTracks(releaseArray);
  };

  const loadNextDiscogsReleaseFromTrack = async () => {
    let releaseArray = matchedTracks;
    let i = userTracksSearchIndex;
    // When we run the function, get current userTracks
    let trks = userTracks;

    let foundMatch = false;

    const discogsGetter = async track => {
      let res = await getDiscogsRelease(track.track.album);
      if (res) {
        let newMatch = res;
        newMatch.spotifyTrackName = track.track.name;
        releaseArray = [...releaseArray, newMatch];
        foundMatch = true;
      }
    };

    const trackAlbumIsDuplicate = track => {
      return (
        releaseArray.findIndex(rel => {
          return rel.spotifyAlbumName == track.track.album.name;
        }) > -1
      );
    };

    while (!foundMatch) {
      // If i reaches userAlbums.length, then we need to load more Spotify albums
      if (i == userTracks.length) {
        // If we've already pulled all Spotify albums, just return - no more albums to search
        if (allTracksLoaded) {
          return;
        }
        // Otherwise get more from spotify
        else {
          trks = await getNextSpotifyUserTracks();
          // If track album is already in releaseArray, skip it
          if (!trackAlbumIsDuplicate(trks[i])) {
            await discogsGetter(trks[i]);
            i++;
          } else {
            i++;
          }
        }
      } else {
        // If track album is already in releaseArray, skip it
        if (!trackAlbumIsDuplicate(trks[i])) {
          await discogsGetter(trks[i]);
          i++;
        } else {
          i++;
        }
      }
    }

    // Then set the track search index to where we left off
    setUserTracksSearchIndex(i);
    // and update our matchedTracks
    setMatchedTracks(releaseArray);
  };

  const getNextSpotifyUserTracks = async () => {
    console.log('getNextSpotifyUserTracks triggered...');
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/tracks', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        params: {
          limit: SPOTIFY_ALBUM_LOAD_LIMIT,
          offset: userTracks.length
        }
      });

      if (
        userTracks.length + response.data.items.length ===
        response.data.items.total
      ) {
        setAllTracksLoaded(true);
      }

      let tempUserTracks = [...userTracks, ...response.data.items];
      console.log('Setting userTracks to ', tempUserTracks);
      setUserTracks(tempUserTracks);

      return tempUserTracks;
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

  const handleTrackGridForward = () => {
    if (trackGridDisplayIndex + trackGridDisplayCount < matchedTracks.length) {
      setTrackGridDisplayIndex(trackGridDisplayIndex + 1);
    }
  };
  const handleTrackGridReverse = () => {
    if (trackGridDisplayIndex > 0) {
      setTrackGridDisplayIndex(trackGridDisplayIndex - 1);
    }
  };
  const handleTrackGridMore = () => {
    if (trackGridDisplayCount < matchedReleases.length) {
      setTrackGridDisplayCount(trackGridDisplayCount + 1);
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
          />

          <section className={classes.releaseSection}>
            <div className={classes.releaseSection__headerWrapper}>
              <h3 className={classes.releaseSection__header}>
                From Tracks In Your Library
              </h3>
            </div>
            {matchedTracks.length > 0 ? (
              <ReleaseGrid
                releases={matchedTracks.slice(
                  trackGridDisplayIndex,
                  trackGridDisplayIndex + trackGridDisplayCount
                )}
                forward={() => handleTrackGridForward()}
                reverse={() => handleTrackGridReverse()}
                more={() => handleTrackGridMore()}
                width={width}
              />
            ) : (
              <Loader type="TailSpin" color="#999999" height={35} width={35} />
            )}
          </section>

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
