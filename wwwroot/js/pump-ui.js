/* =============================================================
   pump-ui.js  —  Gas Pump Entry Page Logic
   Handles: direct tumbler odometer with typeover & auto-advance,
            strict cost & gallons rules, calculation trigger condition,
            slide-up drawer, API save.
   ============================================================= */

(function () {
    'use strict';

    var _state = {
        cost: 0,
        gallons: 0,
        odometerValue: 0,
        prevOdo: 0,
        odoTouched: false
    };

    /* ── Odometer Tumbler Helpers ───────────────────────────────── */
    function getOdometerValue() {
        var str = '';
        for (var i = 0; i < 6; i++) {
            var el = document.getElementById('odo-d' + i);
            str += (el ? el.value.replace(/[^0-9]/g, '') : '0') || '0';
        }
        return parseInt(str, 10) || 0;
    }

    function setOdometerValue(num) {
        var intVal = Math.max(0, Math.round(Number(num) || 0));
        var str = intVal.toString().padStart(6, '0');
        if (str.length > 6) {
            str = str.slice(-6);
        }
        for (var i = 0; i < 6; i++) {
            var el = document.getElementById('odo-d' + i);
            if (el) {
                el.value = str[i] || '0';
            }
        }
    }

    /* ── Keyboard & Input Control Helpers ──────────────────────── */
    function isControlKey(e) {
        return (
            e.key === 'Backspace' ||
            e.key === 'Delete' ||
            e.key === 'Tab' ||
            e.key === 'Enter' ||
            e.key === 'Escape' ||
            e.key === 'ArrowLeft' ||
            e.key === 'ArrowRight' ||
            e.key === 'ArrowUp' ||
            e.key === 'ArrowDown' ||
            e.key === 'Home' ||
            e.key === 'End' ||
            (e.ctrlKey || e.metaKey)
        );
    }

    /* ── COST INPUT: Max 3 digits before decimal, Max 2 after ──── */
    function handleCostKeydown(e) {
        if (isControlKey(e)) return;

        var input = e.target;
        var key = e.key;

        // Allow single dot
        if (key === '.') {
            if (input.value.indexOf('.') !== -1) {
                e.preventDefault();
            }
            return;
        }

        // Only allow digits 0-9
        if (!/^[0-9]$/.test(key)) {
            e.preventDefault();
            return;
        }

        var val = input.value;
        var selStart = input.selectionStart;
        var selEnd = input.selectionEnd;
        var proposed = val.slice(0, selStart) + key + val.slice(selEnd);

        if (!/^[0-9]*\.?[0-9]*$/.test(proposed)) {
            e.preventDefault();
            return;
        }

        var parts = proposed.split('.');
        // Max 3 digits before decimal
        if (parts[0].length > 3) {
            e.preventDefault();
            return;
        }
        // Max 2 digits after decimal
        if (parts.length > 1 && parts[1].length > 2) {
            e.preventDefault();
            return;
        }
    }

    function sanitizeCost(val) {
        var cleaned = val.replace(/[^0-9.]/g, '');
        var parts = cleaned.split('.');
        if (parts.length > 2) {
            cleaned = parts[0] + '.' + parts.slice(1).join('');
            parts = cleaned.split('.');
        }
        if (parts[0].length > 3) {
            parts[0] = parts[0].slice(0, 3);
        }
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

    /* ── GALLONS INPUT: Max 2 digits before decimal, Max 3 after ── */
    function handleGallonsKeydown(e) {
        if (isControlKey(e)) return;

        var input = e.target;
        var key = e.key;

        // Allow single dot
        if (key === '.') {
            if (input.value.indexOf('.') !== -1) {
                e.preventDefault();
            }
            return;
        }

        // Only allow digits 0-9
        if (!/^[0-9]$/.test(key)) {
            e.preventDefault();
            return;
        }

        var val = input.value;
        var selStart = input.selectionStart;
        var selEnd = input.selectionEnd;
        var proposed = val.slice(0, selStart) + key + val.slice(selEnd);

        if (!/^[0-9]*\.?[0-9]*$/.test(proposed)) {
            e.preventDefault();
            return;
        }

        var parts = proposed.split('.');
        // Max 2 digits before decimal
        if (parts[0].length > 2) {
            e.preventDefault();
            return;
        }
        // Max 3 digits after decimal
        if (parts.length > 1 && parts[1].length > 3) {
            e.preventDefault();
            return;
        }
    }

    function sanitizeGallons(val) {
        var cleaned = val.replace(/[^0-9.]/g, '');
        var parts = cleaned.split('.');
        if (parts.length > 2) {
            cleaned = parts[0] + '.' + parts.slice(1).join('');
            parts = cleaned.split('.');
        }
        if (parts[0].length > 2) {
            parts[0] = parts[0].slice(0, 2);
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
            num = Math.min(num, 99.999);
            input.value = num.toFixed(3);
        } else {
            input.value = '0.000';
        }
        updateComputedRow();
    }

    /* ── Live Computed Readout ─────────────────────────────────── */
    // Only calculate when all 3 boxes have completed their required digits:
    // - Total Cost: 2nd digit after decimal
    // - Gallons: 3rd digit after decimal
    // - Odometer: single mile value (ones digit) completed
    function updateComputedRow() {
        var mpgEl = document.getElementById('pump-computed-mpg');
        var ppgEl = document.getElementById('pump-computed-ppg');
        if (!mpgEl || !ppgEl) return;

        var costInput = document.getElementById('pump-input-cost');
        var galInput = document.getElementById('pump-input-gallons');

        var costStr = costInput ? costInput.value.trim() : '';
        var galStr = galInput ? galInput.value.trim() : '';
        var odoVal = getOdometerValue();

        // Check completion criteria
        var costNum = parseFloat(costStr);
        var isCostComplete = (!isNaN(costNum) && costNum > 0) && (/\.[0-9]{2}$/.test(costStr));

        var galNum = parseFloat(galStr);
        var isGallonsComplete = (!isNaN(galNum) && galNum > 0) && (/\.[0-9]{3}$/.test(galStr));

        var isOdometerComplete = (odoVal > 0) && (_state.odoTouched || odoVal !== _state.prevOdo);

        var allComplete = isCostComplete && isGallonsComplete && isOdometerComplete;

        if (allComplete) {
            _state.cost = costNum;
            _state.gallons = galNum;
            _state.odometerValue = odoVal;

            // Price per Gallon
            var ppg = costNum / galNum;
            ppgEl.querySelector('span').textContent = '$' + ppg.toFixed(3) + '/gal';

            // Miles per Gallon
            var prevOdo = _state.prevOdo;
            var deltaMiles = odoVal - prevOdo;
            if (prevOdo > 0 && deltaMiles > 0) {
                var mpg = deltaMiles / galNum;
                mpgEl.querySelector('span').textContent = mpg.toFixed(1) + ' MPG';
            } else if (prevOdo > 0 && deltaMiles <= 0) {
                mpgEl.querySelector('span').textContent = 'N/A';
            } else {
                mpgEl.querySelector('span').textContent = '---';
            }
        } else {
            // Wait until the last box has completed its last required digit
            ppgEl.querySelector('span').textContent = '---';
            mpgEl.querySelector('span').textContent = '---';
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
                var confirmBtn = document.getElementById('pump-drawer-confirm');
                if (confirmBtn) confirmBtn.focus();
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

        var costVal = parseFloat(costInput ? costInput.value : '0') || 0;
        var galVal = parseFloat(galInput ? galInput.value : '0') || 0;
        var odoVal = getOdometerValue();

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
            var ok = confirm('Odometer reading is 0. Continue anyway?');
            if (!ok) {
                var odo0 = document.getElementById('odo-d0');
                if (odo0) {
                    odo0.focus();
                    odo0.select();
                }
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
        var odoVal = getOdometerValue();

        var gasDate = (dateInput && dateInput.value.trim() !== '') ? dateInput.value.trim() : new Date().toLocaleDateString('en-US');
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
    window.showPumpEntry = function (vId) {
        var vehicleId = vId || (typeof GetVehicleId === 'function' && GetVehicleId() ? GetVehicleId().vehicleId : (new URLSearchParams(window.location.search).get('vehicleId') || 0));
        if (!vehicleId) return;

        $.get('/Vehicle/GetGasPumpEntryPartialView?vehicleId=' + vehicleId, function (html) {
            if (html) {
                var $container = $('#pumpEntryContainer');
                var $tableContainer = $('#gasRecordsTableContainer');
                if ($container.length) {
                    $container.html(html);
                    $container.show();
                }
                if ($tableContainer.length) {
                    $tableContainer.hide();
                }
                var prevOdo = parseInt($('#pump-odometer-frame').data('prev-odo'), 10) || 0;
                initPumpUI({
                    vehicleId: vehicleId,
                    lastOdometer: prevOdo
                });
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

    /* ── Service Worker ─────────────────────────────────────────── */
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
        _state.odoTouched = false;

        // Ensure 6 tumbler inputs have previous fill-up mileage
        setOdometerValue(lastOdometer);

        // Bind 6 tumbler inputs with Typeover & Auto-Advance
        for (var idx = 0; idx < 6; idx++) {
            (function (i) {
                var el = document.getElementById('odo-d' + i);
                if (!el) return;

                function selectTumbler() {
                    el.focus();
                    el.select();
                }

                // Focus/Click/Mouseup selection
                el.addEventListener('focus', function () {
                    setTimeout(selectTumbler, 10);
                });
                el.addEventListener('click', function () {
                    selectTumbler();
                });
                el.addEventListener('mouseup', function (e) {
                    e.preventDefault();
                    selectTumbler();
                });

                // Keydown: Direct overwrite and auto-advance to the right
                el.addEventListener('keydown', function (e) {
                    if (isControlKey(e)) {
                        if (e.key === 'Backspace') {
                            e.preventDefault();
                            el.value = '0';
                            _state.odoTouched = true;
                            updateComputedRow();
                            if (i > 0) {
                                var prev = document.getElementById('odo-d' + (i - 1));
                                if (prev) {
                                    prev.focus();
                                    prev.select();
                                }
                            }
                        } else if (e.key === 'ArrowLeft' && i > 0) {
                            e.preventDefault();
                            var prev2 = document.getElementById('odo-d' + (i - 1));
                            if (prev2) { prev2.focus(); prev2.select(); }
                        } else if (e.key === 'ArrowRight' && i < 5) {
                            e.preventDefault();
                            var next2 = document.getElementById('odo-d' + (i + 1));
                            if (next2) { next2.focus(); next2.select(); }
                        }
                        return;
                    }

                    // Direct overwrite on any digit 0-9
                    if (/^[0-9]$/.test(e.key)) {
                        e.preventDefault();
                        el.value = e.key; // Overwrite current position
                        _state.odoTouched = true;
                        updateComputedRow();

                        // Move to the right one digit and select it (until the ones place)
                        if (i < 5) {
                            var nextEl = document.getElementById('odo-d' + (i + 1));
                            if (nextEl) {
                                nextEl.focus();
                                nextEl.select();
                            }
                        } else {
                            selectTumbler();
                        }
                    } else {
                        e.preventDefault(); // Block all letters and non-numeric symbols
                    }
                });

                // Mobile touch input / autocomplete handler
                el.addEventListener('input', function () {
                    var raw = el.value.replace(/[^0-9]/g, '');
                    if (raw.length > 0) {
                        el.value = raw.slice(-1); // keep newly entered digit
                        _state.odoTouched = true;
                        updateComputedRow();
                        if (i < 5) {
                            var nextEl = document.getElementById('odo-d' + (i + 1));
                            if (nextEl) {
                                nextEl.focus();
                                nextEl.select();
                            }
                        }
                    } else {
                        el.value = '0';
                        _state.odoTouched = true;
                        updateComputedRow();
                    }
                });

                // Paste support across the 6 tumblers
                el.addEventListener('paste', function (e) {
                    e.preventDefault();
                    var text = (e.clipboardData || window.clipboardData).getData('text');
                    var digits = text.replace(/[^0-9]/g, '');
                    if (digits.length > 0) {
                        for (var d = 0; d < digits.length && (i + d) < 6; d++) {
                            var target = document.getElementById('odo-d' + (i + d));
                            if (target) target.value = digits[d];
                        }
                        _state.odoTouched = true;
                        updateComputedRow();
                        var lastIdx = Math.min(5, i + digits.length - 1);
                        var focusTarget = document.getElementById('odo-d' + lastIdx);
                        if (focusTarget) {
                            focusTarget.focus();
                            focusTarget.select();
                        }
                    }
                });
            })(idx);
        }

        // Cost input: strict decimal rules & key blocking
        var costInput = document.getElementById('pump-input-cost');
        if (costInput) {
            costInput.addEventListener('keydown', handleCostKeydown);
            costInput.addEventListener('input', function () {
                var cleaned = sanitizeCost(costInput.value);
                if (costInput.value !== cleaned) costInput.value = cleaned;
                updateComputedRow();
            });
            costInput.addEventListener('paste', function (e) {
                e.preventDefault();
                var text = (e.clipboardData || window.clipboardData).getData('text');
                var sanitized = sanitizeCost(text);
                costInput.value = sanitized;
                updateComputedRow();
            });
            costInput.addEventListener('blur', formatCostOnBlur);
        }

        // Gallons input: strict decimal rules & key blocking
        var galInput = document.getElementById('pump-input-gallons');
        if (galInput) {
            galInput.addEventListener('keydown', handleGallonsKeydown);
            galInput.addEventListener('input', function () {
                var cleaned = sanitizeGallons(galInput.value);
                if (galInput.value !== cleaned) galInput.value = cleaned;
                updateComputedRow();
            });
            galInput.addEventListener('paste', function (e) {
                e.preventDefault();
                var text = (e.clipboardData || window.clipboardData).getData('text');
                var sanitized = sanitizeGallons(text);
                galInput.value = sanitized;
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

        // Initialize datepicker with pre-entered today's date
        var dateInput = document.getElementById('pump-drawer-date');
        if (dateInput && typeof initDatePicker === 'function') {
            initDatePicker($('#pump-drawer-date'));
            if (!dateInput.value || dateInput.value.trim() === '') {
                var today = new Date();
                var mm = String(today.getMonth() + 1).padStart(2, '0');
                var dd = String(today.getDate()).padStart(2, '0');
                var yyyy = today.getFullYear();
                dateInput.value = mm + '/' + dd + '/' + yyyy;
            }
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
