import AVFoundation
import Speech

/// Live speech-to-text with Apple's Speech framework. Stops by itself after a
/// short pause and hands the final sentence to `onFinished`.
@MainActor
final class SpeechRecognizer: ObservableObject {
    @Published var transcript = ""
    @Published var isListening = false
    @Published var errorMessage: String?

    var onFinished: ((String) -> Void)?

    private let recognizer = SFSpeechRecognizer(locale: Locale.current) ?? SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private let audioEngine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var silenceTimer: Timer?
    private let silenceSeconds: TimeInterval = 1.4

    func requestPermissions() async -> Bool {
        let speechOK = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }
        let micOK = await AVAudioApplication.requestRecordPermission()
        if !speechOK || !micOK {
            errorMessage = "Allow Microphone and Speech Recognition in Settings › PC Remote."
        }
        return speechOK && micOK
    }

    func toggle() {
        if isListening { finish() } else { Task { await start() } }
    }

    func start() async {
        guard !isListening else { return }
        guard await requestPermissions() else { return }
        guard let recognizer, recognizer.isAvailable else {
            errorMessage = "Speech recognition isn't available right now."
            return
        }
        transcript = ""
        errorMessage = nil

        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .measurement, options: [.duckOthers, .defaultToSpeaker])
            try session.setActive(true, options: .notifyOthersOnDeactivation)

            let request = SFSpeechAudioBufferRecognitionRequest()
            request.shouldReportPartialResults = true
            request.addsPunctuation = false
            self.request = request

            let input = audioEngine.inputNode
            let format = input.outputFormat(forBus: 0)
            input.removeTap(onBus: 0)
            input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
                request.append(buffer)
            }
            audioEngine.prepare()
            try audioEngine.start()
            isListening = true
            restartSilenceTimer(after: 6)  // give up if nothing is said at all

            task = recognizer.recognitionTask(with: request) { [weak self] result, recognitionError in
                Task { @MainActor in
                    guard let self, self.isListening else { return }
                    if let result {
                        self.transcript = result.bestTranscription.formattedString
                        self.restartSilenceTimer(after: self.silenceSeconds)
                        if result.isFinal { self.finish() }
                    } else if recognitionError != nil {
                        self.finish()
                    }
                }
            }
        } catch {
            errorMessage = error.localizedDescription
            stopAudio()
        }
    }

    func finish() {
        guard isListening else { return }
        isListening = false
        stopAudio()
        let text = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        if !text.isEmpty { onFinished?(text) }
    }

    private func restartSilenceTimer(after seconds: TimeInterval) {
        silenceTimer?.invalidate()
        silenceTimer = Timer.scheduledTimer(withTimeInterval: seconds, repeats: false) { [weak self] _ in
            Task { @MainActor in self?.finish() }
        }
    }

    private func stopAudio() {
        silenceTimer?.invalidate()
        silenceTimer = nil
        if audioEngine.isRunning { audioEngine.stop() }
        audioEngine.inputNode.removeTap(onBus: 0)
        request?.endAudio()
        task?.cancel()
        request = nil
        task = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}

/// Reads replies out loud when enabled in Settings.
final class Speaker {
    static let shared = Speaker()
    private let synth = AVSpeechSynthesizer()

    func say(_ text: String) {
        guard UserDefaults.standard.bool(forKey: Settings.speakRepliesKey) else { return }
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
        try? AVAudioSession.sharedInstance().setActive(true)
        synth.stopSpeaking(at: .immediate)
        synth.speak(AVSpeechUtterance(string: text))
    }
}
