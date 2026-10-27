# Historical testing regression matrix

Read source: `PweYon_testingDocumentation.pdf`, 24 pages, SHA256 `178c131fdb8683f8f5075e8550a51cf4c1298c935dab6ec6cb0eadaa67653fe2`. The exact file was recovered from `C:\Users\Sai\Downloads\Telegram Desktop`; the exact-name copy under `Desktop\Testing\ပွဲရုံ` has the same hash. It was copied into this workspace without changing the original HTML or workflow PDF. Extracted text is in `reference/extracted/PweYon_testingDocumentation.txt`.

The document repeats case 6 and skips several numbers. The unnumbered payment failure after case 18 is labeled **18 follow-up** here; no missing case was invented. Historical Pass/Fail refers to the old prototype only. The new results below are scoped to the identified automated checks. Complete visual/browser acceptance of each historical case remains outstanding unless separately recorded in evidence.

| PDF case / pages | Historical finding | New implementation evidence and limits |
|---|---|---|
| 1 / 1 | Opening cash comparison, discrepancy reason; Pass | MySQL opening discrepancy and daily carry-forward PASS; discrepancy does not silently change money. Full visual comparison pending. |
| 2 / 1–2 | Product, grade, standard-bag setup; Pass | Historical master setup and prices regression PASS. Source-shaped setup navigation smoke PASS. Complete edit/inactivation UI matrix pending. |
| 3 / 2 | Supplier/customer setup, including combined kind; Pass | Separate supplier/buyer persistence tested. Combined-kind expectation conflicts with final HTML; see decisions below. |
| 4 / 3 | Cash account create/edit, opening amount and visibility; Pass | Account CRUD and hidden account authorization PASS. New account setup posts no cash automatically; balances require opening approval. |
| 5 / 3–4 | Expense reason create/edit; Pass | Reason creation/edit persistence PASS. Complete UI edit/inactivation verification pending. |
| 6 / 4–5, repeated | Receiving before purchase stays trader-owned; Pass | MySQL receipt/purchase and raw unknown-weight regressions PASS; receiving form contract PASS. |
| 7 / 6 | 10,000 advance; Pass | Advance covering a 10,000 purchase without another cash movement PASS. |
| 8 / 7 | Daily A/B/C prices; Pass | Staff price save and projected date/value persistence PASS. Complete grade UI matrix pending. |
| 9 / 7–8 | Pricing/purchase, advance offsets; Pass | Exact purchase charges, advance and loan recovery tests PASS. Full mixed form combinations pending. |
| 10 / 8–9 | Waiting/paid/remaining purchase statuses; Pass | Persisted net/paid/outstanding and payment allocations tested; full status-label UI combinations pending. |
| 11 / 9 | Purchase search; Pass | DOM actual source search matches and excludes records correctly PASS. |
| 12 / 10 | Immediate delivery, partial payment; Pass | Immediate dispatch reduces physical stock once; partial payment/collection tests PASS. Combined real form scenario still needs acceptance. |
| 13 / 10–11 | Unpaid held goods become buyer-owned; Pass | Held-sale ownership, zero initial collection, no resale of buyer-owned stock PASS. |
| 14 / 11 | Later delivery, no second sale; Pass | Multiple partial dispatches and opening buyer-stock dispatch without sale/cash PASS. |
| 15 / 12 | Later receivable collection; Pass | Partial request reconciliation, later-day collection date and overcollection rejection PASS. |
| 16 / 13 | Delivery and payment statuses independent; Pass | Separate lot dispatch and document paid values covered; all visual badge combinations not yet tested. |
| 17 / 14 | Cash in/out ledger; Pass | Exact debit/credit balances, date, rollback and single cash effect per voucher PASS. Full ledger visual comparison pending. |
| 18 / 15 | Payable/receivable details, repeated payments; Pass | Outstanding balances, line allocation, repeated collections and independent-connection overcollection guard PASS. Detailed statement tab comparison pending. |
| 18 follow-up / 15–16 | Automatic home funding/payment failure; Fail | Final source excludes home from daily payment choices. MySQL home-payment/self-transfer rejection and explicit home-request partial receipts PASS. Old automatic-funding expectation superseded. |
| 20 / 16–17 | Pay purchase from business cash; Pass | Native MySQL purchase/partial payment, balance decrease and same-intent retry PASS. |
| 21 / 17–18 | Expense 20,000; marked Pass, narrative questions unrelated home increase | Isolated 20,000 expense leaves home unchanged PASS. Expense and independently confirmed transfer remain separate. |
| 23 / 18 | Loose/packaged/current total; Pass | Current stock 1,000 = loose 800 + packaged 200, independent of owner date range, PASS. |
| 24 / 19 | Packaging and history; Pass | Weight conservation, parent/receipt/warehouse references PASS. Physical print/visual history acceptance pending. |
| 25 / 20 | Stock ledger purchase/pack in/out; Pass | Server physical/ownership separation and conservation tests PASS. Older movement labels differ from final HTML. Complete filtered historical balances, particularly unknown weights, pending. |
| 26 / 21 | Signed stock adjustment; Pass | +10/−5 gives 1,505; positive display magnitude, direction, signed historical delta and receipt link PASS. |
| 31 / 21–22 | Owner Today purchase incorrectly zero; Fail | Receipt dated 24th, purchase dated 25th: Today 800,000, prior day zero; saved standard-bag snapshot survives master edit. MySQL and source owner-card DOM regressions PASS. |
| 34 / 22–23 | Current stock incorrectly zero under Today; Fail | Current loose/package/total remains 800/200/1,000 across date filters; MySQL and source DOM regressions PASS. |
| 35 / 23–24 | Provisional profit: 1,178,333 − 232,038 − 20,000 = 926,295; Pass | Recomputed from newly inserted MySQL documents with exact server decimals PASS. No historical numbers imported as production data. Final HTML commission classification governs trader sales. |

Source conflicts resolved by the user's stated priority:

- Case 3 describes a party usable in both roles. Final HTML `partners(kind)` filters exact `supplier` and `buyer` records. This implementation preserves those two roles and the final forms; no combined-party module was invented.
- The 18 follow-up expects automatic home funding when the chosen payment account is short. Final source `aOpts` excludes home from ordinary payment choices and provides explicit home requests and confirmed transfers. Insufficient cash fails atomically; a separate confirmed transfer supplies funds. Home-to-home transfer is rejected clearly.
- Case 21's home increase is disputed in its own narrative. An expense debits only its selected account. An actual separate transfer has its own linked records; an expense never invents one.
- Case 25 refers to purchase confirmation and packaging as stock in/out. Final source distinguishes physical receiving/dispatch from ownership conversion and packaging. Purchase and packaging conserve global physical stock; their history remains visible without adding duplicate stock.
- Case 35's simple arithmetic is retained as a regression, while later HTML P&L overrides govern service fees, trader commissions, recoverable outlays and loan-principal exclusions. The report remains explicitly provisional.

See `TEST_RESULTS.md` and `evidence/` for newly executed results. None of the old document's Pass labels are counted toward the new suite totals.
