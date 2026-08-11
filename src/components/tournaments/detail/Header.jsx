import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import styles from './Header.module.css';

export function Header({ tournamentName }) {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logoLink}>
        <div className={styles.logoPlaceholder} />
        <h1 className={styles.title}>{tournamentName}</h1>
      </Link>
      <button className={styles.menuButton} aria-label="Open menu">
        <Menu className="size-6" />
      </button>
    </header>
  );
}
