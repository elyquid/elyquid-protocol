// Register: every external fact is exactly one record with a state of
// "stated" | "absent" | "unconfirmed". Nothing else in the code base hard-codes these facts.

export const register = {
  site: { state: 'stated', domain: 'elyquid.xyz', name: 'ELYQUID' },
  chain: {
    state: 'stated',
    name: 'Elysium',
    rpc: 'https://rpc.elysium.kinetiq.xyz',
    chainId: 99901,
    chainIdHex: '0x1863d',
    currency: 'HYPE',
    explorer: 'https://explorer.elysium.kinetiq.xyz',
  },
  // Contract address: absent until announced. Flip to { state: 'stated', value: '0x...' }.
  ca: { state: 'absent', value: '' },
  x: { state: 'stated', url: 'https://x.com/Enter_Elyquid' },
  github: { state: 'absent', url: '' },
  // Market source: independent of the contract address record.
  market: {
    state: 'stated',
    trending: 'https://api.geckoterminal.com/api/v2/networks/elysium/trending_pools',
    tokenLookup: 'https://api.dexscreener.com/latest/dex/tokens/',
  },
};

export const isStated = (rec) => !!rec && rec.state === 'stated';

// Derive the handle from the stored URL (never store it twice).
export function handleFromUrl(url) {
  try {
    const seg = new URL(url).pathname.split('/').filter(Boolean)[0];
    return seg ? '@' + seg : '';
  } catch {
    return '';
  }
}

// Gate: an EVM address is 0x + 40 hex digits. Mixed case (checksummed), all-lower and
// all-upper hex are all valid; the gate checks shape, it never rejects hex wholesale.
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

// 'live'        -> record stated and value well-formed
// 'invalid'     -> record stated but value malformed (treated as not live, flagged)
// 'absent'      -> nothing stated (or unconfirmed)
export function caGate(rec = register.ca) {
  if (!isStated(rec)) return 'absent';
  return EVM_ADDRESS.test((rec.value || '').trim()) ? 'live' : 'invalid';
}

export const caValue = () => (register.ca.value || '').trim();
