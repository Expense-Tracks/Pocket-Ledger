import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSplitBill } from '@/contexts/SplitBillContext';
import { Camera, Upload, Receipt, Plus, Trash2 } from 'lucide-react';
import { scanReceipt } from '@/lib/receipt-scanner';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function SplitBill() {
  const navigate = useNavigate();
  const { bills, deleteBill } = useSplitBill();
  const [scanning, setScanning] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setScanning(true);
    try {
      const result = await scanReceipt(file);
      if (result.items.length === 0) {
        toast.error('No items found in receipt. Try a clearer photo or enter manually.');
        return;
      }
      // Navigate to new bill page with scanned data
      navigate('/split-bill/new', { state: { scannedData: result } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to scan receipt';
      toast.error(message);
    } finally {
      setScanning(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <h1 className="mb-4 text-2xl font-bold">Split Bill</h1>

        {/* Scan Options */}
        <div className="mb-6 grid gap-3">
          {/* Camera Input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Upload Input */}
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            onClick={() => cameraInputRef.current?.click()}
            disabled={scanning}
            className="h-auto flex-col gap-2 py-6"
            size="lg"
          >
            <Camera className="h-8 w-8" />
            <span>{scanning ? 'Scanning...' : 'Take Photo'}</span>
          </Button>

          <Button
            onClick={() => uploadInputRef.current?.click()}
            disabled={scanning}
            variant="outline"
            className="h-auto flex-col gap-2 py-6"
            size="lg"
          >
            <Upload className="h-8 w-8" />
            <span>Upload Receipt</span>
          </Button>

          <Button
            onClick={() => navigate('/split-bill/new')}
            variant="outline"
            className="h-auto flex-col gap-2 py-6"
            size="lg"
          >
            <Plus className="h-8 w-8" />
            <span>Create Manually</span>
          </Button>
        </div>

        {/* Recent Bills */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recent Bills</h2>
          
          {bills.length === 0 ? (
            <Card className="p-8 text-center">
              <Receipt className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No split bills yet. Scan a receipt or create one manually.
              </p>
            </Card>
          ) : (
            bills.map(bill => (
              <Card key={bill.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{bill.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {bill.people.length} people · {bill.items.length} items
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(bill.createdAt), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/split-bill/${bill.id}`)}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(bill.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Split Bill?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this split bill.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteId) {
                    deleteBill(deleteId);
                    toast.success('Bill deleted');
                    setDeleteId(null);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
