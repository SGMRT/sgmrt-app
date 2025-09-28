import Foundation
import WatchConnectivity
import ExpoModulesCore


final class WatchConnectivityManager: NSObject {
    static let shared = WatchConnectivityManager()
    private override init() {}
    
    
    private var module: Module?
    private var session: WCSession? {
        WCSession.isSupported() ? WCSession.default : nil
    }
    
    
    func start(module: Module) throws {
        self.module = module
        guard let session = session else { return }
        session.delegate = self
        session.activate()
    }
    
    
    func sendToWatch(_ message: [String: Any]) throws {
        guard let session = session else { return }
        // WATCH에 도달 가능할 때
        if session.isPaired && session.isWatchAppInstalled && session.isReachable {
            session.sendMessage(message, replyHandler: nil) { [weak self] error in
                self?.emitPhoneMessage(["error": error.localizedDescription])
            }
        } else {
            // 도달 불가 시 백그라운드 큐로 전송
            try queueToWatch(message)
        }
    }
    
    
    func queueToWatch(_ userInfo: [String: Any]) throws {
        guard let session = session else { return }
        session.transferUserInfo(userInfo)
    }
}


extension WatchConnectivityManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        emitActivation(activationState: activationState.rawValue, error: error)
    }
    
    
#if os(iOS)
    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) {
        session.activate()
    }
#endif
    
    
    // 워치 → 폰 메시지 (포그라운드)
    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        emitWatchMessage(message)
    }
    
    
    // 워치 → 폰 백그라운드 전송
    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
        emitWatchMessage(userInfo)
    }
}


// MARK: - 이벤트 발신
private extension WatchConnectivityManager {
    func emitActivation(activationState: Int, error: Error?) {
        (module as? ExpoWatchModule)?.sendEvent("activationStateChanged", [
            "state": activationState,
            "error": error?.localizedDescription as Any
        ])
    }
    
    
    func emitWatchMessage(_ payload: [String: Any]) {
        (module as? ExpoWatchModule)?.sendEvent("watchMessage", payload)
    }
    
    
    func emitPhoneMessage(_ payload: [String: Any]) {
        (module as? ExpoWatchModule)?.sendEvent("phoneMessage", payload)
    }
}
