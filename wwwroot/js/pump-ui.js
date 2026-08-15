/* =============================================================
   pump-ui.js  —  Gas Pump Entry Page Logic
   Handles: pump display input, odometer, slide-up drawer,
            save flow, success animation, PWA install prompt.
   ============================================================= */

(function () {
    'use strict';

    /* ── State ─────────────────────────────────────────────────── */
    var _state = {
        costRaw: 0,       // stored as integer cents (e.g. 4000 = $40.00)
        gallonsRaw: 0,    // stored as integer thousandths (e.g. 23683 = 23.683)
        odometerValue: 0,
        activeField: null // 'cost' or 'gallons'
    };

    /* ── Odometer animation ────────────────────────────────────── */
    function animateOdoDigit(digitEl, fromVal, toVal) {
        var inner = digitEl.querySelector('.odo-digit-inner');
        if (!inner) return;
        var prev = (fromVal + 9) % 10;
        var curr = toVal;
        inner.innerHTML =
            '<div class="odo-digit-value">' + prev + '</div>' +
            '<div class="odo-digit-value">' + curr + '</div>';
        inner.style.transition = 'none';
        inner.style.transform = 'translateY(-46px)';
        inner.getBoundingClientRect();
        inner.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        inner.style.transform = 'translateY(0px)';
    }

    function setOdometerDisplay(value, animate) {
        var digits = document.querySelectorAll('.odo-digit');
        if (!digits.length) return;
        var intVal = Math.round(value);
        var str = intVal.toString().padStart(6, '0');
        digits.forEach(function (digitEl, i) {
            var newVal = parseInt(str[i], 10);
            var inner = digitEl.querySelector('.odo-digit-inner');
            if (!inner) return;
            if (animate) {
                var oldVal = parseInt(inner.textContent.trim().slice(-1) || '0', 10);
                animateOdoDigit(digitEl, oldVal, newVal);
            } else {
                inner.style.transition = 'none';
                inner.style.transform = 'translateY(0)';
                inner.innerHTML = '<div class="odo-digit-value">' + newVal + '</div>';
            }
        });
        _state.odometerValue = intVal;
    }

    /* ── Pump display formatting ────────────────────────────────── */
    function formatCostDisplay(cents) {
        var dollars = Math.floor(cents / 100);
        var c = cents % 100;
        return dollars.toFixed(0) + '.' + c.toString().padStart(2, '0');
    }

    function formatGallonsDisplay(thousandths) {
        var whole = Math.floor(thousandths / 1000);
        var frac = thousandths % 1000;
        return whole.toFixed(0) + '.' + frac.toString().padStart(3, '0');
    }

    function updateDisplay(field) {
        var el = document.getElementById('pump-display-' + field);
        if (!el) return;
        var txt = field === 'cost'
            ? formatCostDisplay(_state.costRaw)
            : formatGallonsDisplay(_state.gallonsRaw);
        el.textContent = txt;
        updateComputedRow();
    }

    function updateComputedRow() {
        var mpgEl = document.getElementById('pump-computed-mpg');
        var ppgEl = document.getElementById('pump-computed-ppg');
        if (mpgEl && _state.odometerValue > 0) {
            var odoDisplay = document.getElementById('pump-odometer-display');
            var prevOdo = parseInt(odoDisplay ? odoDisplay.dataset.prevOdo || '0' : '0', 10);
            var miles = _state.odometerValue - prevOdo;
            var gallons = _state.gallonsRaw / 1000;
            if (miles > 0 && gallons > 0) {
                mpgEl.querySelector('span').textContent = (miles / gallons).toFixed(1) + ' MPG';
            } else {
                mpgEl.querySelector('span').textContent = '---';
            }
        }
        if (ppgEl) {
            var gallons2 = _state.gallonsRaw / 1000;
            var cost = _state.costRaw / 100;
            if (gallons2 > 0 && cost > 0) {
                ppgEl.querySelector('span').textContent = '$' + (cost / gallons2).toFixed(3) + '/gal';
            } else {
                ppgEl.querySelector('span').textContent = '---';
            }
        }
    }

    /* ── Active field management ───────────────────────────────── */
    function activateField(field) {
        ['cost', 'gallons'].forEach(function (f) {
            var block = document.getElementById('pump-block-' + f);
            var disp = document.getElementById('pump-display-' + f);
            if (block) block.classList.remove('active');
            if (disp) disp.classList.remove('active');
        });
        _state.activeField = field;
        var block = document.getElementById('pump-block-' + field);
        var disp = document.getElementById('pump-display-' + field);
        if (block) block.classList.add('active');
        if (disp) disp.classList.add('active');
        var hiddenInput = document.getElementById('pump-hidden-' + field);
        if (hiddenInput) {
            hiddenInput.value = '';
            hiddenInput.focus();
        }
    }

    /* ── Hidden input event handler ────────────────────────────── */
    function onHiddenInputChange(field, inputEl) {
        var raw = inputEl.value.replace(/[^0-9]/g, '');
        if (raw === '') raw = '0';
        var intVal = parseInt(raw, 10) || 0;
        if (field === 'cost') {
            _state.costRaw = Math.min(intVal, 99999);
        } else {
            _state.gallonsRaw = Math.min(intVal, 999999);
        }
        updateDisplay(field);
    }

    /* ── Odometer tap to edit ───────────────────────────────────── */
    function showOdometerInput() {
        var currentVal = _state.odometerValue;
        var newVal = prompt('Enter current odometer reading (miles):', currentVal > 0 ? currentVal : '');
        if (newVal === null) return;
        var parsed = parseInt(newVal.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed) && parsed >= 0) {
            setOdometerDisplay(parsed, true);
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
            }, 380);
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
        if (_state.costRaw <= 0) {
            alert('Please enter the total cost.');
            activateField('cost');
            return false;
        }
        if (_state.gallonsRaw <= 0) {
            alert('Please enter the gallons.');
            activateField('gallons');
            return false;
        }
        if (_state.odometerValue <= 0) {
            var ok = confirm('Odometer reading is 0. Continue anyway?');
            if (!ok) return false;
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

        var gasDate = dateInput ? dateInput.value : new Date().toLocaleDateString('en-US');
        var isFillFull = fillFull ? fillFull.checked : true;
        var gasNotes = notes ? notes.value : '';
        var gasTags = tags ? (Array.isArray($(tags).val()) ? $(tags).val() : []) : [];

        var gasRecord = {
            id: 0,
            vehicleId: vehicleId,
            date: gasDate,
            mileage: _state.odometerValue,
            gallons: (_state.gallonsRaw / 1000).toFixed(3),
            cost: (_state.costRaw / 100).toFixed(2),
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
            // Hide pump entry and reload gas records table
            hidePumpEntry();
            if (typeof getVehicleGasRecords === 'function') {
                getVehicleGasRecords(vehicleId);
            }
        }, 1800);
    }

    /* ── Show / Hide Pump Entry Full-Page View ──────────────────── */
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

    /* ── Service worker registration ────────────────────────────── */
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/js/pump-sw.js').catch(function () { /* silent */ });
        }
    }

    /* ── Main init (called when _GasPumpEntry.cshtml loads) ─────── */
    window.initPumpUI = function (options) {
        options = options || {};
        var vehicleId = options.vehicleId || 0;
        var lastOdometer = options.lastOdometer || 0;

        _state.costRaw = 0;
        _state.gallonsRaw = 0;
        _state.odometerValue = lastOdometer;

        setOdometerDisplay(lastOdometer, false);
        if (lastOdometer > 0) {
            var odoEl = document.getElementById('pump-odometer-display');
            if (odoEl) odoEl.dataset.prevOdo = lastOdometer;
        }

        ['cost', 'gallons'].forEach(function (field) {
            var block = document.getElementById('pump-block-' + field);
            var hiddenInput = document.getElementById('pump-hidden-' + field);
            if (block) {
                block.addEventListener('click', function () { activateField(field); });
                block.addEventListener('touchstart', function (e) {
                    e.preventDefault();
                    activateField(field);
                }, { passive: false });
            }
            if (hiddenInput) {
                hiddenInput.addEventListener('input', function () {
                    onHiddenInputChange(field, hiddenInput);
                });
            }
        });

        var odoPanel = document.getElementById('pump-odometer-display');
        if (odoPanel) {
            odoPanel.addEventListener('click', showOdometerInput);
        }

        var saveBtn = document.getElementById('pump-save-step1');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                if (validateStep1()) openDrawer();
            });
        }

        var backdrop = document.getElementById('pump-drawer-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', closeDrawer);
        }

        var confirmBtn = document.getElementById('pump-drawer-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', saveRecord);
        }

        var dateInput = document.getElementById('pump-drawer-date');
        if (dateInput) {
            var today = new Date();
            var mm = String(today.getMonth() + 1).padStart(2, '0');
            var dd = String(today.getDate()).padStart(2, '0');
            var yyyy = today.getFullYear();
            dateInput.value = mm + '/' + dd + '/' + yyyy;
        }

        updateDisplay('cost');
        updateDisplay('gallons');

        registerServiceWorker();
    };

    window.pumpCloseDrawer = closeDrawer;

})();
