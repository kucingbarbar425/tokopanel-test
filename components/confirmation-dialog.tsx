"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatRupiah } from "@/lib/utils"
import { plans } from "@/data/plans"
import { calculateCustomPrice } from "@/data/pricing"
import { Loader2 } from "lucide-react"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId?: string
  customSpecs?: {
    ramGB: number
    cpuPercent: number
  }
  onConfirm: () => void
  isLoading: boolean
}

export function ConfirmationDialog({ 
  open, 
  onOpenChange, 
  planId, 
  customSpecs,
  onConfirm, 
  isLoading 
}: ConfirmationDialogProps) {
  const plan = planId ? plans.find((p) => p.id === planId) : null
  const isCustom = customSpecs !== undefined
  const title = isCustom ? "Paket Custom" : plan?.name || "Paket"
  const price = isCustom && customSpecs 
    ? calculateCustomPrice(customSpecs.ramGB, customSpecs.cpuPercent)
    : plan?.price || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-dark-400 border-dark-300 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-red-400">Konfirmasi Pembelian</DialogTitle>
          <DialogDescription className="text-gray-400">
            Anda akan membeli paket <span className="font-semibold text-white">{title}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-dark-500 p-4 rounded-lg border border-dark-300">
            <h3 className="font-medium text-white mb-2">Detail Paket</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {isCustom && customSpecs ? (
                <>
                  <div className="text-gray-400">RAM:</div>
                  <div className="font-medium text-white">{customSpecs.ramGB} GB</div>
                  <div className="text-gray-400">CPU:</div>
                  <div className="font-medium text-white">{customSpecs.cpuPercent}%</div>
                  <div className="text-gray-400">Harga:</div>
                  <div className="font-medium text-red-400">{formatRupiah(price)}</div>
                </>
              ) : plan ? (
                <>
                  <div className="text-gray-400">RAM:</div>
                  <div className="font-medium text-white">{plan.memory} MB</div>
                  <div className="text-gray-400">Disk:</div>
                  <div className="font-medium text-white">{plan.disk} MB</div>
                  <div className="text-gray-400">CPU:</div>
                  <div className="font-medium text-white">{plan.cpu}%</div>
                  <div className="text-gray-400">Harga:</div>
                  <div className="font-medium text-red-400">{formatRupiah(plan.price)}</div>
                </>
              ) : null}
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Dengan mengklik tombol "Lanjutkan Pembayaran", Anda akan diarahkan ke halaman pembayaran.
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-dark-500 border-dark-300 hover:bg-dark-600 text-white"
          >
            Batal
          </Button>
          <Button onClick={onConfirm} className="w-full sm:w-auto bg-red-600 hover:bg-red-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Lanjutkan Pembayaran"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
