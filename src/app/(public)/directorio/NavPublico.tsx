"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./NavPublico.module.css";

export default function NavPublico() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className={styles.nav}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link href="/" className={styles.logo}>
        Viko<span className={styles.dot}>.</span>
      </Link>

      <div className={`${styles.collapsed} ${open ? styles.hidden : ""}`}>
        <button className={styles.acceder} onClick={() => setOpen(true)}>
          Acceder
        </button>
      </div>

      <div className={`${styles.expanded} ${open ? styles.visible : ""}`}>
        <div className={styles.links}>
          <a href="#grid" className={styles.link}>Emprendimientos</a>
          <Link href="/login" className={styles.link}>Acceso emprendedores</Link>
          <Link href="/feed" className={styles.link}>Comunidad</Link>
          <a href="#faq" className={styles.link}>Preguntas frecuentes</a>
        </div>
        <Link href="/register" className={styles.publicar}>
          Publicar
        </Link>
      </div>
    </nav>
  );
}