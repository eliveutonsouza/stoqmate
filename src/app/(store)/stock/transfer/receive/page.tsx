import { TransferReceive } from '@/features/stock/transfer-receive';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data: transfer } = await supabase
    .from('transfers')
    .select(`
      id, reason, carrier, shipped_at,
      origin:stores!transfers_origin_store_id_fkey(id, name),
      destination:stores!transfers_destination_store_id_fkey(id, name),
      transfer_items(id, qty_sent, qty_received, product:products(id, sku, name, attrs, category:categories(id, name, code, icon, color)))
    `)
    .eq('status', 'dispatched')
    .order('shipped_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return <TransferReceive transfer={transfer ?? null} />;
}
