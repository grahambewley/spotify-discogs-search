import Head from 'next/head';
import classes from '../styles/Home.module.css';
import axios from 'axios';

export default function Home() {
  const redirectURI = encodeURI('http://localhost:3000/');

  return (
    <div className={classes.container}>
      <Head>
        <title>Spotify Discogs Search</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={classes.main}>
        <h1 className={classes.title}>Welcome to Spotify Discogs Search</h1>
        <p className={classes.description}>Find your Spotify music on vinyl</p>
        <a
          href={`https://accounts.spotify.com/authorize?client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}&redirect_uri=${redirectURI}&scope=user-read-private%20user-read-email&response_type=token`}
        >
          Log In With Spotify
        </a>
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
  );
}
