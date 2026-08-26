import { type FC, useRef } from "react";
import { Printer, X } from "lucide-react";
import { type StudentInvoiceAttribute } from "@repo/contracts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SchoolReceipt, type SchoolReceiptData } from "./school-receipt";

interface SchoolReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: StudentInvoiceAttribute | null;
  receiptData?: SchoolReceiptData | null;
}

export const SchoolReceiptModal: FC<SchoolReceiptModalProps> = ({
  isOpen,
  onClose,
  invoice,
  receiptData,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || (!invoice && !receiptData)) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[95vh] max-w-xl p-0 overflow-hidden sm:rounded-2xl bg-white border border-slate-200 shadow-2xl">
        {/* Clean Light Modal Header */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-3.5 print:hidden">
          <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            School Receipt Preview (A5 Size)
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 h-8 text-xs font-semibold bg-white text-slate-700 hover:text-slate-900 border-slate-300 shadow-xs"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              Print (A5 Size)
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Receipt Container with clean neutral backdrop */}
        <div className="p-4 sm:p-6 flex justify-center bg-slate-100/70 overflow-y-auto max-h-[82vh] print:p-0 print:bg-white print:max-h-none">
          <div className="w-full max-w-[500px] shadow-sm rounded-xl overflow-hidden bg-white border border-slate-200/80 print:shadow-none print:border-none print:m-0 print:p-0">
            <SchoolReceipt
              ref={receiptRef}
              invoice={invoice || undefined}
              data={receiptData || undefined}
            />
          </div>
        </div>

        {/* Global Print Stylesheet for A5 Paper Size */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @media print {
              @page {
                size: A5 portrait;
                margin: 0;
              }
              body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-receipt, #printable-receipt * {
                visibility: visible !important;
              }
              #printable-receipt {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 148mm !important;
                min-height: 210mm !important;
                max-width: 148mm !important;
                margin: 0 !important;
                padding: 14mm 12mm !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `,
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
