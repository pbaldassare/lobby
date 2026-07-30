import styles from './page.module.css';

/** Minimal scaffold page — staff/domain UI comes later. */
export default function HomePage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Lobby</h1>
      <p className={styles.subtitle}>Backoffice scaffold is ready.</p>
    </main>
  );
}
