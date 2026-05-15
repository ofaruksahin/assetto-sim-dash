using System.IO.MemoryMappedFiles;
using Microsoft.AspNetCore.SignalR;
using AssettoCorsaWeb.Hubs;
using AssettoCorsaWeb.Models;

namespace AssettoCorsaWeb.Services;

public sealed class AcBroadcastService : BackgroundService
{
    private readonly IHubContext<TelemetryHub> _hub;
    private readonly ILogger<AcBroadcastService> _log;

    private MemoryMappedFile? _phy, _gfx, _sta;
    private bool _connected;

    // Cached static info (changes only when session changes)
    private string _carModel = "", _track = "", _trackCfg = "", _player = "";
    private int _maxRpm;
    private float _maxFuel;

    public AcBroadcastService(IHubContext<TelemetryHub> hub, ILogger<AcBroadcastService> log)
    {
        _hub = hub;
        _log = log;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            if (!_connected)
            {
                TryConnect();
                if (!_connected)
                {
                    await _hub.Clients.All.SendAsync("telemetry",
                        new TelemetryData { AcConnected = false }, ct);
                    await Task.Delay(2000, ct);
                    continue;
                }
            }

            try
            {
                var data = BuildTelemetry();
                await _hub.Clients.All.SendAsync("telemetry", data, ct);
                await Task.Delay(50, ct); // ~20 fps
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _log.LogWarning("AC connection lost: {Msg}", ex.Message);
                Disconnect();
            }
        }
    }

    private void TryConnect()
    {
        try
        {
            (_phy, _gfx, _sta) = AcReader.OpenAll();
            _connected = true;
            RefreshStatic();
            _log.LogInformation("Connected to Assetto Corsa shared memory.");
        }
        catch (FileNotFoundException) { /* AC not running */ }
        catch (Exception ex) { _log.LogWarning("AC connect failed: {Msg}", ex.Message); }
    }

    private void Disconnect()
    {
        _connected = false;
        _phy?.Dispose(); _gfx?.Dispose(); _sta?.Dispose();
        _phy = _gfx = _sta = null;
    }

    private unsafe void RefreshStatic()
    {
        var s = AcReader.ReadStatic(_sta!);
        _carModel  = AcReader.GetString(s.CarModel,          33);
        _track     = AcReader.GetString(s.Track,             33);
        _trackCfg  = AcReader.GetString(s.TrackConfiguration,33);
        _player    = AcReader.GetString(s.PlayerName,        33)
                   + " " + AcReader.GetString(s.PlayerSurname, 33);
        _maxRpm    = s.MaxRpm > 0 ? s.MaxRpm : 8500;
        _maxFuel   = s.MaxFuel > 0 ? s.MaxFuel : 1f;
    }

    private unsafe TelemetryData BuildTelemetry()
    {
        var p = AcReader.ReadPhysics(_phy!);
        var g = AcReader.ReadGraphics(_gfx!);

        // Drift / slip angle: angle between velocity vector and car heading in car-local frame
        float vLat  = p.LocalVelocity[0];   // lateral (right = positive)
        float vFwd  = p.LocalVelocity[2];   // forward
        float speed = MathF.Sqrt(vLat * vLat + vFwd * vFwd);
        float slipAngle = speed > 0.5f
            ? MathF.Atan2(vLat, vFwd) * 180f / MathF.PI
            : 0f;

        // Yaw rate: local angular velocity around Y axis (rad/s → deg/s)
        float yawRate = p.LocalAngularVelocity[1] * 180f / MathF.PI;

        // Oversteer index: rear slip average - front slip average (positive = oversteer)
        float frontSlip = (p.WheelSlip[0] + p.WheelSlip[1]) * 0.5f;
        float rearSlip  = (p.WheelSlip[2] + p.WheelSlip[3]) * 0.5f;
        float oversteer = rearSlip - frontSlip;

        var d = new TelemetryData
        {
            AcConnected    = true,
            SpeedKmh       = p.SpeedKmh,
            SpeedMph       = p.SpeedKmh * 0.621371f,
            Gear           = p.Gear,
            Rpms           = p.Rpms,
            MaxRpm         = _maxRpm,
            TurboBoost     = p.TurboBoost,
            Fuel           = p.Fuel,
            MaxFuel        = _maxFuel,
            FuelXLap       = g.FuelXLap,

            Gas    = p.Gas,
            Brake  = p.Brake,
            Clutch = 1f - p.Clutch,

            BrakeBias  = p.BrakeBias,
            Tc         = p.Tc,
            Abs        = p.Abs,
            TcLevel    = g.TC,
            AbsLevel   = g.ABS,
            EngineMap  = g.EngineMap,
            DrsAvailable = p.DrsAvailable,
            DrsEnabled   = p.DrsEnabled,
            PitLimiter   = p.PitLimiterOn,

            SlipAngle      = slipAngle,
            YawRate        = yawRate,
            LateralG       = p.AccG[0],
            LongitudinalG  = p.AccG[2],
            SteerAngleDeg  = p.SteerAngle * 180f / MathF.PI,
            OversteerIndex = oversteer,
            LocalVelLateral = vLat,
            LocalVelForward = vFwd,

            AcStatus       = g.Status,
            Session        = g.Session,
            CurrentTime    = AcReader.GetString(g.CurrentTime, 15),
            BestTime       = AcReader.GetString(g.BestTime,    15),
            LastTime       = AcReader.GetString(g.LastTime,    15),
            CompletedLaps  = g.CompletedLaps,
            Position       = g.Position,
            NumberOfLaps   = g.NumberOfLaps,
            IsInPit        = g.IsInPit,
            IsInPitLane    = g.IsInPitLane,
            Flag           = g.Flag,
            SessionTimeLeft = g.SessionTimeLeft,
            AirTemp        = p.AirTemp,
            RoadTemp       = p.RoadTemp,

            CarModel       = _carModel,
            Track          = _track,
            TrackConfig    = _trackCfg,
            TyreCompound   = AcReader.GetString(g.TyreCompound, 33),
            PlayerName     = _player.Trim(),

            TyreCoreTemp   = [ p.TyreCoreTemperature[0], p.TyreCoreTemperature[1], p.TyreCoreTemperature[2], p.TyreCoreTemperature[3] ],
            TyreTempI      = [ p.TyreTempI[0], p.TyreTempI[1], p.TyreTempI[2], p.TyreTempI[3] ],
            TyreTempM      = [ p.TyreTempM[0], p.TyreTempM[1], p.TyreTempM[2], p.TyreTempM[3] ],
            TyreTempO      = [ p.TyreTempO[0], p.TyreTempO[1], p.TyreTempO[2], p.TyreTempO[3] ],
            TyrePressure   = [ p.WheelsPressure[0], p.WheelsPressure[1], p.WheelsPressure[2], p.WheelsPressure[3] ],
            TyreWear       = [ p.TyreWear[0], p.TyreWear[1], p.TyreWear[2], p.TyreWear[3] ],
            WheelSlip      = [ p.WheelSlip[0], p.WheelSlip[1], p.WheelSlip[2], p.WheelSlip[3] ],
            BrakeTemp      = [ p.BrakeTemp[0], p.BrakeTemp[1], p.BrakeTemp[2], p.BrakeTemp[3] ],
        };

        return d;
    }

    public override void Dispose()
    {
        Disconnect();
        base.Dispose();
    }
}
