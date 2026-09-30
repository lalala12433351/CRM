import CallKit
import Capacitor
import Foundation
import UIKit

/// Registers app-local plugins; SceneDelegate uses this instead of the stock bridge controller.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(CallTrackerPlugin())
    }
}

/// iOS counterpart of the Android CallTracker plugin. iOS gives apps no access to call
/// recordings or the call log, so this only opens the dialer and measures talk time
/// with CXCallObserver.
@objc(CallTrackerPlugin)
public class CallTrackerPlugin: CAPPlugin, CAPBridgedPlugin, CXCallObserverDelegate {
    public let identifier = "CallTrackerPlugin"
    public let jsName = "CallTracker"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startCall", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pickRecordingFolder", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "findRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setAuth", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "drainCallEvents", returnType: CAPPluginReturnPromise),
    ]

    private struct PendingCall {
        let callId: String
        let leadId: String?
        let number: String
        let dialedAt: Date
        var callUUID: UUID?
        var connectedAt: Date?
    }

    private static let eventsKey = "pixbe_call_events"
    /// Cancelling the system "Call?" prompt produces no CXCall, so stale dials are dropped.
    private static let dialTimeout: TimeInterval = 120

    private let observer = CXCallObserver()
    private var pending: PendingCall?

    override public func load() {
        observer.setDelegate(self, queue: DispatchQueue.main)
    }

    @objc func startCall(_ call: CAPPluginCall) {
        guard let number = call.getString("number"), let callId = call.getString("callId") else {
            call.reject("number and callId are required")
            return
        }
        let dialable = number.filter { "0123456789+*#".contains($0) }
        guard !dialable.isEmpty, let url = URL(string: "tel://\(dialable)") else {
            call.reject("Invalid phone number")
            return
        }
        let leadId = call.getString("leadId")
        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { opened in
                guard opened else {
                    call.reject("Unable to open the dialer")
                    return
                }
                self.pending = PendingCall(callId: callId, leadId: leadId, number: number, dialedAt: Date())
                call.resolve(["tracked": true, "directDial": false])
            }
        }
    }

    public func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
        guard var current = pending else { return }

        if current.callUUID == nil {
            if Date().timeIntervalSince(current.dialedAt) > Self.dialTimeout {
                pending = nil
                return
            }
            guard call.isOutgoing, !call.hasEnded else { return }
            current.callUUID = call.uuid
        }
        guard current.callUUID == call.uuid else { return }

        if call.hasConnected, current.connectedAt == nil {
            current.connectedAt = Date()
        }

        guard call.hasEnded else {
            pending = current
            return
        }
        pending = nil

        let endedAt = Date()
        let startedAt = current.connectedAt ?? current.dialedAt
        let durationSec = current.connectedAt.map { max(0, Int(endedAt.timeIntervalSince($0).rounded())) } ?? 0
        var event: [String: Any] = [
            "callId": current.callId,
            "number": current.number,
            "type": durationSec > 0 ? "outgoing" : "unanswered",
            "durationSec": durationSec,
            "startedAt": Self.iso(startedAt),
            "endedAt": Self.iso(endedAt),
            "recordingFound": false,
            "source": "call_observer",
        ]
        if let leadId = current.leadId { event["leadId"] = leadId }

        enqueue(event)
        notifyListeners("callEnded", data: event)
    }

    @objc func drainCallEvents(_ call: CAPPluginCall) {
        let defaults = UserDefaults.standard
        let events = defaults.array(forKey: Self.eventsKey) ?? []
        defaults.removeObject(forKey: Self.eventsKey)
        call.resolve(["events": events])
    }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(Self.permissionStatus())
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        call.resolve(Self.permissionStatus())
    }

    @objc func openSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let url = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(url)
            }
            call.resolve()
        }
    }

    @objc func pickRecordingFolder(_ call: CAPPluginCall) {
        call.unavailable("Call recordings are not available on iOS")
    }

    @objc func findRecording(_ call: CAPPluginCall) {
        call.resolve(["found": false])
    }

    /// Recordings are never uploaded on iOS, so native code has no use for the session token.
    @objc func setAuth(_ call: CAPPluginCall) {
        call.resolve()
    }

    private func enqueue(_ event: [String: Any]) {
        let defaults = UserDefaults.standard
        var events = defaults.array(forKey: Self.eventsKey) ?? []
        events.append(event)
        defaults.set(Array(events.suffix(100)), forKey: Self.eventsKey)
    }

    private static func permissionStatus() -> [String: Any] {
        return [
            "phone": "granted",
            "callLog": "unsupported",
            "contacts": "unsupported",
            "audio": "unsupported",
            "notifications": "unsupported",
            "recordingFolder": false,
            "batteryUnrestricted": true,
            "manufacturer": "apple",
            "sdkInt": 0,
        ]
    }

    private static func iso(_ date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: date)
    }
}
