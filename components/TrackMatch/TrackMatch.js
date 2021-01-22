import React from 'react';
import classes from '../../styles/MatchSection.module.css';
import Loader from 'react-loader-spinner';
import ReleaseGrid from '../ReleaseGrid/ReleaseGrid';
import axios from 'axios';

const SPOTIFY_ALBUM_LOAD_LIMIT = 20;

const TrackMatch = ({
  accessToken,
  gridDisplayCount,
  width,
  getDiscogsRelease
}) => {
  const [userTracks, setUserTracks] = React.useState();
  const [matchedTracks, setMatchedTracks] = React.useState([]);
  const [allTracksLoaded] = React.useState(false);
  const [userTracksSearchIndex, setUserTracksSearchIndex] = React.useState(0);
  const [trackGridDisplayIndex, setTrackGridDisplayIndex] = React.useState(0);
  const [trackGridDisplayCount, setTrackGridDisplayCount] = React.useState(
    gridDisplayCount
  );

  // If there is an accessToken but no track data, get track data
  React.useEffect(() => {
    if (accessToken) {
      getInitialSpotifyTracks();
    }
  }, [accessToken]);

  React.useEffect(() => {
    if (gridDisplayCount) {
      setTrackGridDisplayCount(gridDisplayCount);
    }
  }, [gridDisplayCount]);

  // Watch for userTracks to be set/changed - get Discogs releases for tracks
  React.useEffect(() => {
    if (userTracks && userTracksSearchIndex == 0) {
      getInitialDiscogsReleasesFromTracks();
    }
  }, [userTracks]);

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

      if (response.data.items.length === response.data.items.total) {
        setAllTracksLoaded(true);
      }

      setUserTracks(response.data.items);
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
    if (trackGridDisplayCount < matchedTracks.length) {
      setTrackGridDisplayCount(trackGridDisplayCount + 1);
    }
  };

  return (
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
  );
};

export default TrackMatch;
