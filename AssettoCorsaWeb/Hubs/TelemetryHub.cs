using Microsoft.AspNetCore.SignalR;

namespace AssettoCorsaWeb.Hubs;

public class TelemetryHub : Hub
{
    // Clients subscribe to "telemetry" messages pushed by the background service.
    // No client-to-server calls needed for a read-only dashboard.
}
