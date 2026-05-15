using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;

[assembly: SupportedOSPlatform("windows")]

namespace AssettoCorsaWeb.Models;

public enum AcStatus { Off = 0, Replay = 1, Live = 2, Pause = 3 }

public enum AcSessionType
{
    Unknown = -1, Practice = 0, Qualify = 1, Race = 2,
    HotLap = 3, TimeAttack = 4, Drift = 5, Drag = 6
}

public enum AcFlag
{
    None = 0, Blue = 1, Yellow = 2, Black = 3,
    White = 4, Checkered = 5, Penalty = 6
}

[StructLayout(LayoutKind.Sequential, Pack = 4)]
public unsafe struct AcPhysics
{
    public int   PacketId;
    public float Gas;
    public float Brake;
    public float Fuel;
    public int   Gear;          // 0=R, 1=N, 2=1st ...
    public int   Rpms;
    public float SteerAngle;
    public float SpeedKmh;
    public fixed float Velocity[3];
    public fixed float AccG[3];             // [0]=lat, [1]=vert, [2]=long
    public fixed float WheelSlip[4];        // FL FR RL RR
    public fixed float WheelLoad[4];
    public fixed float WheelsPressure[4];
    public fixed float WheelAngularSpeed[4];
    public fixed float TyreWear[4];
    public fixed float TyreDirtyLevel[4];
    public fixed float TyreCoreTemperature[4];
    public fixed float CamberRAD[4];
    public fixed float SuspensionTravel[4];
    public float Drs;
    public float Tc;
    public float Heading;
    public float Pitch;
    public float Roll;
    public float CgHeight;
    public fixed float CarDamage[5];
    public int   NumberOfTyresOut;
    public int   PitLimiterOn;
    public float Abs;
    public float KersCharge;
    public float KersInput;
    public int   AutoShifterOn;
    public fixed float RideHeight[2];
    public float TurboBoost;
    public float Ballast;
    public float AirDensity;
    public float AirTemp;
    public float RoadTemp;
    public fixed float LocalAngularVelocity[3];  // [1] = yaw rate
    public float FinalFF;
    public float PerformanceMeter;
    public int   EngineBrake;
    public int   ErsRecoveryLevel;
    public int   ErsPowerLevel;
    public int   ErsHeatCharging;
    public int   ErsIsCharging;
    public float KersCurrentKJ;
    public int   DrsAvailable;
    public int   DrsEnabled;
    public fixed float BrakeTemp[4];
    public float Clutch;
    public fixed float TyreTempI[4];
    public fixed float TyreTempM[4];
    public fixed float TyreTempO[4];
    public int   IsAIControlled;
    public fixed float TyreContactPoint[12];
    public fixed float TyreContactNormal[12];
    public fixed float TyreContactHeading[12];
    public float BrakeBias;
    public fixed float LocalVelocity[3];    // [0]=lateral, [1]=vert, [2]=forward
}

[StructLayout(LayoutKind.Sequential, Pack = 4)]
public unsafe struct AcGraphics
{
    public int   PacketId;
    public int   Status;
    public int   Session;
    public fixed char CurrentTime[15];
    public fixed char LastTime[15];
    public fixed char BestTime[15];
    public fixed char Split[15];
    public int   CompletedLaps;
    public int   Position;
    public int   ICurrentTime;
    public int   ILastTime;
    public int   IBestTime;
    public float SessionTimeLeft;
    public float DistanceTraveled;
    public int   IsInPit;
    public int   CurrentSectorIndex;
    public int   LastSectorTime;
    public int   NumberOfLaps;
    public fixed char TyreCompound[33];
    public float ReplayTimeMultiplier;
    public float NormalizedCarPosition;
    public int   ActiveCars;
    public fixed float CarCoordinates[180];
    public fixed int  CarID[60];
    public int   PlayerCarID;
    public float PenaltyTime;
    public int   Flag;
    public int   Penalty;
    public int   IdealLineOn;
    public int   IsInPitLane;
    public float SurfaceGrip;
    public int   MandatoryPitDone;
    public float WindSpeed;
    public float WindDirection;
    public int   IsSetupMenuVisible;
    public int   MainDisplayIndex;
    public int   SecondaryDisplayIndex;
    public int   TC;
    public int   TCCut;
    public int   EngineMap;
    public int   ABS;
    public float FuelXLap;
    public int   RainLights;
    public int   FlashingLights;
    public int   LightsStage;
    public float ExhaustTemperature;
    public int   WiperLV;
    public int   DriverStintTotalTimeLeft;
    public int   DriverStintTimeLeft;
    public int   RainTyres;
}

[StructLayout(LayoutKind.Sequential, Pack = 4)]
public unsafe struct AcStatic
{
    public fixed char SmVersion[15];
    public fixed char AcVersion[15];
    public int   NumberOfSessions;
    public int   NumCars;
    public fixed char CarModel[33];
    public fixed char Track[33];
    public fixed char PlayerName[33];
    public fixed char PlayerSurname[33];
    public fixed char PlayerNick[33];
    public int   SectorCount;
    public float MaxTorque;
    public float MaxPower;
    public int   MaxRpm;
    public float MaxFuel;
    public fixed float SuspensionMaxTravel[4];
    public fixed float TyreRadius[4];
    public float MaxTurboBoost;
    public float Deprecated1;
    public float Deprecated2;
    public int   PenaltiesEnabled;
    public float AidFuelRate;
    public float AidTireRate;
    public float AidMechanicalDamage;
    public int   AidAllowTyreBlankets;
    public float AidStability;
    public int   AidAutoClutch;
    public int   AidAutoBlip;
    public int   HasDRS;
    public int   HasERS;
    public int   HasKERS;
    public float KersMaxJ;
    public int   EngineBrakeSettingsCount;
    public int   ErsPowerControllerCount;
    public float TrackSplineLength;
    public fixed char TrackConfiguration[33];
    public float ErsMaxJ;
    public int   IsTimedRace;
    public int   HasExtraLap;
    public fixed char CarSkin[33];
    public int   ReversedGridPositions;
    public int   PitWindowStart;
    public int   PitWindowEnd;
    public int   IsOnline;
}

public static unsafe class AcReader
{
    public static (MemoryMappedFile Physics, MemoryMappedFile Graphics, MemoryMappedFile Static) OpenAll()
    {
        var phy = MemoryMappedFile.OpenExisting("Local\\acpmf_physics",  MemoryMappedFileRights.Read);
        var gfx = MemoryMappedFile.OpenExisting("Local\\acpmf_graphics", MemoryMappedFileRights.Read);
        var sta = MemoryMappedFile.OpenExisting("Local\\acpmf_static",   MemoryMappedFileRights.Read);
        return (phy, gfx, sta);
    }

    public static AcPhysics  ReadPhysics(MemoryMappedFile  mmf) => Read<AcPhysics>(mmf);
    public static AcGraphics ReadGraphics(MemoryMappedFile mmf) => Read<AcGraphics>(mmf);
    public static AcStatic   ReadStatic(MemoryMappedFile   mmf) => Read<AcStatic>(mmf);

    private static T Read<T>(MemoryMappedFile mmf) where T : unmanaged
    {
        using var acc = mmf.CreateViewAccessor(0, 0, MemoryMappedFileAccess.Read);
        byte* ptr = null;
        acc.SafeMemoryMappedViewHandle.AcquirePointer(ref ptr);
        try { return *(T*)ptr; }
        finally { acc.SafeMemoryMappedViewHandle.ReleasePointer(); }
    }

    public static string GetString(char* ptr, int maxLen)
    {
        int len = 0;
        while (len < maxLen && ptr[len] != '\0') len++;
        return new string(ptr, 0, len);
    }
}
