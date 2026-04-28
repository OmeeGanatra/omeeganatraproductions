import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/theme/app_theme.dart';
import 'core/auth/auth_provider.dart';
import 'core/router/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: AppColors.scaffoldDark,
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  // Initialize Firebase
  try {
    await Firebase.initializeApp();
  } catch (_) {
    // Firebase may not be configured yet during development
  }

  runApp(
    const ProviderScope(
      child: OGPApp(),
    ),
  );
}

class OGPApp extends ConsumerStatefulWidget {
  const OGPApp({super.key});

  @override
  ConsumerState<OGPApp> createState() => _OGPAppState();
}

class _OGPAppState extends ConsumerState<OGPApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Load stored auth on startup
    Future.microtask(() {
      ref.read(authProvider.notifier).loadStoredAuth();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Auto-refresh token when app resumes
      final authState = ref.read(authProvider);
      if (authState.isAuthenticated) {
        ref.read(authProvider.notifier).refreshToken().catchError((_) {});
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Omee Ganatra Productions',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark,
      routerConfig: router,
    );
  }
}
