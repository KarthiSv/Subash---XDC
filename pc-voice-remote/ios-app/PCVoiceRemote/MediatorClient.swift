import Foundation

/// Talks to the mediator's HTTP API. Settings live in UserDefaults so the app,
/// its Siri intent and the settings screen all share them.
enum Settings {
    static let mediatorURLKey = "mediatorURL"
    static let tokenKey = "token"
    static let speakRepliesKey = "speakReplies"

    static var mediatorURL: String { UserDefaults.standard.string(forKey: mediatorURLKey) ?? "" }
    static var token: String { UserDefaults.standard.string(forKey: tokenKey) ?? "" }
}

struct CommandResponse: Decodable {
    let ok: Bool
    let message: String?
    let understood: String?
    let heard: String?
}

struct StatusResponse: Decodable {
    struct Agent: Decodable {
        let name: String
        let hostname: String?
    }
    let agents: [Agent]
}

enum MediatorError: LocalizedError {
    case notConfigured
    case badURL
    case unreadable(Int)

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "Set the mediator address and token in Settings."
        case .badURL: return "The mediator address doesn't look right."
        case .unreadable(let code): return "Unexpected reply from the mediator (HTTP \(code))."
        }
    }
}

enum MediatorClient {
    static func send(_ text: String) async throws -> CommandResponse {
        var request = try makeRequest(path: "/api/command")
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["text": text])
        request.timeoutInterval = 30
        let (data, response) = try await URLSession.shared.data(for: request)
        let code = (response as? HTTPURLResponse)?.statusCode ?? 0
        // The mediator answers with JSON for errors too (401, 422), so decode either way.
        guard let decoded = try? JSONDecoder().decode(CommandResponse.self, from: data) else {
            throw MediatorError.unreadable(code)
        }
        return decoded
    }

    static func status() async throws -> StatusResponse {
        var request = try makeRequest(path: "/api/status")
        request.timeoutInterval = 6
        let (data, response) = try await URLSession.shared.data(for: request)
        let code = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard code == 200, let decoded = try? JSONDecoder().decode(StatusResponse.self, from: data) else {
            throw MediatorError.unreadable(code)
        }
        return decoded
    }

    private static func makeRequest(path: String) throws -> URLRequest {
        var base = Settings.mediatorURL.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !base.isEmpty, !Settings.token.isEmpty else { throw MediatorError.notConfigured }
        if !base.hasPrefix("http://") && !base.hasPrefix("https://") { base = "http://" + base }
        while base.hasSuffix("/") { base.removeLast() }
        guard let url = URL(string: base + path) else { throw MediatorError.badURL }
        var request = URLRequest(url: url)
        request.setValue("Bearer \(Settings.token)", forHTTPHeaderField: "Authorization")
        return request
    }
}
