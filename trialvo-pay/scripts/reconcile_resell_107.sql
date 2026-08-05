-- Reconcile stuck RESELL-107 payment after EPS Success was rejected by CheckStatus 302.
-- Merchant TX: 1785734896932550808
-- EPS TX:      260803112729513IK
-- Order:       RESELL-107-1785734650952
--
-- Run ONLY after reviewing. Take a fresh DB backup first.
-- This marks the paid attempt as success + bill paid. IPN must be re-dispatched
-- from the app (or ResellAPI activated manually) after this.

BEGIN;

-- Mark the EPS-success attempt as success and fill blank gateway fields
UPDATE transactions
SET
  status = 'success',
  eps_transaction_id = '260803112729513IK',
  eps_financial_entity = COALESCE(NULLIF(eps_financial_entity, ''), 'Nagad'),
  gateway_response_raw = COALESCE(gateway_response_raw, '{}'::jsonb) || jsonb_build_object(
    'reconciled', true,
    'EPSTransactionId', '260803112729513IK',
    'Status', 'Success',
    'MerchantTransactionId', '1785734896932550808',
    'note', 'Manual reconcile: EPS Success callback was rejected due to CheckStatus HTTP 302'
  ),
  callback_received_at = COALESCE(callback_received_at, TIMESTAMPTZ '2026-08-03 05:30:49+00'),
  verified_at = COALESCE(verified_at, NOW()),
  completed_at = COALESCE(completed_at, NOW()),
  failed_at = NULL,
  updated_at = NOW()
WHERE eps_merchant_tx_id = '1785734896932550808'
  AND status IN ('processing', 'initiated');

-- Expire sibling retry attempts on the same bill/order
UPDATE transactions
SET
  status = 'failed',
  gateway_error_code = COALESCE(gateway_error_code, 'SUPERSEDED'),
  gateway_error_message = COALESCE(gateway_error_message, 'Superseded by successful EPS payment 1785734896932550808'),
  failed_at = COALESCE(failed_at, NOW()),
  updated_at = NOW()
WHERE eps_customer_order_id = 'RESELL-107-1785734650952'
  AND eps_merchant_tx_id <> '1785734896932550808'
  AND status IN ('processing', 'initiated');

-- Mark bill paid
UPDATE bills
SET
  status = 'paid',
  paid_at = COALESCE(paid_at, TIMESTAMPTZ '2026-08-03 05:30:49+00'),
  expired_at = NULL,
  updated_at = NOW()
WHERE id = '5c69f756-17be-407e-bdd9-51703b677431'
  AND status <> 'paid';

INSERT INTO transaction_events (transaction_id, event_type, old_status, new_status, event_data, source)
SELECT id, 'manual_reconcile', 'processing', 'success',
       jsonb_build_object(
         'EPSTransactionId', '260803112729513IK',
         'reason', 'EPS merchant dashboard Success; local CheckStatus HTTP 302 rejected callback'
       ),
       'ops'
FROM transactions
WHERE eps_merchant_tx_id = '1785734896932550808';

COMMIT;

-- After commit: activate subscription in ResellAPI for order RESELL-107 / customer onekjinis@gmail.com
-- or re-dispatch payment.success IPN from Trialvo Pay once the fixed build is deployed.
