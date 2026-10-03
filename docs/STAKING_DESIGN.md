# Funded lock specification

Terms are whole 1–24 program months, each 30 days. Annual token rate is 1% × 10^((M-1)/23), rounded down to integer ppm. Term reward Q = floor(P × annual_rate_ppm(M) × M / 12,000,000). It is 20% at 24 months. Full Q is escrowed on admission; reject zero rewards or insufficient capacity. No mature fee, fee offset or minting. Positions hold principal and reward separately, bound to the recorded owner and vault, without transfer or admin sweep.

Early reward is net_reward(P, whole elapsed months), zero before one month, capped at Q. Early fee = floor(P × 500 × remaining_ms / (10000 × duration_ms)), reaching zero at maturity. Split 50% pending burn / 40% Community / 10% founder; burn and founder floor, Community receives dust. Payout is P minus fee plus earned; unused Q returns to rewards. No extra accrual after maturity.

Close does not take Currency. Burn shares accumulate in pending_burn. Permissionless flush_burns consumes that balance through Currency and increments actually burned. Pending inventory is separate from reward capacity and remains total supply until flushed.

Accounting: rewards + reward_committed + reward_paid == reward_funded. Pausing only stops deposits. Anyone may fund with existing V1PR. There is no admin withdrawal path. Shared-object schemas and scoped events match the frontend. Network gas is separate.
