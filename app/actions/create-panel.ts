"use server"

import { Pterodactyl } from "@/lib/pterodactyl"
import { generatePassword } from "@/lib/utils"
import { sendPanelDetailsEmail } from "@/lib/email-service"
import { sendTelegramNotification } from "@/lib/telegram-service"
import { plans } from "@/data/plans"

type PanelData = {
  username: string
  email: string
  memory: number
  disk: number
  cpu: number
  planId: string
  createdAt: string
}

export async function createPanel(data: PanelData) {
  try {
    const { username, email, memory, disk, cpu, planId, createdAt } = data

    const password = generatePassword(10)
    const pterodactyl = new Pterodactyl()

    console.log(`Creating user ${username} with email ${email}...`)
    const userResponse = await pterodactyl.createUser(username, email, password)

    if (!userResponse.attributes) {
      throw new Error("Gagal membuat user: " + JSON.stringify(userResponse))
    }

    const userId = userResponse.attributes.id
    console.log(`User created successfully with ID: ${userId}`)

    const serverName = `${username}'s Server`
    console.log(`Creating server "${serverName}" for user ${userId}...`)

    const serverResponse = await pterodactyl.addServer(userId, serverName, memory, disk, cpu)

    if (!serverResponse.attributes) {
      await pterodactyl.deleteUser(userId)
      throw new Error("Gagal membuat server: " + JSON.stringify(serverResponse))
    }

    const serverId = serverResponse.attributes.id
    console.log(`Server created successfully with ID: ${serverId}`)

    const plan = plans.find((p) => p.id === planId)
    if (!plan) {
      throw new Error("Plan tidak ditemukan")
    }

    console.log(`Starting notification process for user ${username}...`)

    console.log(`Sending email notification to ${email}...`)
    sendPanelDetailsEmail(email, username, password, serverId, plan.name)
      .then((result) => {
        if (result.success) {
          console.log(`Email notification sent successfully to ${email}`)
        } else {
          console.error(`Failed to send email notification: ${result.error}`)
        }
      })
      .catch((error) => {
        console.error(`Exception when sending email: ${error}`)
      })

    console.log(`Sending Telegram notification for user ${userId}...`)
    sendTelegramNotification(userId, createdAt, plan.price, plan.name, email)
      .then((result) => {
        if (result.success) {
          console.log(`Telegram notification sent successfully for user ${userId}`)
        } else {
          console.error(`Failed to send Telegram notification: ${result.error}`)
        }
      })
      .catch((error) => {
        console.error(`Exception when sending Telegram notification: ${error}`)
      })

    console.log(`Panel creation process completed successfully`)
    return {
      success: true,
      userId: userId,
      serverId: serverId,
      password: password,
    }
  } catch (error) {
    console.error("Error creating panel:", error)
    throw new Error(error instanceof Error ? error.message : "Terjadi kesalahan saat membuat panel")
  }
}
