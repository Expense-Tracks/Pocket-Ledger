import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AmountInput } from '@/components/AmountInput';
import { useSplitBill } from '@/contexts/SplitBillContext';
import { useSettings } from '@/contexts/SettingsContext';
import { ReceiptItem, Person } from '@/types/splitbill';
import { Plus, Trash2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

const PERSON_COLORS = [
  'hsl(220, 60%, 50%)', 'hsl(160, 60%, 42%)', 'hsl(4, 72%, 56%)',
  'hsl(38, 92%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(190, 70%, 45%)',
];

export default function NewSplitBill() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addBill } = useSplitBill();
  const { formatCurrency } = useSettings();
  
  const scannedData = location.state?.scannedData;

  const [billName, setBillName] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [tax, setTax] = useState('0');
  const [taxPercent, setTaxPercent] = useState('');
  const [useTaxPercent, setUseTaxPercent] = useState(false);
  const [tip, setTip] = useState('0');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newPersonName, setNewPersonName] = useState('');

  useEffect(() => {
    if (scannedData) {
      setItems(scannedData.items.map((item: any) => ({
        id: crypto.randomUUID(),
        ...item,
        assignedTo: [],
      })));
      setTax(scannedData.tax?.toString() || '0');
      if (scannedData.taxPercent) {
        setTaxPercent(scannedData.taxPercent.toString());
        setUseTaxPercent(true);
      }
      setTip(scannedData.tip?.toString() || '0');
      toast.success('Receipt scanned! Review and assign items.');
    }
  }, [scannedData]);

  const addItem = () => {
    if (!newItemName || !newItemPrice) {
      toast.error('Enter item name and price');
      return;
    }
    const price = parseFloat(newItemPrice);
    const qty = parseInt(newItemQty) || 1;
    if (isNaN(price) || price <= 0) {
      toast.error('Invalid price');
      return;
    }
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      name: newItemName,
      price,
      quantity: qty,
      assignedTo: [],
    }]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemQty('1');
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const addPerson = () => {
    if (!newPersonName.trim()) {
      toast.error('Enter person name');
      return;
    }
    setPeople(prev => [...prev, {
      id: crypto.randomUUID(),
      name: newPersonName.trim(),
      color: PERSON_COLORS[prev.length % PERSON_COLORS.length],
    }]);
    setNewPersonName('');
  };

  const removePerson = (id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id));
    setItems(prev => prev.map(item => ({
      ...item,
      assignedTo: item.assignedTo.filter(pid => pid !== id),
    })));
  };

  const togglePersonForItem = (itemId: string, personId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const assigned = item.assignedTo.includes(personId);
      return {
        ...item,
        assignedTo: assigned
          ? item.assignedTo.filter(id => id !== personId)
          : [...item.assignedTo, personId],
      };
    }));
  };

  const handleSave = () => {
    if (!billName.trim()) {
      toast.error('Enter bill name');
      return;
    }
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    if (people.length === 0) {
      toast.error('Add at least one person');
      return;
    }

    const unassigned = items.filter(i => i.assignedTo.length === 0);
    if (unassigned.length > 0) {
      toast.error(`Assign all items to people (${unassigned.length} unassigned)`);
      return;
    }

    addBill({
      name: billName,
      items,
      people,
      tax: parseFloat(tax) || 0,
      taxPercent: useTaxPercent && taxPercent ? parseFloat(taxPercent) : undefined,
      tip: parseFloat(tip) || 0,
    });

    toast.success('Bill saved!');
    navigate('/split-bill');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <h1 className="mb-4 text-2xl font-bold">New Split Bill</h1>

        {/* Bill Name */}
        <Card className="mb-4 p-4">
          <Label>Bill Name</Label>
          <Input
            value={billName}
            onChange={e => setBillName(e.target.value)}
            placeholder="e.g., Dinner at Restaurant"
            className="mt-2"
          />
        </Card>

        {/* People */}
        <Card className="mb-4 p-4">
          <h3 className="mb-3 font-semibold">People</h3>
          <div className="mb-3 flex gap-2">
            <Input
              value={newPersonName}
              onChange={e => setNewPersonName(e.target.value)}
              placeholder="Person name"
              onKeyDown={e => e.key === 'Enter' && addPerson()}
            />
            <Button onClick={addPerson} size="icon">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {people.map(person => (
              <Badge
                key={person.id}
                style={{ backgroundColor: person.color }}
                className="gap-1 text-white"
              >
                {person.name}
                <button onClick={() => removePerson(person.id)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </Card>

        {/* Items */}
        <Card className="mb-4 p-4">
          <h3 className="mb-3 font-semibold">Items</h3>
          <div className="mb-3 grid grid-cols-[2fr_1fr_auto_auto] gap-2">
            <Input
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              placeholder="Item name"
            />
            <AmountInput
              value={newItemPrice}
              onChange={setNewItemPrice}
              placeholder="0"
            />
            <Input
              type="number"
              value={newItemQty}
              onChange={e => setNewItemQty(e.target.value)}
              placeholder="Qty"
              className="w-16"
            />
            <Button onClick={addItem} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {people.map(person => (
                    <Badge
                      key={person.id}
                      variant={item.assignedTo.includes(person.id) ? 'default' : 'outline'}
                      style={item.assignedTo.includes(person.id) ? { backgroundColor: person.color } : {}}
                      className="cursor-pointer"
                      onClick={() => togglePersonForItem(item.id, person.id)}
                    >
                      {person.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tax & Tip */}
        <Card className="mb-4 p-4">
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Tax</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseTaxPercent(!useTaxPercent)}
                  className="h-auto p-0 text-xs"
                >
                  {useTaxPercent ? 'Use Amount' : 'Use Percentage'}
                </Button>
              </div>
              {useTaxPercent ? (
                <div className="flex items-center gap-2">
                  <AmountInput
                    value={taxPercent}
                    onChange={setTaxPercent}
                    placeholder="e.g., 10"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              ) : (
                <AmountInput
                  value={tax}
                  onChange={setTax}
                  placeholder="0"
                />
              )}
            </div>
            <div>
              <Label>Tip</Label>
              <AmountInput
                value={tip}
                onChange={setTip}
                placeholder="0"
                className="mt-2"
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/split-bill')} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save & View Split
          </Button>
        </div>
      </div>
    </div>
  );
}
