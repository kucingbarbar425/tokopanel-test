"use server"

import clientPromise from "@/lib/mongodb"
import { appConfig } from "@/data/config"
import { plans } from "@/data/plans"

function normalizeKey(s: any) {
  if (!s) return ""
  return String(s).toLowerCase().trim().replace(/[\s,._-]+/g, "")
}

function findPlanForTransaction(transaction: any) {
  const planId = transaction?.planId ? normalizeKey(transaction.planId) : ""
  const planName = transaction?.planName ? normalizeKey(transaction.planName) : ""

  // Try exact id match first
  let plan = plans.find((p) => normalizeKey(p.id) === planId)
  if (plan) return plan

  // Try match by normalized name
  if (planName) {
    plan = plans.find((p) => normalizeKey(p.name) === planName)
    if (plan) return plan
  }

  // Try partial contains match on id or name
  if (planId) {
    plan = plans.find((p) => normalizeKey(p.id).includes(planId) || normalizeKey(p.name).includes(planId))
    if (plan) return plan
  }

  if (planName) {
    plan = plans.find((p) => normalizeKey(p.name).includes(planName) || normalizeKey(p.id).includes(planName))
    if (plan) return plan
  }

  return undefined
}

export async function getSuccessfulTransactions() {
  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    const paymentsCollection = db.collection("payments")

    const transactions = await paymentsCollection.find({}).sort({ createdAt: -1 }).limit(50).toArray()

    return transactions.map((transaction) => {
      const plan = findPlanForTransaction(transaction)

      return {
        transactionId: transaction.transactionId,
        email: maskEmail(transaction.email),
        planId: transaction.planId,
        planName: transaction.planName || (plan ? plan.name : "Unknown Plan"),
        total: transaction.total,
        createdAt: transaction.createdAt,
        status: transaction.status,
      }
    })
  } catch (error) {
    console.error("Error getting successful transactions:", error)
    return []
  }
}

export async function getTransactionById(transactionId: string) {
  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    const paymentsCollection = db.collection("payments")

    const transaction = await paymentsCollection.findOne({ transactionId })
    if (!transaction) {
      return null
    }

    if (transaction.replaceUsed === undefined) {
      await paymentsCollection.updateOne(
        { transactionId },
        { $set: { replaceUsed: 0 } }
      )
      transaction.replaceUsed = 0
    }

    const plan = findPlanForTransaction(transaction)

    return {
      ...transaction,
      planName: transaction.planName || (plan ? plan.name : "Unknown Plan"),
    }
  } catch (error) {
    console.error("Error getting transaction by ID:", error)
    return null
  }
}

export async function updateTransactionReplace(id: string) {
  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    const paymentsCollection = db.collection("payments")

    const trx = await paymentsCollection.findOne({ transactionId: id })
    if (!trx) return null

    const newReplaceUsed = (trx.replaceUsed || 0) + 1

    await paymentsCollection.updateOne(
      { transactionId: id },
      { $set: { replaceUsed: newReplaceUsed } }
    )

    return { success: true, replaceUsed: newReplaceUsed }
  } catch (error) {
    console.error("Error updating transaction replace:", error)
    return { success: false, error: error.message }
  }
}

function maskEmail(email: string): string {
  const [username, domain] = email.split("@")
  if (username.length <= 3) return `${username}***@${domain}`
  const visiblePart = username.substring(0, 3)
  return `${visiblePart}***@${domain}`
}
