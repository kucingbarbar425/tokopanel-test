"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPayment } from "@/app/actions/create-payment"
import { checkUserExists } from "@/app/actions/check-user-exists"
import { plans } from "@/data/plans"
import { formatRupiah } from "@/lib/utils"
import { Check, Info, User, Mail, Package, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ConfirmationDialog } from "./confirmation-dialog"
import { StatusModal } from "./status-modal"
import { motion, AnimatePresence } from "framer-motion"

export default function PanelForm() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [selectedPlan, setSelectedPlan] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"success" | "error" | "info" | "loading">("info")
  const [modalTitle, setModalTitle] = useState("")
  const [modalMessage, setModalMessage] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !email || !selectedPlan) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Format email tidak valid",
        variant: "destructive",
      })
      return
    }

    setIsValidating(true)

    try {
      // Show loading modal
      setModalType("loading")
      setModalTitle("Memeriksa Ketersediaan")
      setModalMessage("Sedang memeriksa ketersediaan username dan email di panel...")
      setShowModal(true)

      // Check if username or email already exists
      const result = await checkUserExists(username, email)

      if (!result.success) {
        throw new Error(result.error || "Gagal memeriksa ketersediaan username dan email")
      }

      if (result.usernameExists) {
        setModalType("error")
        setModalTitle("Username Sudah Terdaftar")
        setModalMessage("Username yang Anda masukkan sudah terdaftar di panel. Silakan gunakan username lain.")
        return
      }

      if (result.emailExists) {
        setModalType("error")
        setModalTitle("Email Sudah Terdaftar")
        setModalMessage("Email yang Anda masukkan sudah terdaftar di panel. Silakan gunakan email lain.")
        return
      }

      // Close the modal and show confirmation dialog
      setShowModal(false)
      setShowConfirmation(true)
    } catch (error) {
      setModalType("error")
      setModalTitle("Terjadi Kesalahan")
      setModalMessage(error instanceof Error ? error.message : "Terjadi kesalahan saat memeriksa ketersediaan")
    } finally {
      setIsValidating(false)
    }
  }

  const handleConfirm = async () => {
    setIsLoading(true)

    try {
      const result = await createPayment(selectedPlan, username, email)

      if (!result.success) {
        throw new Error(result.error)
      }

      router.push(`/invoice/${result.transactionId}`)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
      setShowConfirmation(false)
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 pb-6">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-base font-medium flex items-center gap-2">
            <User className="w-4 h-4 text-red-500" />
            Username
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukan Tanpa Spasi!!"
              required
              className="h-14 text-base pl-10 bg-dark-500 border-dark-300 focus:border-red-500 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-medium flex items-center gap-2">
            <Mail className="w-4 h-4 text-red-500" />
            Email
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Mail className="w-5 h-5 text-gray-500" />
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukan Alamat Email!!"
              required
              className="h-14 text-base pl-10 bg-dark-500 border-dark-300 focus:border-red-500 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <Package className="w-4 h-4 text-red-500" />
            Pilih Paket
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                layout
                className={`relative rounded-lg border-2 cursor-pointer transition-all duration-300 overflow-hidden ${
                  selectedPlan === plan.id
                    ? "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20 col-span-1 md:col-span-2"
                    : "bg-dark-500 border-dark-300 hover:border-red-500/50 p-4"
                }`}
                whileHover={selectedPlan !== plan.id ? { scale: 1.02 } : {}}
                whileTap={selectedPlan !== plan.id ? { scale: 0.98 } : {}}
              >
                <div className={selectedPlan === plan.id ? "p-4" : ""}>
                  {selectedPlan === plan.id && (
                    <div className="absolute top-4 right-4 bg-red-500 rounded-full p-1 z-10">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-white text-sm flex-1 pr-2">{plan.name}</h3>
                  </div>
                  <div className="text-red-400 font-bold mb-2">{formatRupiah(plan.price)}</div>
                  <div className="text-xs text-gray-400 space-y-1 mb-3">
                    <div>💾 RAM: {plan.memory} MB</div>
                    <div>🗄️ Disk: {plan.disk} MB</div>
                    <div>⚙️ CPU: {plan.cpu}%</div>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2">{plan.description}</p>

                  {selectedPlan === plan.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t border-red-500/30"
                    >
                      <h4 className="font-medium text-white mb-3 flex items-center">
                        <Info className="w-4 h-4 mr-2 text-red-500" />
                        Detail Paket Lengkap
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div className="text-gray-400">RAM:</div>
                        <div className="font-medium text-white">{plan.memory} MB</div>
                        <div className="text-gray-400">Disk:</div>
                        <div className="font-medium text-white">{plan.disk} MB</div>
                        <div className="text-gray-400">CPU:</div>
                        <div className="font-medium text-white">{plan.cpu}%</div>
                        <div className="text-gray-400">Harga:</div>
                        <div className="font-medium text-red-400">{formatRupiah(plan.price)}</div>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{plan.description}</p>
                      <div>
                        <h5 className="text-sm font-medium text-white mb-2">Fitur Paket:</h5>
                        <ul className="space-y-1">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start text-sm">
                              <Check className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-300">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </form>

      {/* Floating Button - Only show when plan is selected */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-dark-600 via-dark-600 to-transparent pt-4 pb-6 px-4 z-40"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 h-14 text-lg font-medium transition-all duration-300 ease-in-out transform hover:scale-[1.02] shadow-2xl"
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memeriksa...
                </>
              ) : (
                "Beli Sekarang"
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <StatusModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
      />

      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        planId={selectedPlan}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </>
  )
}
