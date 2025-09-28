import ExpoModulesCore


public class ExpoWatchModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoWatchModule")
        
        
        Events("watchMessage", "phoneMessage", "activationStateChanged")
        
        
        Function("start") { () in
            try WatchConnectivityManager.shared.start(module: self)
        }
        
        
        // PHONE → WATCH 즉시 전송
        Function("sendToWatch") { (dict: [String: Any]) in
            try WatchConnectivityManager.shared.sendToWatch(dict)
        }
        
        
        // PHONE → WATCH 백그라운드 큐 전송
        Function("queueToWatch") { (dict: [String: Any]) in
            try WatchConnectivityManager.shared.queueToWatch(dict)
        }
    }
}
