@verbatim
<!doctype html>
<html lang="my">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#192c40">
<title>ပွဲရုံ · Version 2 · Remaining Stock Purchase Update</title>
<link rel="stylesheet" href="/css/source/workspace-base.css">
<link rel="stylesheet" href="/css/source/workspace-theme.css">
<link rel="stylesheet" href="/css/source/workflow-pages.css">
<link rel="stylesheet" href="/css/source/pricing-bag-basis.css">
<link rel="stylesheet" href="/css/source/myanmar-fonts.css">

<link rel="stylesheet" href="/css/source/payables-and-receivables.css">
</head>
<body>
<aside id="sidebar" aria-label="အဓိကလုပ်ငန်းများ"></aside>
<div id="navOverlay" class="overlay" onclick="toggleNav(false)"></div>
<div id="app">
<header class="v2-header">
 <div class="v2-header-inner">
  <button class="v2-brand" onclick="navigate(state.role==='owner'?'owner':'home')" aria-label="ပင်မမျက်နှာပြင်သို့">
   <span class="brandmark"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V3M12 8C7 8 6 5 6 3c4 0 6 2 6 5ZM12 13c-5 0-6-3-6-5 4 0 6 2 6 5ZM12 10c5 0 6-3 6-5-4 0-6 2-6 5ZM12 16c5 0 6-3 6-5-4 0-6 2-6 5Z"/></svg></span>
   <strong>ပွဲရုံ</strong>
  </button>
  <nav id="topNav" aria-label="အဓိကလုပ်ငန်းများ"></nav>
  <div class="v2-role"><span class="avatar" id="avatar" aria-hidden="true">စ</span>
   <select id="roleSelect" aria-label="စမ်းသပ်မည့် အသုံးပြုသူမြင်ကွင်း" title="မြင်ကွင်းပြောင်းရန်" onchange="changeRole(this.value)"><option value="staff">စာရေးမ</option><option value="owner">ပိုင်ရှင်</option></select>
  </div> 
 </div>
</header>
    <main id="main" tabindex="-1"></main>
</div>
<div id="modalRoot" role="dialog" aria-modal="true" aria-labelledby="modalTitle" onclick="if(event.target===this)closeModal()"></div>
<div id="toast" role="status" aria-live="polite"></div>
<div id="printArea" class="print-only"></div>

<link rel="stylesheet" href="/css/source/transaction-forms.css">
@endverbatim
<meta name="csrf-token" content="{{ csrf_token() }}">
<script>window.__PWE_BOOT__={{ Illuminate\Support\Js::from($bootstrap) }};</script>
@verbatim
<script src="/js/server-bootstrap.js"></script>
<script id="remaining-purchase-receiving-helpers2" src="/js/source/receipt-quantity-helpers.js"></script>
<script src="/js/source/workspace-core.js"></script>
<script src="/js/source/workspace-pages.js"></script>
<script src="/js/source/master-data-settings.js"></script>
<script src="/js/source/receiving-and-supplier-forms.js"></script>
<script src="/js/source/transaction-workflows.js"></script>

<script src="/js/source/deduction-rate-masters.js"></script>


<script src="/js/source/purchase-deduction-fields.js"></script>

<script src="/js/source/purchase-labor-section.js"></script>


<script src="/js/source/purchase-single-labor-row.js"></script>


<link rel="stylesheet" href="/css/source/deduction-master-editor.css">
<script src="/js/source/deduction-editor-layout.js"></script>



<link rel="stylesheet" href="/css/source/deduction-calculation-modes.css">
<script src="/js/source/deduction-calculation-modes.js"></script>

<script src="/js/source/receiving-carriage-advances.js"></script>


<link rel="stylesheet" href="/css/source/labor-master-components.css">
<script src="/js/source/labor-rate-and-mael-masters.js"></script>


<script src="/js/source/labor-settings-navigation.js"></script>


<link rel="stylesheet" href="/css/source/labor-master-horizontal-layout.css">
<script src="/js/source/labor-master-editors.js"></script>


<link rel="stylesheet" href="/css/source/labor-fixed-mael.css">
<script src="/js/source/labor-fixed-mael.js"></script>


<link rel="stylesheet" href="/css/source/labor-master-panel-grid.css">


<link rel="stylesheet" href="/css/source/labor-master-lists.css">
<script src="/js/source/labor-master-lists.js"></script>



<script src="/js/source/labor-rate-editor-actions.js"></script>


<script src="/js/source/sale-pricing-charges.js"></script>

<script src="/js/source/sale-product-warehouse-batch-selectors.js"></script>


<script src="/js/source/sale-stock-ownership.js"></script>



<script src="/js/source/warehouse-master.js"></script>

<link rel="stylesheet" href="/css/source/warehouse-master.css">


<script src="/js/source/partner-detail-ledger.js"></script>
<link rel="stylesheet" href="/css/source/partner-detail-ledger.css">


<link rel="stylesheet" href="/css/source/notebook.css">
<script src="/js/source/notebook.js"></script>

<link rel="stylesheet" href="/css/source/weight-input-hints.css">

<script src="/js/source/weight-input-hints.js"></script>
<link rel="stylesheet" href="/css/source/partner-statement-form.css">
<link rel="stylesheet" href="/css/source/statement-partner-search.css">
<link rel="stylesheet" href="/css/source/myanmar-workspace-typography.css"><script src="/js/source/workspace-navigation-layout.js"></script><script src="/js/source/supplier-advances-and-loans.js"></script>
<link rel="stylesheet" href="/css/source/purchase-raw-bag-count.css">
<script src="/js/source/purchase-bag-count-snapshots.js"></script>

<link rel="stylesheet" href="/css/source/purchase-received-bag-count.css">
<script src="/js/source/purchase-bag-pricing.js"></script>

<link rel="stylesheet" href="/css/source/purchase-charge-breakdown.css">
<script src="/js/source/purchase-charge-breakdown.js"></script>

<script src="/js/source/sale-source-traceability.js"></script>

<link rel="stylesheet" href="/css/source/sale-opening-guidance.css">
<script src="/js/source/sale-opening-guidance.js"></script>
<link rel="stylesheet" href="/css/source/sale-bag-weight-conversion.css">
<script src="/js/source/sale-bag-weight-conversion.js"></script>

<link rel="stylesheet" href="/css/source/purchase-weight-conversion.css">
<script src="/js/source/purchase-weight-conversion.js"></script>
<link rel="stylesheet" href="/css/source/inventory-packaging-form.css">
<script src="/js/source/inventory-packaging-workflow.js"></script>
<link rel="stylesheet" href="/css/source/package-type-master.css">
<script src="/js/source/package-type-master.js"></script>

<link rel="stylesheet" href="/css/source/cash-funding-and-transfers.css">
<script src="/js/source/cash-funding-and-transfers.js"></script>
<link rel="stylesheet" href="/css/source/profit-loss-report.css">
<script src="/js/source/profit-loss-calculations.js"></script>

<link rel="stylesheet" href="/css/source/daily-closing-components.css">
<script src="/js/source/daily-closing.js"></script>

<link rel="stylesheet" href="/css/source/purchase-sale-voucher-layout.css">
<script src="/js/source/purchase-bag-planning.js"></script>

<link rel="stylesheet" href="/css/source/purchase-recoverable-expenses.css">
<script src="/js/source/purchase-recoverable-expenses.js"></script>

<link rel="stylesheet" href="/css/source/supplier-loan-and-service-fee.css">
<link rel="stylesheet" href="/css/source/workspace-components.css">

<script src="/js/source/service-fee-fields.js"></script>
<script src="/js/source/cash-request-settlement.js"></script>

<link rel="stylesheet" href="/css/source/home-quick-actions.css">

<link rel="stylesheet" href="/css/source/stock-check-review.css">
<script src="/js/source/stock-check-review.js"></script>

<link rel="stylesheet" href="/css/source/workspace-navigation-layout.css">


<script src="/js/source/sale-fee-summary.js"></script>

<link rel="stylesheet" href="/css/source/account-visibility-settings.css">
<script src="/js/source/cash-opening-permissions.js"></script>

<link rel="stylesheet" href="/css/source/initial-opening-workflow.css">
<script id="opening69Script" src="/js/source/initial-opening-workflow.js"></script>

<link rel="stylesheet" href="/css/source/partner-master-list.css">

<script id="sale-selectors72" src="/js/source/sale-ownership-selectors.js"></script>
<link rel="stylesheet" href="/css/source/sale-stock-selectors.css">

<script id="sale-source73" src="/js/source/sale-source-receiving-links.js"></script>
<link rel="stylesheet" href="/css/source/sale-source-receiving-links.css">

<link rel="stylesheet" href="/css/source/trader-settlement-components.css">
<script id="trader-settlement74" src="/js/source/trader-settlement.js"></script>

<link rel="stylesheet" href="/css/source/trader-settlement-layout.css">

<link rel="stylesheet" href="/css/source/sale-source-picker.css">
<script id="sale-source76" src="/js/source/sale-source-picker.js"></script>


<link rel="stylesheet" href="/css/source/stock-ownership-filters.css">

<link rel="stylesheet" href="/css/source/packaging-tab-layout.css">
<script id="batch-packaging79" src="/js/source/packaging-tab-layout.js"></script>

<link rel="stylesheet" href="/css/source/stock-adjustment-tab-layout.css">
<script id="stock-adjustment80" src="/js/source/stock-adjustment-tab-layout.js"></script>

<link rel="stylesheet" href="/css/source/stock-name-date-filters.css">
<link rel="stylesheet" href="/css/source/stock-bag-count-display.css">
<script id="stock-bag-counts-version2" src="/js/source/stock-bag-count-display.js"></script>
<script id="stock-name-date81" src="/js/source/stock-name-date-filters.js"></script>

<link rel="stylesheet" href="/css/source/warehouse-transfer-tab-layout.css">
<script id="warehouse-transfer82" src="/js/source/warehouse-transfer-tab-layout.js"></script>

<link rel="stylesheet" href="/css/source/stock-ledger-date-filter.css">
<script id="stock-ledger-date83" src="/js/source/stock-ledger-date-filter.js"></script>

<script id="owner-overview-date84" src="/js/source/owner-overview-date-layout.js"></script>



<link rel="stylesheet" href="/css/source/cash-workspace-layout.css">
<script id="cash-workspace-version2" src="/js/source/cash-workspace-layout.js"></script>



<link rel="stylesheet" href="/css/source/statement-layout.css">
<script id="statement-version2" src="/js/source/statement-layout.js"></script>



<link rel="stylesheet" href="/css/source/cash-navigation-tabs.css">



<link rel="stylesheet" href="/css/source/profit-loss-layout.css">
<script id="profit-ui-version2" src="/js/source/profit-loss-layout.js"></script>



<link rel="stylesheet" href="/css/source/settings-overview-grid.css">

<link rel="stylesheet" href="/css/source/statement-navigation-tabs.css">

<link rel="stylesheet" href="/css/source/daily-closing-layout.css">

<link rel="stylesheet" href="/css/source/language-switcher.css">

<script id="language-switch-version2" src="/js/source/language-switcher.js"></script>

<link rel="stylesheet" href="/css/source/owner-password-dialog.css">



<link rel="stylesheet" href="/css/source/dispatch-entry-units.css">

<script id="dispatch-unit-dropdown-version2" src="/js/source/dispatch-entry-units.js"></script>

<link rel="stylesheet" href="/css/source/dispatch-balance-history.css">

<script id="dispatch-history-version2" src="/js/source/dispatch-balance-history.js"></script>

<link rel="stylesheet" href="/css/source/dispatch-history-layout.css">

<script id="dispatch-direct-history-time-version2" src="/js/source/direct-delivery-timestamps.js"></script>
<link rel="stylesheet" href="/css/source/opening-cash-review.css">
<script id="opening-pending-work-version2" src="/js/source/opening-cash-review.js"></script>
<script id="clean-start-version2" src="/js/source/workspace-clean-start-guide.js"></script>
<link rel="stylesheet" href="/css/source/packaging-history-detail.css">
<script id="packaging-history-detail-version2" src="/js/source/packaging-history-detail.js"></script>
<link rel="stylesheet" href="/css/source/receipt-line-editing.css">
<script id="receipt-line-edit-version2" src="/js/source/receipt-line-editing.js"></script>
<link rel="stylesheet" href="/css/source/warehouse-transfer-units.css">
<script id="warehouse-transfer-units-version2" src="/js/source/warehouse-transfer-units.js"></script>
<link rel="stylesheet" href="/css/source/stock-lot-adjustment.css">
<script id="lot-stock-adjustment-version2" src="/js/source/stock-lot-adjustment.js"></script>
<link rel="stylesheet" href="/css/source/physical-stock-counts.css">
<script id="physical-stock-check-version2" src="/js/source/physical-stock-counts.js"></script>
<link rel="stylesheet" href="/css/source/receipt-list-filters.css">
<script id="receipt-search-filters-version2" src="/js/source/receipt-list-filters.js"></script>
<link rel="stylesheet" href="/css/source/sale-list-filters.css">
<script id="sale-search-filters-version2" src="/js/source/sale-list-filters.js"></script>
<link rel="stylesheet" href="/css/source/purchase-additions-and-deductions.css">
<script id="purchase-add-subtract-version2" src="/js/source/purchase-additions-and-deductions.js"></script>
<link rel="stylesheet" href="/css/source/purchase-adjustment-selector.css">
<script id="purchase-adjustment-dropdown-version2" src="/js/source/purchase-adjustment-selector.js"></script>
<link rel="stylesheet" href="/css/source/sale-adjustment-selector.css">
<script id="sale-adjustment-dropdown-version2" src="/js/source/sale-adjustment-selector.js"></script>
<link rel="stylesheet" href="/css/source/receipt-payment-totals.css">
<script id="receipt-payment-totals-version2" src="/js/source/receipt-payment-totals.js"></script>
<link rel="stylesheet" href="/css/source/receiving-vehicle-fields.css">
<script id="receipt-vehicle-ui-version2" src="/js/source/receiving-vehicle-fields.js"></script>
<link rel="stylesheet" href="/css/source/receipt-packaging-evidence.css">
<script id="purchase-packaging-link-version2" src="/js/source/receipt-packaging-evidence.js"></script>

<link rel="stylesheet" href="/css/source/sold-receipt-purchase-guard.css">
<script id="sold-receipt-purchase-guard-version2" src="/js/source/sold-receipt-purchase-guard.js"></script>

<link rel="stylesheet" href="/css/source/remaining-stock-purchase.css">
<script id="remaining-receipt-purchase-version2" src="/js/source/remaining-stock-purchase.js"></script>

<link rel="stylesheet" href="/css/source/stock-ledger-details.css">
<script id="stock-ledger-detail-version2" src="/js/source/stock-ledger-details.js"></script>
<link rel="stylesheet" href="/css/adjustment-rate-dialog.css">
<link rel="stylesheet" href="/css/opening-product-picker.css">
<script src="/js/server-bridge.js"></script><script src="/js/service-rate-settings.js"></script><script src="/js/opening-product-picker.js"></script><script src="/js/loan-interest-policies.js"></script><script src="/js/server-reports.js"></script><link rel="stylesheet" href="/css/list-pagination.css"><script src="/js/list-pagination.js"></script><link rel="stylesheet" href="/css/opening-cash-flow.css"><script src="/js/opening-cash-flow.js"></script><script src="/js/opening-excel-import.js"></script><script src="/js/money-input-format.js"></script></body>
</html>

@endverbatim
