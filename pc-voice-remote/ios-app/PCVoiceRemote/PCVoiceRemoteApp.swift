import AppIntents
import SwiftUI

@main
struct PCVoiceRemoteApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

/// "Hey Siri, Command my PC with PC Remote" → Siri asks what to do → your answer
/// goes to the PC. Works from the Lock Screen, AirPods and CarPlay too.
struct SendPCCommandIntent: AppIntent {
    static var title: LocalizedStringResource = "Command my PC"
    static var description = IntentDescription("Send a spoken command to your Windows PC.")

    @Parameter(title: "Command", requestValueDialog: "What should your PC do?")
    var command: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let response = try await MediatorClient.send(command)
        let reply = response.message ?? (response.ok ? "Done" : "That didn't work")
        return .result(dialog: "\(reply)")
    }
}

struct PCRemoteShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: SendPCCommandIntent(),
            phrases: [
                "Command my PC with \(.applicationName)",
                "Tell my PC with \(.applicationName)",
                "Control my computer with \(.applicationName)",
            ],
            shortTitle: "Command PC",
            systemImageName: "desktopcomputer"
        )
    }
}
