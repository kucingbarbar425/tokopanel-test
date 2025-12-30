"use server"

import { Pterodactyl } from "@/lib/pterodactyl"

export async function checkUserExists(username: string, email: string) {
  try {
    const pterodactyl = new Pterodactyl()
    const users = await pterodactyl.listUsers()

    const usernameExists = users.some((user) => user.username.toLowerCase() === username.toLowerCase())

    const emailExists = users.some((user) => user.email.toLowerCase() === email.toLowerCase())

    return {
      success: true,
      usernameExists,
      emailExists,
    }
  } catch (error) {
    console.error("Error checking if user exists:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Terjadi kesalahan saat memeriksa ketersediaan username dan email",
    }
  }
}
