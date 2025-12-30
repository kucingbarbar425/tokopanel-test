"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { createPayment } from "@/app/actions/create-payment"
import { checkUserExists } from "@/app/actions/check-user-exists"
import { calculateCustomPrice, pricingConfig, validateSpecs } from "@/data/pricing"
import { formatRupiah } from "@/lib/utils"
import { Check, Info, User, Mail, Package, Loader2, HardDrive, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ConfirmationDialog } from "./confirmation-dialog"
import { StatusModal } from "./status-modal"
import { motion, AnimatePresence } from "framer-motion"

export default function PanelForm() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [selectedPlan, setSelectedPlan] = useState("custom")
  const [customRamGB, setCustomRamGB] = useState(1)
  const [customCpuPercent, setCustomCpuPercent] = useState(50)
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

    if (!username || !email) {
      toast({
        title: "Error",
        description: "Username dan email harus diisi",
        variant: "destructive",
      })
      return
    }

    // Validate custom specs
    const specValidation = validateSpecs(customRamGB, customCpuPercent)
    if (!specValidation.valid) {
      toast({
        title: "Error",
        description: specValidation.error,
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
      const result = await createPayment({
        type: "custom",
        ramGB: customRamGB,
        cpuPercent: customCpuPercent,
        username,
        email,
      })

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
            Konfigurasi Paket Custom
          </Label>
          
          {/* RAM Selection */}
          <div className="space-y-2 bg-dark-500 p-4 rounded-lg border border-dark-300">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <HardDrive className="w-4 h-4 text-blue-400" />
                RAM: {customRamGB} GB
              </Label>
              <span className="text-sm text-gray-400">Max: {pricingConfig.ram.maxGB} GB</span>
            </div>
            <Slider
              value={[customRamGB]}
              onValueChange={(value) => setCustomRamGB(value[0])}
              min={pricingConfig.ram.minGB}
              max={pricingConfig.ram.maxGB}
              step={pricingConfig.ram.step}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{pricingConfig.ram.minGB} GB</span>
              <span>{pricingConfig.ram.maxGB} GB</span>
            </div>
          </div>

          {/* CPU Selection */}
          <div className="space-y-2 bg-dark-500 p-4 rounded-lg border border-dark-300">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Zap className="w-4 h-4 text-yellow-400" />
                CPU: {customCpuPercent}%
              </Label>
              <span className="text-sm text-gray-400">Max: {pricingConfig.cpu.maxPercent}%</span>
            </div>
            <Slider
              value={[customCpuPercent]}
              onValueChange={(value) => setCustomCpuPercent(value[0])}
              min={pricingConfig.cpu.minPercent}
              max={pricingConfig.cpu.maxPercent}
              step={pricingConfig.cpu.step}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{pricingConfig.cpu.minPercent}%</span>
              <span>{pricingConfig.cpu.maxPercent}%</span>
            </div>
          </div>

          {/* Price Summary */}
          <motion.div
            className="bg-gradient-to-r from-red-500/10 to-red-600/10 p-4 rounded-lg border border-red-500/30"
            layout
          >
            <h4 className="font-medium text-white mb-3 flex items-center">
              <Info className="w-4 h-4 mr-2 text-red-500" />
              Ringkasan Paket
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Harga Dasar:</span>
                <span className="text-white">{formatRupiah(pricingConfig.basePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">RAM ({customRamGB} GB × {formatRupiah(pricingConfig.ram.pricePerGB)}/GB):</span>
                <span className="text-white">{formatRupiah(customRamGB * pricingConfig.ram.pricePerGB)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">CPU ({customCpuPercent}% × {formatRupiah(pricingConfig.cpu.pricePerPercent)}/%):</span>
                <span className="text-white">{formatRupiah(customCpuPercent * pricingConfig.cpu.pricePerPercent)}</span>
              </div>
              <div className="border-t border-red-500/30 pt-2 mt-2 flex justify-between font-bold">
                <span className="text-red-400">Total Harga:</span>
                <span className="text-red-400 text-lg">{formatRupiah(calculateCustomPrice(customRamGB, customCpuPercent))}</span>
              </div>
              <p className="text-xs text-gray-500 mt-3">*Harga untuk masa aktif ±1 bulan dengan garansi 10 hari</p>
            </div>
          </motion.div>


        </div>
      </form>

      {/* Floating Button */}
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
            `Beli Sekarang - ${formatRupiah(calculateCustomPrice(customRamGB, customCpuPercent))}`
          )}
        </Button>
      </motion.div>

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
        customSpecs={{
          ramGB: customRamGB,
          cpuPercent: customCpuPercent,
        }}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </>
  )
}
