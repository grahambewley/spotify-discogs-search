import React from 'react';
import classes from '../../styles/MatchSection.module.css';
import Loader from 'react-loader-spinner';
import ReleaseGrid from '../ReleaseGrid/ReleaseGrid';
import axios from 'axios';

const SPOTIFY_ALBUM_LOAD_LIMIT = 20;

const AlbumMatch = ({
  accessToken,
  gridDisplayCount,
  width,
  getDiscogsRelease
}) => {
  const [userAlbums, setUserAlbums] = React.useState();
  // This is set to true when we determine we've pulled all of a user's Spotify albums
  const [allAlbumsLoaded, setAllAlbumsLoaded] = React.useState(false);
  const [userAlbumsSearchIndex, setUserAlbumsSearchIndex] = React.useState(0);
  const [matchedReleases, setMatchedReleases] = React.useState([]);
  const [albumGridDisplayIndex, setAlbumGridDisplayIndex] = React.useState(0);
  const [albumGridDisplayCount, setAlbumGridDisplayCount] = React.useState(
    gridDisplayCount
  );

  // If there is an accessToken but no album data, get user data
  React.useEffect(() => {
    if (accessToken) {
      getInitialSpotifyUserAlbums();
    }
  }, [accessToken]);

  React.useEffect(() => {
    if (gridDisplayCount) {
      setAlbumGridDisplayCount(gridDisplayCount);
    }
  }, [gridDisplayCount]);

  // Watch for userAlbums to be set/changed - get Discogs releases for albums
  React.useEffect(() => {
    if (userAlbums && userAlbumsSearchIndex == 0) {
      getInitialDiscogsReleases();
    }
  }, [userAlbums]);

  // Watch for albumGridDisplayIndex+albumGridDisplayCount to reach the end of the matchedReleases - then go get another
  React.useEffect(() => {
    // We have to have userAlbums already for any of this to matter...
    if (userAlbums) {
      // Make sure we have enough releases to display - get more if necessary
      if (
        albumGridDisplayIndex + albumGridDisplayCount ==
        matchedReleases.length
      ) {
        loadNextDiscogsRelease();
      }
    }
  }, [albumGridDisplayIndex, albumGridDisplayCount]);

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

  const getInitialDiscogsReleases = async () => {
    let releaseArray = [];
    let i = userAlbumsSearchIndex;

    // Load the array of releases until we have enough to fill the grid + 1
    while (
      releaseArray.length <
      albumGridDisplayIndex + albumGridDisplayCount + 1
    ) {
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

  const handleGridForward = () => {
    if (
      albumGridDisplayIndex + albumGridDisplayCount <
      matchedReleases.length
    ) {
      setAlbumGridDisplayIndex(albumGridDisplayIndex + 1);
    }
  };
  const handleGridReverse = () => {
    if (albumGridDisplayIndex > 0) {
      setAlbumGridDisplayIndex(albumGridDisplayIndex - 1);
    }
  };
  const handleGridMore = () => {
    if (albumGridDisplayCount < matchedReleases.length) {
      setAlbumGridDisplayCount(albumGridDisplayCount + 1);
    }
  };

  return (
    <section className={classes.releaseSection}>
      <div className={classes.releaseSection__headerWrapper}>
        <h3 className={classes.releaseSection__header}>
          From Albums In Your Library
        </h3>
      </div>
      {matchedReleases.length > 0 ? (
        <ReleaseGrid
          releases={matchedReleases.slice(
            albumGridDisplayIndex,
            albumGridDisplayIndex + albumGridDisplayCount
          )}
          forward={() => handleGridForward()}
          reverse={() => handleGridReverse()}
          more={() => handleGridMore()}
          width={width}
        />
      ) : (
        <Loader type="TailSpin" color="#999999" height={35} width={35} />
      )}
    </section>
  );
};

export default AlbumMatch;
