import Head from 'next/head';
import classes from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={classes.container}>
      <Head>
        <title>Spotify Discogs Search</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={classes.main}>
        <h1 className={classes.title}>Welcome to Spotify Discogs Search</h1>

        <p className={classes.description}>Find your Spotify music on vinyl</p>
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
