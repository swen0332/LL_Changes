/* =============================================================
   pump-nav.js  —  Auto-open Gas Tab and Pump UI on vehicle selection
   ============================================================= */

(function () {
    'use strict';

    // Override viewVehicle so selecting a vehicle from Garage opens Gas tab with auto-pump flag
    window.viewVehicle = function (vehicleId, tab) {
        window.location.href = '/Vehicle/Index?vehicleId=' + vehicleId + '&tab=gas&pump=1';
    };

    function patchGarage() {
        if (typeof handleGarageItemClick === 'function') {
            window.handleGarageItemClick = function (e, vehicleId) {
                if (!$(e.target).hasClass('btn') && !$(e.target).hasClass('dropdown-item')) {
                    window.location.href = '/Vehicle/Index?vehicleId=' + vehicleId + '&tab=gas&pump=1';
                }
            };
        }
    }

    patchGarage();
    document.addEventListener('DOMContentLoaded', patchGarage);
    window.addEventListener('load', patchGarage);

})();
