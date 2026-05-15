namespace AssettoCorsaWeb.Models;

public class TelemetryData
{
    // ── Connection ────────────────────────────────────────────────────────────
    public bool AcConnected { get; set; }

    // ── Speed & Engine ────────────────────────────────────────────────────────
    public float SpeedKmh    { get; set; }
    public float SpeedMph    { get; set; }
    public int   Gear        { get; set; }   // 0=R, 1=N, 2=1st ...
    public int   Rpms        { get; set; }
    public int   MaxRpm      { get; set; }
    public float TurboBoost  { get; set; }
    public float Fuel        { get; set; }
    public float MaxFuel     { get; set; }
    public float FuelXLap    { get; set; }

    // ── Pedals ────────────────────────────────────────────────────────────────
    public float Gas    { get; set; }
    public float Brake  { get; set; }
    public float Clutch { get; set; }   // already inverted (0=released,1=pressed)

    // ── Tyres – FL FR RL RR ──────────────────────────────────────────────────
    public float[] TyreCoreTemp  { get; set; } = new float[4];
    public float[] TyreTempI     { get; set; } = new float[4];   // inner
    public float[] TyreTempM     { get; set; } = new float[4];   // middle
    public float[] TyreTempO     { get; set; } = new float[4];   // outer
    public float[] TyrePressure  { get; set; } = new float[4];
    public float[] TyreWear      { get; set; } = new float[4];
    public float[] WheelSlip     { get; set; } = new float[4];
    public float[] BrakeTemp     { get; set; } = new float[4];

    // ── Chassis ───────────────────────────────────────────────────────────────
    public float BrakeBias  { get; set; }
    public float Tc         { get; set; }
    public float Abs        { get; set; }
    public int   TcLevel    { get; set; }
    public int   AbsLevel   { get; set; }
    public int   EngineMap  { get; set; }
    public int   DrsAvailable { get; set; }
    public int   DrsEnabled   { get; set; }
    public int   PitLimiter   { get; set; }

    // ── Drift Telemetry ───────────────────────────────────────────────────────
    /// Slip angle in degrees – angle between velocity vector and car heading.
    /// Positive = sliding right (oversteer right).
    public float SlipAngle  { get; set; }

    /// Yaw rate in deg/s – how fast the car is rotating around its vertical axis.
    public float YawRate    { get; set; }

    /// Lateral G-force (positive = right).
    public float LateralG   { get; set; }

    /// Longitudinal G-force (positive = forward).
    public float LongitudinalG { get; set; }

    /// Steering wheel angle in degrees.
    public float SteerAngleDeg { get; set; }

    /// Rear tyre average slip vs front – quick oversteer indicator.
    public float OversteerIndex { get; set; }

    /// Lateral velocity in car's local frame (m/s).
    public float LocalVelLateral { get; set; }

    /// Forward velocity in car's local frame (m/s).
    public float LocalVelForward { get; set; }

    // ── Race Info ─────────────────────────────────────────────────────────────
    public int    AcStatus      { get; set; }
    public int    Session       { get; set; }
    public string CurrentTime   { get; set; } = "";
    public string BestTime      { get; set; } = "";
    public string LastTime      { get; set; } = "";
    public int    CompletedLaps { get; set; }
    public int    Position      { get; set; }
    public int    NumberOfLaps  { get; set; }
    public int    IsInPit       { get; set; }
    public int    IsInPitLane   { get; set; }
    public int    Flag          { get; set; }
    public float  SessionTimeLeft { get; set; }
    public float  AirTemp       { get; set; }
    public float  RoadTemp      { get; set; }

    // ── Static (rarely changes) ───────────────────────────────────────────────
    public string CarModel      { get; set; } = "";
    public string Track         { get; set; } = "";
    public string TrackConfig   { get; set; } = "";
    public string TyreCompound  { get; set; } = "";
    public string PlayerName    { get; set; } = "";
}
