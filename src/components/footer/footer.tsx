// export default function Footer() {
//   return (
//     <footer>
//       <p>Footer</p>
//     </footer>
//   );
// }

import styles from "./footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <p className={styles.credit}>
          Created with ❤️ by Kim, Chris, Shanti, Grace, Sam and Monika
        </p>
      </div>
    </footer>
  );
}
