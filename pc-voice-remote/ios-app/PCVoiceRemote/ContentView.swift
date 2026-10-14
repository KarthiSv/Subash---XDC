import SwiftUI
import UIKit

struct LogEntry: Identifiable {
    let id = UUID()
    let said: String
    let reply: String
    let ok: Bool
}

struct QuickAction: Identifiable {
    let id = UUID()
    let icon: String
    let label: String
    let command: String
    var confirm = false
}

private let quickActions: [QuickAction] = [
    .init(icon: "speaker.wave.1.fill", label: "Vol −", command: "volume down"),
    .init(icon: "speaker.wave.3.fill", label: "Vol +", command: "volume up"),
    .init(icon: "speaker.slash.fill", label: "Mute", command: "mute"),
    .init(icon: "playpause.fill", label: "Play/Pause", command: "play pause"),
    .init(icon: "globe", label: "Chrome", command: "open chrome"),
    .init(icon: "film.fill", label: "Netflix", command: "open netflix in chrome"),
    .init(icon: "play.rectangle.fill", label: "YouTube", command: "open youtube in chrome"),
    .init(icon: "arrow.up.left.and.arrow.down.right", label: "Fullscreen", command: "full screen"),
    .init(icon: "dot.radiowaves.left.and.right", label: "BT on", command: "turn on bluetooth"),
    .init(icon: "wave.3.left.circle", label: "BT off", command: "turn off bluetooth"),
    .init(icon: "lock.fill", label: "Lock", command: "lock the pc"),
    .init(icon: "macwindow", label: "Desktop", command: "show desktop"),
    .init(icon: "moon.fill", label: "Sleep", command: "sleep", confirm: true),
    .init(icon: "arrow.clockwise", label: "Restart", command: "restart", confirm: true),
    .init(icon: "power", label: "Shut down", command: "shutdown", confirm: true),
    .init(icon: "hand.raised.fill", label: "Cancel", command: "cancel shutdown"),
]

struct ContentView: View {
    @StateObject private var speech = SpeechRecognizer()
    @AppStorage(Settings.mediatorURLKey) private var mediatorURL = ""
    @AppStorage(Settings.tokenKey) private var token = ""

    @State private var typed = ""
    @State private var hint = "Tap the mic and say a command"
    @State private var log: [LogEntry] = []
    @State private var pcName: String?
    @State private var showSettings = false
    @State private var pendingConfirm: QuickAction?

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 4)

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    micSection
                    inputRow
                    quickGrid
                    history
                }
                .padding(16)
            }
            .navigationTitle("PC Remote")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { statusPill }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showSettings = true } label: { Image(systemName: "gearshape") }
                }
            }
            .sheet(isPresented: $showSettings) { SettingsView() }
            .confirmationDialog("\(pendingConfirm?.label ?? "") the PC?", isPresented: Binding(
                get: { pendingConfirm != nil }, set: { if !$0 { pendingConfirm = nil } }
            ), titleVisibility: .visible) {
                Button(pendingConfirm?.label ?? "OK", role: .destructive) {
                    if let action = pendingConfirm { send(action.command) }
                }
            }
        }
        .onAppear {
            speech.onFinished = { send($0) }
            if mediatorURL.isEmpty || token.isEmpty { showSettings = true }
        }
        .task {
            while !Task.isCancelled {
                await refreshStatus()
                try? await Task.sleep(for: .seconds(5))
            }
        }
    }

    private var micSection: some View {
        VStack(spacing: 12) {
            Button { speech.toggle() } label: {
                Image(systemName: speech.isListening ? "waveform" : "mic.fill")
                    .font(.system(size: 52, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 150, height: 150)
                    .background(
                        Circle().fill(LinearGradient(
                            colors: speech.isListening ? [.pink, .red] : [.blue, .purple],
                            startPoint: .topLeading, endPoint: .bottomTrailing))
                    )
                    .shadow(color: (speech.isListening ? Color.red : Color.blue).opacity(0.4), radius: 20, y: 8)
                    .symbolEffect(.variableColor.iterative, isActive: speech.isListening)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(speech.isListening ? "Stop listening" : "Start listening")

            Text(speech.transcript.isEmpty ? " " : speech.transcript)
                .font(.title3.weight(.medium))
                .multilineTextAlignment(.center)
            Text(speech.errorMessage ?? (speech.isListening ? "Listening…" : hint))
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 8)
    }

    private var inputRow: some View {
        HStack {
            TextField("Or type a command…", text: $typed)
                .textFieldStyle(.roundedBorder)
                .submitLabel(.send)
                .onSubmit { send(typed); typed = "" }
            Button("Send") { send(typed); typed = "" }
                .buttonStyle(.borderedProminent)
                .disabled(typed.trimmingCharacters(in: .whitespaces).isEmpty)
        }
    }

    private var quickGrid: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("QUICK ACTIONS").font(.caption).foregroundStyle(.secondary)
            LazyVGrid(columns: columns, spacing: 10) {
                ForEach(quickActions) { action in
                    Button {
                        if action.confirm { pendingConfirm = action } else { send(action.command) }
                    } label: {
                        VStack(spacing: 6) {
                            Image(systemName: action.icon).font(.title3)
                            Text(action.label).font(.caption2).lineLimit(1).minimumScaleFactor(0.7)
                        }
                        .frame(maxWidth: .infinity, minHeight: 62)
                        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14))
                        .foregroundStyle(action.confirm ? Color.orange : Color.primary)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var history: some View {
        VStack(alignment: .leading, spacing: 8) {
            if !log.isEmpty { Text("RECENT").font(.caption).foregroundStyle(.secondary) }
            ForEach(log) { entry in
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: entry.ok ? "checkmark.circle.fill" : "xmark.octagon.fill")
                        .foregroundStyle(entry.ok ? .green : .red)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(entry.said).font(.body.weight(.semibold))
                        Text(entry.reply).font(.footnote).foregroundStyle(.secondary)
                    }
                    Spacer(minLength: 0)
                }
                .padding(12)
                .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
            }
        }
    }

    private var statusPill: some View {
        HStack(spacing: 6) {
            Circle().fill(pcName == nil ? Color.red : Color.green).frame(width: 8, height: 8)
            Text(pcName.map { "\($0) online" } ?? "PC offline").font(.caption)
        }
    }

    private func refreshStatus() async {
        let status = try? await MediatorClient.status()
        pcName = status?.agents.first.map { $0.hostname ?? $0.name }
    }

    private func send(_ text: String) {
        let text = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        hint = "Sending…"
        Task {
            do {
                let response = try await MediatorClient.send(text)
                let reply = response.message ?? (response.ok ? "Done" : "Failed")
                let detail = response.understood.map { "\($0) → \(reply)" } ?? reply
                log.insert(LogEntry(said: text, reply: detail, ok: response.ok), at: 0)
                hint = (response.ok ? "✓ " : "✗ ") + reply
                UINotificationFeedbackGenerator().notificationOccurred(response.ok ? .success : .error)
                Speaker.shared.say(reply)
            } catch {
                log.insert(LogEntry(said: text, reply: error.localizedDescription, ok: false), at: 0)
                hint = "✗ " + error.localizedDescription
                UINotificationFeedbackGenerator().notificationOccurred(.error)
            }
            if log.count > 30 { log.removeLast(log.count - 30) }
        }
    }
}

#Preview {
    ContentView()
}
