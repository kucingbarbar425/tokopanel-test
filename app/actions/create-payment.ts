"use server"

import { calculateFee, generateTransactionId } from "@/lib/utils"
import { plans } from "@/data/plans"
import { revalidatePath } from "next/cache"
import clientPromise from "@/lib/mongodb"
import { appConfig } from "@/data/config"
import type { ObjectId } from "mongodb"
import crypto from "crypto"

const SAKURU_API_ID = appConfig.pay.api_id
const SAKURU_API_KEY = appConfig.pay.api_key
const SAKURU_API_URL = "https://sakurupiah.id/api/create.php"

export interface PaymentData {
  _id?: ObjectId
  transactionId: string
  vpediaId: string
  planId?: string
  planName?: string
  customSpecs?: {
    ramGB: number
    cpuPercent: number
  }
  username: string
  email: string
  amount: number
  fee: number
  total: number
  qrImageUrl: string
  expirationTime: string
  status: "pending" | "paid" | "completed" | "failed"
  createdAt: string
}

export async function createPayment(
  paymentInput: 
    | string 
    | { type: "custom"; ramGB: number; cpuPercent: number; username: string; email: string },
  username?: string,
  email?: string,
) {
  try {
    let planId: string | undefined
    let customSpecs: { ramGB: number; cpuPercent: number } | undefined
    let finalUsername: string
    let finalEmail: string
    let finalPrice: number

    // Handle both old and new function signatures
    if (typeof paymentInput === "string") {
      // Old signature: createPayment(planId, username, email)
      planId = paymentInput
      finalUsername = username!
      finalEmail = email!

      const plan = plans.find((p) => p.id === planId)
      if (!plan) throw new Error("Plan tidak ditemukan")
      finalPrice = plan.price
    } else {
      // New signature: createPayment({ type: "custom", ramGB, cpuPercent, username, email })
      if (paymentInput.type !== "custom") throw new Error("Tipe pembayaran tidak dikenal")
      
      const { calculateCustomPrice } = await import("@/data/pricing")
      customSpecs = {
        ramGB: paymentInput.ramGB,
        cpuPercent: paymentInput.cpuPercent,
      }
      finalUsername = paymentInput.username
      finalEmail = paymentInput.email
      finalPrice = calculateCustomPrice(customSpecs.ramGB, customSpecs.cpuPercent)
    }

    const internalFee = calculateFee(finalPrice)
    const nominal = finalPrice + internalFee

    const transactionId = generateTransactionId()
    const method = "QRIS2"
    
    const signature = crypto
      .createHmac("sha256", SAKURU_API_KEY)
      .update(SAKURU_API_ID + method + transactionId + nominal)
      .digest("hex")

    const productName = customSpecs 
      ? `Panel Bot Custom (${customSpecs.ramGB}GB RAM, ${customSpecs.cpuPercent}% CPU)`
      : plans.find((p) => p.id === planId)?.name || "Panel Bot"

    const bodyData = new URLSearchParams()
    bodyData.append("api_id", SAKURU_API_ID)
    bodyData.append("method", method)
    bodyData.append("name", finalUsername)
    bodyData.append("email", finalEmail)
    bodyData.append("phone", "6280000000000") 
    bodyData.append("amount", nominal.toString())
    bodyData.append("merchant_fee", "1")
    bodyData.append("merchant_ref", transactionId)
    bodyData.append("expired", "24")
    bodyData.append("produk[]", productName)
    bodyData.append("qty[]", "1")
    bodyData.append("harga[]", finalPrice.toString())
    bodyData.append("callback_url", "https://panelshopv3.mts4you.biz.id/callback") 
    bodyData.append("return_url", "https://panelshopv3.mts4you.biz.id/invoice")
    bodyData.append("signature", signature)

    const response = await fetch(SAKURU_API_URL, {
      method: "POST",
      body: bodyData,
      headers: {
        Authorization: `Bearer ${SAKURU_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    const raw = await response.text()

    let json
    try {
      json = JSON.parse(raw)
    } catch {
      console.error("Sakurupiah returned NON-JSON:", raw)
      throw new Error("API Sakurupiah tidak mengembalikan JSON")
    }

    if (json.status !== "200") {
      throw new Error(json.message || "Gagal membuat invoice Sakurupiah")
    }

    const pay = json.data[0]
    const plan = planId ? plans.find((p) => p.id === planId) : undefined

    const paymentData: PaymentData = {
      transactionId,
      vpediaId: pay.trx_id,
      planId,
      planName: plan ? plan.name : undefined,
      customSpecs,
      username: finalUsername,
      email: finalEmail,
      amount: nominal,
      fee: internalFee,
      total: nominal,
      qrImageUrl: pay.qr,
      expirationTime: new Date(pay.expired).toISOString(),
      status: pay.payment_status === "pending" ? "pending" : "failed",
      createdAt: new Date().toISOString(),
    }

    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)

    await db.collection("payments").insertOne(paymentData)

    revalidatePath(`/invoice/${transactionId}`)

    return { success: true, transactionId }

  } catch (error) {
    console.error("Error createPayment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan",
    }
  }
}

export async function getPayment(transactionId: string): Promise<PaymentData | null> {
  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    const paymentsCollection = db.collection("payments")
    const payment = (await paymentsCollection.findOne({ transactionId })) as PaymentData | null
    return payment
  } catch (error) {
    console.error("Error getting payment:", error)
    return null
  }
}

export async function updatePaymentStatus(
  transactionId: string,
  status: "pending" | "paid" | "completed" | "failed",
  panelDetails?: {
    username: string
    password: string
    serverId: number
  },
): Promise<boolean> {
  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    const paymentsCollection = db.collection("payments")

    const updateData: Partial<PaymentData> = { status }
    if (panelDetails) updateData.panelDetails = panelDetails

    const result = await paymentsCollection.updateOne({ transactionId }, { $set: updateData })

    if (result.matchedCount > 0) {
      revalidatePath(`/invoice/${transactionId}`)
      return true
    }
    return false
  } catch (error) {
    console.error("Error updating payment status:", error)
    return false
  }
}
