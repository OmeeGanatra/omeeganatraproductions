import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AuthUser {
  final String id, fullName, email;
  final bool isAdmin;
  final String? phone, avatarUrl;

  const AuthUser({
    required this.id,
    required this.fullName,
    required this.email,
    this.isAdmin = false,
    this.phone,
    this.avatarUrl,
  });

  String get initials {
    final parts = fullName.trim().split(' ');
    if (parts.length >= 2) return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    if (fullName.isNotEmpty) return fullName[0].toUpperCase();
    return email.isNotEmpty ? email[0].toUpperCase() : '?';
  }

  bool get isClient => !isAdmin;
}

class AuthState {
  final bool isAuthenticated, isLoading;
  final AuthUser? user;
  final String? error;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.user,
    this.error,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    AuthUser? user,
    String? error,
    bool clearError = false,
  }) =>
      AuthState(
        isAuthenticated: isAuthenticated ?? this.isAuthenticated,
        isLoading: isLoading ?? this.isLoading,
        user: user ?? this.user,
        error: clearError ? null : (error ?? this.error),
      );
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _checkCurrentUser();
  }

  final _auth = FirebaseAuth.instance;
  final _db = FirebaseFirestore.instance;

  void _checkCurrentUser() async {
    final user = _auth.currentUser;
    if (user == null) return;
    await _loadUserProfile(user);
  }

  Future<void> _loadUserProfile(User firebaseUser) async {
    try {
      final token = await firebaseUser.getIdTokenResult();
      final isAdmin = token.claims?['role'] == 'admin';
      final collection = isAdmin ? 'users' : 'clients';
      final doc = await _db.collection(collection).doc(firebaseUser.uid).get();
      final data = doc.data() ?? {};
      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        clearError: true,
        user: AuthUser(
          id: firebaseUser.uid,
          fullName: data['fullName'] as String? ?? firebaseUser.displayName ?? '',
          email: firebaseUser.email ?? '',
          isAdmin: isAdmin,
          phone: data['phone'] as String?,
          avatarUrl: data['avatarUrl'] as String?,
        ),
      );
    } catch (_) {
      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        clearError: true,
        user: AuthUser(
          id: firebaseUser.uid,
          fullName: firebaseUser.displayName ?? '',
          email: firebaseUser.email ?? '',
        ),
      );
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final cred = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      await _loadUserProfile(cred.user!);
    } on FirebaseAuthException catch (e) {
      state = state.copyWith(isLoading: false, error: _authError(e.code));
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Something went wrong. Please try again.',
      );
    }
  }

  Future<void> logout() async {
    await _auth.signOut();
    state = const AuthState();
  }

  String _authError(String code) {
    switch (code) {
      case 'user-not-found':
        return 'No account found with this email.';
      case 'wrong-password':
      case 'invalid-credential':
        return 'Incorrect password.';
      case 'user-disabled':
        return 'This account has been disabled.';
      case 'too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return 'Sign in failed. Please try again.';
    }
  }
}

final authProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier());

/// Stream provider for real-time auth state changes.
final authStateProvider = StreamProvider<User?>(
  (ref) => FirebaseAuth.instance.authStateChanges(),
);
