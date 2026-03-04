const BASE_RPC = 'https://mainnet.base.org';

export async function rpcCall(contract: string, data: string): Promise<string> {
  const res = await fetch(BASE_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [{ to: contract, data }, 'latest'],
      id: 1,
    }),
  });
  return (await res.json()).result;
}
