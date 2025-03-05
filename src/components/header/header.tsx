// export default function Header() {
//   return (
//     <header>
//       <h3>This is header</h3>
//     </header>
//   );
// }

import Image from "next/image"
import styles from "./header.module.css"

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <Image src="/logo.jpg" alt="MyMemories Logo" width={175} height={175} className={styles.logo} priority />
      </div>
      <h1 className={styles.title}>MyMemories</h1>
    </header>
  )
}

