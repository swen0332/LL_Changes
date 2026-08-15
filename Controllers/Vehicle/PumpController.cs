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
                var lastMileage = _vehicleLogic.GetMaxMileage(v.Id);
                if (lastMileage == 0)
                {
                    var gasRecs = _gasRecordDataAccess.GetGasRecordsByVehicleId(v.Id);
                    if (gasRecs.Any())
                    {
                        lastMileage = gasRecs.Max(x => x.Mileage);
                    }
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
            var lastMileage = _vehicleLogic.GetMaxMileage(vehicleId);
            if (lastMileage == 0)
            {
                var gasRecs = _gasRecordDataAccess.GetGasRecordsByVehicleId(vehicleId);
                if (gasRecs.Any())
                {
                    lastMileage = gasRecs.Max(x => x.Mileage);
                }
            }
            var pumpModel = new PumpViewModel
            {
                Id = vehicle.Id,
                Year = vehicle.Year,
                Make = vehicle.Make,
                Model = vehicle.Model,
                LastOdometer = lastMileage
            };
            return PartialView("Gas/_GasPumpEntry", pumpModel);
        }
    }
}
