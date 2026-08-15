/* =============================================================
   pump-nav.js  —  Auto-open Gas Tab and Pump UI on vehicle selection
   ============================================================= */

(function () {
    'use strict';

    // Override viewVehicle so selecting a vehicle always opens the Gas tab
    window.viewVehicle = function (vehicleId, tab) {
        window.location.href = '/Vehicle/Index?vehicleId=' + vehicleId + '&tab=gas';
    };

    function patchGarage() {
        if (typeof handleGarageItemClick === 'function') {
            window.handleGarageItemClick = function (e, vehicleId) {
                window.location.href = '/Vehicle/Index?vehicleId=' + vehicleId + '&tab=gas';
            };
        }
    }

    patchGarage();
    document.addEventListener('DOMContentLoaded', patchGarage);
    window.addEventListener('load', patchGarage);

})();
