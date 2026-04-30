import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/auth/auth_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/ogp_avatar.dart';
import '../../../../shared/widgets/ogp_button.dart';
import '../../../../shared/widgets/confirmation_dialog.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Center(
            child: Column(
              children: [
                OgpAvatar(
                  imageUrl: user?.avatarUrl,
                  initials: user?.initials ?? '?',
                  size: 80,
                ),
                const SizedBox(height: 16),
                Text(
                  user?.fullName ?? '',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 4),
                Text(
                  user?.email ?? '',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                if (user?.phone != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    user!.phone!,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 40),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.download_outlined),
            title: const Text('Downloads'),
            trailing: const Icon(Icons.chevron_right, color: AppColors.textTertiary),
            onTap: () => context.go('/portal/profile/downloads'),
          ),
          const Divider(),
          const SizedBox(height: 24),
          OgpButton(
            label: 'Sign Out',
            variant: OgpButtonVariant.outlined,
            isFullWidth: true,
            onPressed: () async {
              final confirmed = await ConfirmationDialog.show(
                context,
                title: 'Sign Out',
                message: 'Are you sure you want to sign out?',
                confirmLabel: 'Sign Out',
              );
              if (confirmed) {
                await ref.read(authProvider.notifier).logout();
              }
            },
          ),
        ],
      ),
    );
  }
}
