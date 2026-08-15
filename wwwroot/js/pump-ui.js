/* =============================================================
   pump-ui.js  —  Gas Pump Entry Page Logic
   Handles: pump display input, direct typable odometer,
            cost / gallon formatting, slide-up drawer, API save.
   ============================================================= */

(function () {
    'use strict';

    var _state = {
        cost: 0,
        gallons: 0,
        odometerValue: 0,
        prevOdo: 0
    };

    /* ── Odometer digit wheel display ──────────────────────────── */
    function setOdometerDisplay(value) {
        var digits = document.querySelectorAll('.odo-digit');
        if (!digits.length) return;
        var intVal = Math.max(0, Math.round(Number(value) || 0));
        var str = intVal.toString().padStart(6, '0');
        if (str.length > 6) {
            str = str.slice(-6);
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

    /* ── Cost Input Sanitizer & Formatter ──────────────────────── */
    // Max 3 digits before decimal, max 2 digits after decimal (0.00 - 999.99)
    function sanitizeCostInput(val) {
        var cleaned = val.replace(/[^0-9.]/g, '');
        var parts = cleaned.split('.');
        if (parts.length > 2) {
            cleaned = parts[0] + '.' + parts.slice(1).join('');
            parts = cleaned.split('.');
        }
        // Cap integer part to 3 digits (999)
        if (parts[0].length > 3) {
            parts[0] = parts[0].slice(0, 3);
        }
        // Cap decimal part to 2 digits (.99)
        if (parts.length > 1 && parts[1].length > 2) {
            parts[1] = parts[1].slice(0, 2);
        }
        return parts.join('.');
    }

    function formatCostOnBlur() {
        var input = document.getElementById('pump-input-cost');
        if (!input) return;
        var raw = input.value.trim();
        if (raw === '') return;
        var num = parseFloat(raw);
        if (!isNaN(num) && num > 0) {
            num = Math.min(num, 999.99);
            input.value = num.toFixed(2);
        } else {
            input.value = '0.00';
        }
        updateComputedRow();
    }

    function sanitizeGallonsInput(val) {
        var cleaned = val.replace(/[^0-9.]/g, '');
        var parts = cleaned.split('.');
        if (parts.length > 2) {
            cleaned = parts[0] + '.' + parts.slice(1).join('');
            parts = cleaned.split('.');
        }
        if (parts[0].length > 4) {
            parts[0] = parts[0].slice(0, 4);
        }
        if (parts.length > 1 && parts[1].length > 3) {
            parts[1] = parts[1].slice(0, 3);
        }
        return parts.join('.');
    }

    function formatGallonsOnBlur() {
        var input = document.getElementById('pump-input-gallons');
        if (!input) return;
        var raw = input.value.trim();
        if (raw === '') return;
        var num = parseFloat(raw);
        if (!isNaN(num) && num > 0) {
            input.value = num.toFixed(3);
        } else {
            input.value = '0.000';
        }
        updateComputedRow();
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
        formatCostOnBlur();
        formatGallonsOnBlur();

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
            gallons: galVal.toFixed(3),
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

        // Set initial odometer display
        setOdometerDisplay(lastOdometer);

        // Odometer input listener (directly typed on the odometer wheels)
        var odoInput = document.getElementById('pump-input-odometer');
        var odoFrame = document.getElementById('pump-odometer-frame');
        if (odoInput) {
            odoInput.addEventListener('input', function () {
                // Keep only numbers, max 6 digits
                var clean = odoInput.value.replace(/[^0-9]/g, '').slice(0, 6);
                odoInput.value = clean;
                var val = parseInt(clean, 10) || 0;
                setOdometerDisplay(val);
                updateComputedRow();
            });
            odoInput.addEventListener('focus', function () {
                if (odoFrame) odoFrame.classList.add('active');
            });
            odoInput.addEventListener('blur', function () {
                if (odoFrame) odoFrame.classList.remove('active');
            });
        }

        // Cost input listener (max 3 digits before decimal, 2 after)
        var costInput = document.getElementById('pump-input-cost');
        if (costInput) {
            costInput.addEventListener('input', function () {
                var cleaned = sanitizeCostInput(costInput.value);
                costInput.value = cleaned;
                updateComputedRow();
            });
            costInput.addEventListener('blur', formatCostOnBlur);
        }

        // Gallons input listener
        var galInput = document.getElementById('pump-input-gallons');
        if (galInput) {
            galInput.addEventListener('input', function () {
                var cleaned = sanitizeGallonsInput(galInput.value);
                galInput.value = cleaned;
                updateComputedRow();
            });
            galInput.addEventListener('blur', formatGallonsOnBlur);
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
