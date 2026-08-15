using CarCareTracker.Filter;
using CarCareTracker.Helper;
using CarCareTracker.Models;
using Microsoft.AspNetCore.Mvc;

namespace CarCareTracker.Controllers
{
    public partial class VehicleController
    {
        // ── Quick Fuel PWA vehicle picker page ────────────────────────────
        [HttpGet]
        public IActionResult QuickFuel()
        {
            var vehicles = _dataAccess.GetVehicles();
            if (!User.IsInRole(nameof(UserData.IsRootUser)))
            {
                vehicles = _userLogic.FilterUserVehicles(vehicles, GetUserID());
            }
            var viewModels = vehicles.Select(v =>
            {
                var gasRecs = _gasRecordDataAccess.GetGasRecordsByVehicleId(v.Id);
                int lastMileage = 0;
                if (gasRecs.Any())
                {
                    lastMileage = gasRecs.OrderByDescending(x => x.Date)
                                         .ThenByDescending(x => x.Mileage)
                                         .FirstOrDefault()?.Mileage ?? 0;
                    if (lastMileage == 0)
                    {
                        lastMileage = gasRecs.Max(x => x.Mileage);
                    }
                }
                if (lastMileage == 0)
                {
                    lastMileage = _vehicleLogic.GetMaxMileage(v.Id);
                }

                return new VehicleViewModel
                {
                    Id = v.Id,
                    Year = v.Year,
                    Make = v.Make,
                    Model = v.Model,
                    ImageLocation = v.ImageLocation,
                    LastReportedMileage = lastMileage,
                    SoldDate = v.SoldDate,
                    Tags = v.Tags,
                    ExtraFields = v.ExtraFields
                };
            }).ToList();
            return View("QuickFuel", viewModels);
        }

        // ── Pump entry partial view — loaded into gas tab pane ─────────────
        [TypeFilter(typeof(CollaboratorFilter))]
        [HttpGet]
        public IActionResult GetGasPumpEntryPartialView(int vehicleId)
        {
            var vehicle = _dataAccess.GetVehicleById(vehicleId);
            var gasRecs = _gasRecordDataAccess.GetGasRecordsByVehicleId(vehicleId);
            int lastFuelMileage = 0;
            if (gasRecs.Any())
            {
                lastFuelMileage = gasRecs.OrderByDescending(x => x.Date)
                                         .ThenByDescending(x => x.Mileage)
                                         .FirstOrDefault()?.Mileage ?? 0;
                if (lastFuelMileage == 0)
                {
                    lastFuelMileage = gasRecs.Max(x => x.Mileage);
                }
            }
            if (lastFuelMileage == 0)
            {
                lastFuelMileage = _vehicleLogic.GetMaxMileage(vehicleId);
            }

            var pumpModel = new PumpViewModel
            {
                Id = vehicle.Id,
                Year = vehicle.Year,
                Make = vehicle.Make,
                Model = vehicle.Model,
                LastOdometer = lastFuelMileage
            };
            return PartialView("Gas/_GasPumpEntry", pumpModel);
        }
    }
}
