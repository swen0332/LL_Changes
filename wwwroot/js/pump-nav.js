/* =============================================================
   pump-nav.js  —  Navigation & Auto-Launch Handler
   - Clicking a vehicle from Garage opens Gas tab & auto-launches Pump UI
   - Fuel tab header shows History List
   - '+' and FAB buttons open Pump UI
   - '✕' button closes Pump UI and reveals History List
   ============================================================= */

(function () {
    'use strict';

    // Override viewVehicle so selecting a vehicle from Garage flags auto-launch
    window.viewVehicle = function (vehicleId, tab) {
        try {
            sessionStorage.setItem('autoLaunchPump_' + vehicleId, '1');
        } catch (e) { }
        window.location.href = '/Vehicle/Index?vehicleId=' + vehicleId + '&tab=gas';
    };

    function patchGarage() {
        if (typeof handleGarageItemClick === 'function') {
            window.handleGarageItemClick = function (e, vehicleId) {
                if (!$(e.target).hasClass('btn') && !$(e.target).hasClass('dropdown-item')) {
                    try {
                        sessionStorage.setItem('autoLaunchPump_' + vehicleId, '1');
                    } catch (err) { }
                    window.location.href = '/Vehicle/Index?vehicleId=' + vehicleId + '&tab=gas';
                }
            };
        }
    }

    patchGarage();
    document.addEventListener('DOMContentLoaded', patchGarage);
    window.addEventListener('load', patchGarage);

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
