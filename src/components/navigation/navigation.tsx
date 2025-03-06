// import Link from "next/link";
// import styles from "./navigation.module.css";

// export default function Navigation() {
//   return (
//     <nav>
//       <ul className={styles.navList}>
//         <li>
//           <Link href="/">Home</Link>
//         </li>
//         <li>
//           <Link href="/timeline">Timeline</Link>
//         </li>
//         <li>
//           <Link href="/about">About</Link>
//         </li>
//         <li>
//           <Link href="/calendar">Calendar</Link>
//         </li>
//         <li>
//           <Link href="/tree">Tree</Link>
//         </li>
//         <li>
//           <Link href="/assistant">Assistant</Link>
//         </li>
//       </ul>
//     </nav>
//   );
// }

import Link from "next/link";
import styles from "./navigation.module.css";
import LogoutButton from "../auth/LogOutButton";

export default function Navigation() {
  return (
    <nav className={styles.navigation}>
      <ul className={styles.navList}>
        <div className={styles.navItemsContainer}>
          <li className={styles.navItem}>
            <Link href="/home" className={styles.navLink}>
              Home
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/about" className={styles.navLink}>
              About Me
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/timeline" className={styles.navLink}>
              Timeline
            </Link>
          </li>
          {/* <li className={styles.navItem}>
            <Link href="/tree" className={styles.navLink}>
              Family Tree
            </Link>
          </li> */}
          <li className={styles.navItem}>
            <Link href="/calendar" className={styles.navLink}>
              Calendar
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/assistant" className={styles.navLink}>
              Assistant
            </Link>
          </li>
        </div>
        <li className={`${styles.navItem} ${styles.navItemRight}`}>
          <LogoutButton />
        </li>
      </ul>
    </nav>
  );
}
