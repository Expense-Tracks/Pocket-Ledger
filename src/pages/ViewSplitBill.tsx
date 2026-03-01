import { useParams, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useSplitBill } from '@/contexts/SplitBillContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { PersonTotal } from '@/types/splitbill';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

export default function ViewSplitBill() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bills } = useSplitBill();
  const { formatCurrency, settings } = useSettings();
  const exportRef = useRef<HTMLDivElement>(null);

  const bill = bills.find(b => b.id === id);

  if (!bill) {
    return (
      <div className="min-h-screen bg-background p-4">
        <p>Bill not found</p>
        <Button onClick={() => navigate('/split-bill')}>Go Back</Button>
      </div>
    );
  }

  // Calculate split
  const subtotal = bill.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate tax based on percentage or fixed amount
  const calculatedTax = bill.taxPercent 
    ? (subtotal * bill.taxPercent / 100)
    : bill.tax;
  
  const total = subtotal + calculatedTax + bill.tip;

  const personTotals: PersonTotal[] = bill.people.map(person => {
    const personItems = bill.items
      .filter(item => item.assignedTo.includes(person.id))
      .map(item => {
        const shareCount = item.assignedTo.length;
        const itemTotal = item.price * item.quantity;
        return {
          name: item.name,
          price: itemTotal / shareCount,
          quantity: item.quantity,
          shared: shareCount > 1,
        };
      });

    const personSubtotal = personItems.reduce((sum, item) => sum + item.price, 0);
    const personTax = (personSubtotal / subtotal) * calculatedTax;
    const personTip = (personSubtotal / subtotal) * bill.tip;
    const personTotal = personSubtotal + personTax + personTip;

    return {
      personId: person.id,
      personName: person.name,
      items: personItems,
      subtotal: personSubtotal,
      tax: personTax,
      tip: personTip,
      total: personTotal,
    };
  });

  const exportAsImage = async () => {
    if (!exportRef.current) return;

    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: settings.theme === 'dark' ? '#0a0a0a' : '#ffffff',
        scale: 2,
      });

      canvas.toBlob(blob => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${bill.name.replace(/\s+/g, '-')}-split.png`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('Image downloaded!');
      });
    } catch (error) {
      toast.error('Failed to export image');
      console.error(error);
    }
  };

  const shareImage = async () => {
    if (!exportRef.current) return;

    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: settings.theme === 'dark' ? '#0a0a0a' : '#ffffff',
        scale: 2,
      });

      canvas.toBlob(async blob => {
        if (!blob) return;

        const file = new File([blob], `${bill.name}-split.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: bill.name,
            text: 'Split bill breakdown',
          });
          toast.success('Shared!');
        } else {
          // Fallback to download
          exportAsImage();
        }
      });
    } catch (error) {
      toast.error('Failed to share');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/split-bill')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Export Actions */}
        <div className="mb-4 flex gap-2">
          <Button onClick={shareImage} className="flex-1 gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button onClick={exportAsImage} variant="outline" className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>

        {/* Exportable Content */}
        <div ref={exportRef} className="space-y-4 rounded-xl bg-background p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{bill.name}</h1>
            <p className="text-sm text-muted-foreground">Split Bill Summary</p>
          </div>

          {/* Total Summary */}
          <Card className="border-2 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {calculatedTax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tax {bill.taxPercent && `(${bill.taxPercent}%)`}
                  </span>
                  <span className="font-medium">{formatCurrency(calculatedTax)}</span>
                </div>
              )}
              {bill.tip > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tip</span>
                  <span className="font-medium">{formatCurrency(bill.tip)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-base">
                <span className="font-semibold">Total</span>
                <span className="font-bold">{formatCurrency(total)}</span>
              </div>
            </div>
          </Card>

          {/* Per Person Breakdown */}
          {personTotals.map(pt => {
            const person = bill.people.find(p => p.id === pt.personId);
            return (
              <Card key={pt.personId} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Badge
                    style={{ backgroundColor: person?.color }}
                    className="text-base text-white"
                  >
                    {pt.personName}
                  </Badge>
                  <span className="text-xl font-bold">
                    {formatCurrency(pt.total)}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {pt.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-foreground">
                      <span>
                        {item.name}
                        {item.shared && <span className="ml-1 text-xs text-muted-foreground">(shared)</span>}
                      </span>
                      <span>{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatCurrency(pt.subtotal)}</span>
                    </div>
                    {pt.tax > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax</span>
                        <span>{formatCurrency(pt.tax)}</span>
                      </div>
                    )}
                    {pt.tip > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tip</span>
                        <span>{formatCurrency(pt.tip)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          <p className="text-center text-xs text-muted-foreground">
            Generated by Pocket Ledger
          </p>
        </div>
      </div>
    </div>
  );
}
