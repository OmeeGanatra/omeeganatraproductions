import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/auth/auth_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/ogp_avatar.dart';
import '../../../../shared/widgets/ogp_button.dart';
import '../../../../shared/widgets/confirmation_dialog.dart';
import '../../../../shared/widgets/label_mono.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          if (user != null) ...[
            Center(
              child: Column(
                children: [
                  OgpAvatar(
                    imageUrl: user.avatarUrl,
                    initials: user.initials,
                    size: 64,
                  ),
                  const SizedBox(height: 12),
                  Text(user.fullName, style: Theme.of(context).textTheme.titleLarge),
                  Text(user.email, style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: LabelMono(
                      user.isAdmin ? 'admin' : 'client',
                      color: AppColors.gold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            const Divider(),
          ],
          ListTile(
            leading: const Icon(Icons.dark_mode_outlined),
            title: const Text('Theme'),
            subtitle: const Text('Dark'),
            trailing: const Icon(Icons.chevron_right, color: AppColors.textTertiary),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.notifications_outlined),
            title: const Text('Notifications'),
            trailing: Switch(
              value: true,
              onChanged: (_) {},
              activeColor: AppColors.gold,
            ),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('App Version'),
            trailing: const Text('1.0.0', style: TextStyle(color: AppColors.textTertiary)),
          ),
          const Divider(),
          const SizedBox(height: 32),
          OgpButton(
            label: 'Sign Out',
            variant: OgpButtonVariant.danger,
            isFullWidth: true,
            onPressed: () async {
              final confirmed = await ConfirmationDialog.show(
                context,
                title: 'Sign Out',
                message: 'Are you sure you want to sign out?',
                confirmLabel: 'Sign Out',
                isDangerous: true,
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
