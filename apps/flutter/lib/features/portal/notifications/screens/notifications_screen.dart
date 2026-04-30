import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/ogp_empty_state.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../providers/notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () =>
                ref.read(notificationsProvider.notifier).markAllRead(),
            child: const Text('Mark all read'),
          ),
        ],
      ),
      body: state.when(
        loading: () => ListView.builder(
          itemCount: 5,
          itemBuilder: (_, __) => const ShimmerCard(height: 80),
        ),
        error: (e, _) => OgpErrorView(
          message: e.toString(),
          onRetry: () => ref.read(notificationsProvider.notifier).refresh(),
        ),
        data: (notifications) {
          if (notifications.isEmpty) {
            return const OgpEmptyState(
              message: 'No notifications yet.',
              icon: Icons.notifications_outlined,
            );
          }
          return ListView.builder(
            itemCount: notifications.length,
            itemBuilder: (context, i) {
              final n = notifications[i];
              return ListTile(
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: n.isRead
                        ? AppColors.surfaceDark
                        : AppColors.gold.withOpacity(0.15),
                  ),
                  child: Icon(
                    Icons.notifications_outlined,
                    size: 20,
                    color: n.isRead ? AppColors.textTertiary : AppColors.gold,
                  ),
                ),
                title: Text(
                  n.title,
                  style: TextStyle(
                    fontWeight: n.isRead ? FontWeight.w400 : FontWeight.w600,
                  ),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(n.body, maxLines: 2, overflow: TextOverflow.ellipsis),
                    Text(n.timeAgo,
                        style: const TextStyle(
                            color: AppColors.textTertiary, fontSize: 11)),
                  ],
                ),
                isThreeLine: true,
                onTap: () {
                  if (!n.isRead) {
                    ref.read(notificationsProvider.notifier).markRead(n.id);
                  }
                },
              );
            },
          );
        },
      ),
    );
  }
}
