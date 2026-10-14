import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage(Settings.mediatorURLKey) private var mediatorURL = ""
    @AppStorage(Settings.tokenKey) private var token = ""
    @AppStorage(Settings.speakRepliesKey) private var speakReplies = false
    @State private var testResult: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("http://192.168.1.20:8765", text: $mediatorURL)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    SecureField("Access token", text: $token)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                } header: {
                    Text("Mediator")
                } footer: {
                    Text("Both are printed in the mediator window when it starts.")
                }

                Section {
                    Toggle("Speak replies out loud", isOn: $speakReplies)
                }

                Section {
                    Button("Test connection") {
                        Task {
                            do {
                                let status = try await MediatorClient.status()
                                testResult = status.agents.isEmpty
                                    ? "Mediator OK, but the PC agent isn't connected."
                                    : "Connected to \(status.agents.map { $0.hostname ?? $0.name }.joined(separator: ", "))"
                            } catch {
                                testResult = error.localizedDescription
                            }
                        }
                    }
                    if let testResult { Text(testResult).font(.footnote) }
                }

                Section("Siri") {
                    Text("Say “Hey Siri, Command my PC with PC Remote”, then speak your command.")
                        .font(.footnote)
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
        }
    }
}
