import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={variants} initial="hidden" animate="visible" exit="exit">
      {children}
    </motion.div>
  )
}
