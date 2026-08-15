/* =============================================================
   pump-nav.js  —  Auto-open Gas Tab and Pump UI on vehicle selection
   Loaded on every page (via _Layout.cshtml injection).
   Overrides handleGarageItemClick after garage.js loads.
   ============================================================= */

(function () {
    'use strict';

    function checkPumpTabParam() {
        var url = new URL(window.location.href);
        if (url.searchParams.get('pumpTab') === 'gas') {
            url.searchParams.delete('pumpTab');
            window.history.replaceState({}, '', url.toString());

            function triggerGasTabAndPump() {
                var gasTabBtn = document.getElementById('gas-tab');
                if (gasTabBtn) {
                    gasTabBtn.click();
                    // Wait for gas tab content to load, then show pump UI
                    var checkInterval = setInterval(function () {
                        var container = document.getElementById('pumpEntryContainer');
                        if (container) {
                            clearInterval(checkInterval);
                            if (typeof window.showPumpEntry === 'function') {
                                window.showPumpEntry();
                            }
                        }
                    }, 80);
                    setTimeout(function () { clearInterval(checkInterval); }, 4000);
                } else {
                    setTimeout(triggerGasTabAndPump, 100);
                }
            }

            triggerGasTabAndPump();
        }
    }

    function patchGarageClick() {
        if (typeof handleGarageItemClick === 'function') {
            window.handleGarageItemClick = function (el, vehicleId) {
                window.location.href = '/Vehicle/Index?vehicleId=' + vehicleId + '&pumpTab=gas';
            };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            patchGarageClick();
            checkPumpTabParam();
        });
    } else {
        patchGarageClick();
        checkPumpTabParam();
    }

    window.pumpNavCheckTab = checkPumpTabParam;

})();
