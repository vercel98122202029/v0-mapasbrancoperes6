"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export function LogoAnimado() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex items-center gap-3"
    >
      <motion.div
        animate={{
          rotate: [0, 2, -2, 0],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="relative"
      >
        <div className="absolute inset-0 bg-lime-400 rounded-full blur-md opacity-20 animate-pulse" />
        <div className="relative">
          <Image
            src="/logo-branco-peres.png"
            alt="Branco Peres Logo"
            width={48}
            height={48}
            className="rounded-full"
            priority
          />
        </div>
      </motion.div>

      <div>
        <motion.h1
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-2xl font-bold bg-gradient-to-r from-lime-400 to-orange-500 bg-clip-text text-transparent"
        >
          Mapas Branco Peres
        </motion.h1>
        <motion.p
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-sm text-slate-400"
        >
          Sistema Agrícola Avançado
        </motion.p>
      </div>
    </motion.div>
  )
}
