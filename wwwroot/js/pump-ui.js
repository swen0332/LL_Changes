/* =============================================================
   pump-ui.js  —  Gas Pump Entry Page Logic
   Handles: pump display input, odometer, slide-up drawer,
            save flow, success animation, PWA install prompt.
   ============================================================= */

(function () {
    'use strict';

    var _state = {
        cost: 0,
        gallons: 0,
        odometerValue: 0,
        prevOdo: 0
    };

    /* ── Odometer digit wheel animation ────────────────────────── */
    function setOdometerDisplay(value) {
        var digits = document.querySelectorAll('.odo-digit');
        if (!digits.length) return;
        var intVal = Math.max(0, Math.round(Number(value) || 0));
        var str = intVal.toString().padStart(6, '0');
        if (str.length > 6) {
            str = str.slice(-6); // take last 6 digits
        }
        digits.forEach(function (digitEl, i) {
            var newVal = str[i] || '0';
            var inner = digitEl.querySelector('.odo-digit-inner');
            if (inner) {
                var currentVal = inner.textContent.trim();
                if (currentVal !== newVal) {
                    inner.innerHTML = '<div class="odo-digit-value">' + newVal + '</div>';
                }
            }
        });
    }

    /* ── Live Computed Readout ─────────────────────────────────── */
    function updateComputedRow() {
        var mpgEl = document.getElementById('pump-computed-mpg');
        var ppgEl = document.getElementById('pump-computed-ppg');

        var costVal = parseFloat(document.getElementById('pump-input-cost')?.value) || 0;
        var galVal = parseFloat(document.getElementById('pump-input-gallons')?.value) || 0;
        var odoVal = parseInt(document.getElementById('pump-input-odometer')?.value, 10) || 0;

        _state.cost = costVal;
        _state.gallons = galVal;
        _state.odometerValue = odoVal;

        if (ppgEl) {
            if (galVal > 0 && costVal > 0) {
                ppgEl.querySelector('span').textContent = '$' + (costVal / galVal).toFixed(3) + '/gal';
            } else {
                ppgEl.querySelector('span').textContent = '---';
            }
        }

        if (mpgEl) {
            var prev = _state.prevOdo;
            var miles = odoVal - prev;
            if (prev > 0 && miles > 0 && galVal > 0) {
                mpgEl.querySelector('span').textContent = (miles / galVal).toFixed(1) + ' MPG';
            } else {
                mpgEl.querySelector('span').textContent = '---';
            }
        }
    }

    /* ── Slide-up drawer ────────────────────────────────────────── */
    function openDrawer() {
        var backdrop = document.getElementById('pump-drawer-backdrop');
        var drawer = document.getElementById('pump-drawer');
        if (backdrop) backdrop.classList.add('open');
        if (drawer) {
            drawer.classList.add('open');
            setTimeout(function () {
                var firstInput = drawer.querySelector('input, select');
                if (firstInput) firstInput.focus();
            }, 300);
        }
    }

    function closeDrawer() {
        var backdrop = document.getElementById('pump-drawer-backdrop');
        var drawer = document.getElementById('pump-drawer');
        if (backdrop) backdrop.classList.remove('open');
        if (drawer) drawer.classList.remove('open');
    }

    /* ── Validation ────────────────────────────────────────────── */
    function validateStep1() {
        var costInput = document.getElementById('pump-input-cost');
        var galInput = document.getElementById('pump-input-gallons');
        var odoInput = document.getElementById('pump-input-odometer');

        var costVal = parseFloat(costInput ? costInput.value : '0') || 0;
        var galVal = parseFloat(galInput ? galInput.value : '0') || 0;
        var odoVal = parseInt(odoInput ? odoInput.value : '0', 10) || 0;

        if (costVal <= 0) {
            alert('Please enter the total cost.');
            if (costInput) costInput.focus();
            return false;
        }
        if (galVal <= 0) {
            alert('Please enter the gallons.');
            if (galInput) galInput.focus();
            return false;
        }
        if (odoVal <= 0) {
            var ok = confirm('Odometer reading is empty or 0. Continue anyway?');
            if (!ok) {
                if (odoInput) odoInput.focus();
                return false;
            }
        }
        return true;
    }

    /* ── Save to LubeLogger API ─────────────────────────────────── */
    function saveRecord() {
        var vehicleId = (typeof GetVehicleId === 'function') ? GetVehicleId().vehicleId : 0;
        var dateInput = document.getElementById('pump-drawer-date');
        var fillFull = document.getElementById('pump-drawer-fillfull');
        var notes = document.getElementById('pump-drawer-notes');
        var tags = document.getElementById('pump-drawer-tags');

        var costVal = parseFloat(document.getElementById('pump-input-cost')?.value) || 0;
        var galVal = parseFloat(document.getElementById('pump-input-gallons')?.value) || 0;
        var odoVal = parseInt(document.getElementById('pump-input-odometer')?.value, 10) || 0;

        var gasDate = dateInput ? dateInput.value : new Date().toLocaleDateString('en-US');
        var isFillFull = fillFull ? fillFull.checked : true;
        var gasNotes = notes ? notes.value : '';
        var gasTags = tags ? (Array.isArray($(tags).val()) ? $(tags).val() : []) : [];

        var gasRecord = {
            id: 0,
            vehicleId: vehicleId,
            date: gasDate,
            mileage: odoVal,
            gallons: galVal.toString(),
            cost: costVal.toFixed(2),
            isFillToFull: isFillFull,
            missedFuelUp: false,
            notes: gasNotes,
            tags: gasTags,
            extraFields: []
        };

        var confirmBtn = document.getElementById('pump-drawer-confirm');
        if (confirmBtn) confirmBtn.disabled = true;

        $.post('/Vehicle/SaveGasRecordToVehicleId', { gasRecord: gasRecord }, function (data) {
            if (data && data.success) {
                closeDrawer();
                showSuccess(vehicleId);
            } else {
                if (confirmBtn) confirmBtn.disabled = false;
                alert('Error saving: ' + (data ? data.message : 'Unknown error'));
            }
        }).fail(function () {
            if (confirmBtn) confirmBtn.disabled = false;
            alert('Network error. Please try again.');
        });
    }

    /* ── Success animation then transition ──────────────────────── */
    function showSuccess(vehicleId) {
        var overlay = document.getElementById('pump-success-overlay');
        if (overlay) {
            overlay.classList.add('show');
        }
        setTimeout(function () {
            if (overlay) overlay.classList.remove('show');
            hidePumpEntry();
            if (typeof getVehicleGasRecords === 'function') {
                getVehicleGasRecords(vehicleId);
            }
        }, 1600);
    }

    /* ── Show / Hide Pump Entry ─────────────────────────────────── */
    window.showPumpEntry = function () {
        var vehicleId = (typeof GetVehicleId === 'function') ? GetVehicleId().vehicleId : 0;
        if (!vehicleId) return;

        $.get('/Vehicle/GetGasPumpEntryPartialView?vehicleId=' + vehicleId, function (html) {
            if (html) {
                var container = document.getElementById('pumpEntryContainer');
                var tableContainer = document.getElementById('gasRecordsTableContainer');
                if (container) {
                    container.innerHTML = html;
                    container.style.display = 'block';
                }
                if (tableContainer) {
                    tableContainer.style.display = 'none';
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    };

    window.hidePumpEntry = function () {
        var container = document.getElementById('pumpEntryContainer');
        var tableContainer = document.getElementById('gasRecordsTableContainer');
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }
        if (tableContainer) {
            tableContainer.style.display = 'block';
        }
    };

    /* ── PWA install prompt ──────────────────────────────────────── */
    var _deferredInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        _deferredInstallPrompt = e;
        var installBanner = document.getElementById('pump-install-banner');
        if (installBanner) installBanner.style.display = 'flex';
    });

    window.pumpShowInstallPrompt = function () {
        if (_deferredInstallPrompt) {
            _deferredInstallPrompt.prompt();
            _deferredInstallPrompt.userChoice.then(function () {
                _deferredInstallPrompt = null;
                var banner = document.getElementById('pump-install-banner');
                if (banner) banner.style.display = 'none';
            });
        }
    };

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/js/pump-sw.js').catch(function () { });
        }
    }

    /* ── Main init (called when _GasPumpEntry.cshtml loads) ─────── */
    window.initPumpUI = function (options) {
        options = options || {};
        var vehicleId = options.vehicleId || 0;
        var lastOdometer = options.lastOdometer || 0;

        _state.prevOdo = lastOdometer;
        _state.odometerValue = lastOdometer;

        // Populate initial odometer display
        setOdometerDisplay(lastOdometer);

        // Odometer direct input listener
        var odoInput = document.getElementById('pump-input-odometer');
        if (odoInput) {
            odoInput.addEventListener('input', function () {
                var val = parseInt(odoInput.value, 10) || 0;
                setOdometerDisplay(val);
                updateComputedRow();
            });
        }

        // Pump cost and gallons listeners
        var costInput = document.getElementById('pump-input-cost');
        if (costInput) {
            costInput.addEventListener('input', updateComputedRow);
        }

        var galInput = document.getElementById('pump-input-gallons');
        if (galInput) {
            galInput.addEventListener('input', updateComputedRow);
        }

        // Step 1 save button
        var saveBtn = document.getElementById('pump-save-step1');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                if (validateStep1()) openDrawer();
            });
        }

        // Drawer backdrop click closes drawer
        var backdrop = document.getElementById('pump-drawer-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', closeDrawer);
        }

        // Drawer confirm button
        var confirmBtn = document.getElementById('pump-drawer-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', saveRecord);
        }

        // Initialize date to today
        var dateInput = document.getElementById('pump-drawer-date');
        if (dateInput) {
            var today = new Date();
            var mm = String(today.getMonth() + 1).padStart(2, '0');
            var dd = String(today.getDate()).padStart(2, '0');
            var yyyy = today.getFullYear();
            dateInput.value = mm + '/' + dd + '/' + yyyy;
        }

        updateComputedRow();
        registerServiceWorker();

        // Focus cost input on load
        setTimeout(function () {
            if (costInput) costInput.focus();
        }, 150);
    };

    window.pumpCloseDrawer = closeDrawer;

})();
