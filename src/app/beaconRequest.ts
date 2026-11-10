export type BeaconRequest =
  | { type: 'balance'; nonce: number }
  | { type: 'transactions'; nonce: number }
  | { type: 'clarify'; term: string; nonce: number }
