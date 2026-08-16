/* =============================================================
   pump-nav.js  —  Navigation & Auto-Launch Handler
   - Clicking a vehicle from Garage opens Gas tab & auto-launches Pump UI
   - Fuel tab header shows History List
   - '+' and FAB buttons open Pump UI
   - '✕' button closes Pump UI and reveals History List
   ============================================================= */

(function () {
    'use strict';

    // Clicking the Fuel tab header directly returns to the history list if pump is currently open
    $(document).on('click', '#gas-tab', function () {
        var container = document.getElementById('pumpEntryContainer');
        var tableContainer = document.getElementById('gasRecordsTableContainer');
        if (container && tableContainer && container.style.display !== 'none') {
            if (typeof hidePumpEntry === 'function') {
                hidePumpEntry();
            }
        }
    });

})();
