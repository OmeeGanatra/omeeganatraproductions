import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// OTP screen is no longer used — Firebase Auth handles auth natively.
/// This stub redirects to login to avoid broken routes.
class OTPScreen extends StatelessWidget {
  const OTPScreen({super.key});

  @override
  Widget build(BuildContext context) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.go('/login');
    });
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
