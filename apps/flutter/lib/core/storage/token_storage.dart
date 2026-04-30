import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  static final TokenStorage instance = TokenStorage._();
  TokenStorage._();

  String? _memAccessToken;
  String? _memRefreshToken;

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<String?> getAccessToken() async {
    if (kIsWeb) return _memAccessToken;
    return _storage.read(key: 'access_token');
  }

  Future<void> saveAccessToken(String token) async {
    if (kIsWeb) {
      _memAccessToken = token;
      return;
    }
    await _storage.write(key: 'access_token', value: token);
  }

  Future<String?> getRefreshToken() async {
    if (kIsWeb) return _memRefreshToken;
    return _storage.read(key: 'refresh_token');
  }

  Future<void> saveRefreshToken(String token) async {
    if (kIsWeb) {
      _memRefreshToken = token;
      return;
    }
    await _storage.write(key: 'refresh_token', value: token);
  }

  Future<void> saveAuthData({
    required String accessToken,
    required String refreshToken,
    String? userId,
    String? userEmail,
    String? userName,
  }) async {
    await saveAccessToken(accessToken);
    await saveRefreshToken(refreshToken);
    if (!kIsWeb) {
      if (userId != null) await _storage.write(key: 'user_id', value: userId);
      if (userEmail != null) await _storage.write(key: 'user_email', value: userEmail);
      if (userName != null) await _storage.write(key: 'user_name', value: userName);
    }
  }

  Future<bool> hasTokens() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> clearAll() async {
    _memAccessToken = null;
    _memRefreshToken = null;
    if (!kIsWeb) await _storage.deleteAll();
  }

  // Alias used by auth_provider
  Future<void> clearTokens() => clearAll();
}
