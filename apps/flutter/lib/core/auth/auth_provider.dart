import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/endpoints.dart';
import '../storage/token_storage.dart';

class AuthUser {
  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final String? avatarUrl;
  final String type;

  const AuthUser({
    required this.id,
    required this.fullName,
    required this.email,
    required this.type,
    this.phone,
    this.avatarUrl,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      fullName: (json['fullName'] ?? json['name'] ?? '') as String,
      email: json['email'] as String? ?? '',
      type: (json['type'] ?? 'client') as String,
      phone: json['phone'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  bool get isAdmin => type == 'admin' || type == 'superadmin';
  bool get isClient => type == 'client';

  String get initials {
    final parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    if (fullName.isNotEmpty) return fullName[0].toUpperCase();
    return email.isNotEmpty ? email[0].toUpperCase() : '?';
  }
}

class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final AuthUser? user;
  final String? error;
  final bool requiresOtp;
  final String? challengeId;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.user,
    this.error,
    this.requiresOtp = false,
    this.challengeId,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    AuthUser? user,
    String? error,
    bool? requiresOtp,
    String? challengeId,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      error: error,
      requiresOtp: requiresOtp ?? this.requiresOtp,
      challengeId: challengeId ?? this.challengeId,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState(isLoading: true)) {
    _loadStoredAuth();
  }

  final _api = ApiClient.instance;
  final _tokenStorage = TokenStorage.instance;

  Future<void> _loadStoredAuth() async {
    try {
      final hasTokens = await _tokenStorage.hasTokens();
      if (!hasTokens) {
        state = const AuthState(isLoading: false);
        return;
      }

      final response = await _api.get(Endpoints.authMe);
      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final userJson = data['user'] as Map<String, dynamic>? ?? data;
        final user = AuthUser.fromJson(userJson);
        state = AuthState(isAuthenticated: true, isLoading: false, user: user);
      } else {
        await _tokenStorage.clearAll();
        state = const AuthState(isLoading: false);
      }
    } catch (_) {
      await _tokenStorage.clearAll();
      state = const AuthState(isLoading: false);
    }
  }

  Future<void> login(String email, String password, {bool isAdmin = false}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final endpoint = isAdmin ? Endpoints.authAdminLogin : Endpoints.authClientLogin;
      final response = await _api.post(
        endpoint,
        data: {'email': email, 'password': password},
      );

      final data = response.data as Map<String, dynamic>;

      if (data['requiresOtp'] == true) {
        state = state.copyWith(
          isLoading: false,
          requiresOtp: true,
          challengeId: data['challengeId'] as String?,
        );
        return;
      }

      await _handleAuthSuccess(data);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _parseError(e));
    }
  }

  Future<void> verifyOtp(String code) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final challengeId = state.challengeId;
      if (challengeId == null) throw StateError('No active OTP challenge');

      final response = await _api.post(
        Endpoints.authVerifyOtp,
        data: {'challengeId': challengeId, 'code': code},
      );

      final data = response.data as Map<String, dynamic>;
      await _handleAuthSuccess(data);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _parseError(e));
    }
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _tokenStorage.getRefreshToken();
      await _api.post(
        Endpoints.authLogout,
        data: refreshToken != null ? {'refreshToken': refreshToken} : null,
      );
    } catch (_) {}
    await _tokenStorage.clearAll();
    state = const AuthState();
  }

  Future<void> _handleAuthSuccess(Map<String, dynamic> data) async {
    final accessToken = data['accessToken'] as String?;
    final refreshToken = data['refreshToken'] as String?;
    final userData = data['user'] as Map<String, dynamic>?;

    if (accessToken != null && refreshToken != null) {
      await _tokenStorage.saveAuthData(
        accessToken: accessToken,
        refreshToken: refreshToken,
        userId: userData?['id'] as String?,
        userEmail: userData?['email'] as String?,
        userName: userData?['fullName'] as String?,
      );
    }

    final user = userData != null ? AuthUser.fromJson(userData) : null;
    state = AuthState(isAuthenticated: true, user: user);
  }

  String _parseError(dynamic e) {
    final msg = e.toString();
    if (msg.contains('401')) return 'Invalid email or password';
    if (msg.contains('429')) return 'Too many attempts. Please try later.';
    if (msg.contains('SocketException') || msg.contains('Connection')) {
      return 'No internet connection';
    }
    return 'Something went wrong. Please try again.';
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
