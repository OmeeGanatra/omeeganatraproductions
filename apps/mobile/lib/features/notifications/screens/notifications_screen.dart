import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/notification_model.dart';

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  return NotificationsNotifier();
});

class NotificationsState {
  final List<NotificationModel> notifications;
  final bool isLoading;
  final String? error;

  const NotificationsState({
    this.notifications = const [],
    this.isLoading = false,
    this.error,
  });

  int get unreadCount => notifications.where((n) => !n.isRead).length;

  List<NotificationModel> get todayItems =>
      notifications.where((n) => n.isToday).toList();

  List<NotificationModel> get thisWeekItems =>
      notifications.where((n) => n.isThisWeek).toList();

  List<NotificationModel> get earlierItems =>
      notifications.where((n) => !n.isToday && !n.isThisWeek).toList();

  NotificationsState copyWith({
    List<NotificationModel>? notifications,
    bool? isLoading,
    String? error,
  }) {
    return NotificationsState(
      notifications: notifications ?? this.notifications,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  NotificationsNotifier() : super(const NotificationsState()) {
    loadNotifications();
  }

  Future<void> loadNotifications() async {
    state = state.copyWith(isLoading: true);

    try {
      final response =
          await ApiClient.instance.get(Endpoints.notifications);
      final data = response.data;
      final List<dynamic> items = data is Map
          ? (data['notifications'] ?? data['data'] ?? [])
          : data;
      final notifications = items
          .map((n) => NotificationModel.fromJson(n as Map<String, dynamic>))
          .toList();
      state = state.copyWith(notifications: notifications, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load notifications',
      );
    }
  }

  void markAsRead(String notificationId) async {
    final updated = state.notifications.map((n) {
      if (n.id == notificationId) return n.copyWith(isRead: true);
      return n;
    }).toList();
    state = state.copyWith(notifications: updated);

    try {
      await ApiClient.instance
          .put(Endpoints.markNotificationRead(notificationId));
    } catch (_) {}
  }

  void markAllAsRead() async {
    final updated =
        state.notifications.map((n) => n.copyWith(isRead: true)).toList();
    state = state.copyWith(notifications: updated);

    try {
      await ApiClient.instance.put(Endpoints.markAllNotificationsRead);
    } catch (_) {}
  }
}

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifState = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Notifications',
          style: GoogleFonts.playfairDisplay(
            fontSize: 24,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          if (notifState.unreadCount > 0)
            TextButton(
              onPressed: () {
                ref.read(notificationsProvider.notifier).markAllAsRead();
              },
              child: Text(
                'Mark all read',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppColors.gold,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.gold,
        backgroundColor: AppColors.surfaceDark,
        onRefresh: () =>
            ref.read(notificationsProvider.notifier).loadNotifications(),
        child: _buildBody(context, ref, notifState),
      ),
    );
  }

  Widget _buildBody(
      BuildContext context, WidgetRef ref, NotificationsState state) {
    if (state.isLoading && state.notifications.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.gold),
      );
    }

    if (state.notifications.isEmpty) {
      return _buildEmptyState();
    }

    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: [
        if (state.todayItems.isNotEmpty) ...[
          _SectionHeader(title: 'Today'),
          ...state.todayItems.map((n) => _NotificationTile(
                notification: n,
                onDismiss: () {
                  ref
                      .read(notificationsProvider.notifier)
                      .markAsRead(n.id);
                },
              )),
        ],
        if (state.thisWeekItems.isNotEmpty) ...[
          _SectionHeader(title: 'This Week'),
          ...state.thisWeekItems.map((n) => _NotificationTile(
                notification: n,
                onDismiss: () {
                  ref
                      .read(notificationsProvider.notifier)
                      .markAsRead(n.id);
                },
              )),
        ],
        if (state.earlierItems.isNotEmpty) ...[
          _SectionHeader(title: 'Earlier'),
          ...state.earlierItems.map((n) => _NotificationTile(
                notification: n,
                onDismiss: () {
                  ref
                      .read(notificationsProvider.notifier)
                      .markAsRead(n.id);
                },
              )),
        ],
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.gold.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.notifications_none_outlined,
              size: 40,
              color: AppColors.gold.withOpacity(0.4),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'All caught up',
            style: GoogleFonts.playfairDisplay(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "You'll be notified when new\ngalleries are ready",
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppColors.textTertiary,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.textTertiary,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.notification,
    required this.onDismiss,
  });

  final NotificationModel notification;
  final VoidCallback onDismiss;

  IconData _iconForType(String type) {
    switch (type) {
      case 'gallery_ready':
        return Icons.collections_outlined;
      case 'new_photos':
        return Icons.photo_library_outlined;
      case 'download_ready':
        return Icons.download_done_outlined;
      case 'message':
        return Icons.chat_bubble_outline;
      case 'reminder':
        return Icons.event_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _colorForType(String type) {
    switch (type) {
      case 'gallery_ready':
        return AppColors.gold;
      case 'new_photos':
        return AppColors.success;
      case 'download_ready':
        return const Color(0xFF42A5F5);
      case 'message':
        return AppColors.receptionPink;
      case 'reminder':
        return AppColors.warning;
      default:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final iconColor = _colorForType(notification.type);

    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDismiss(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        color: AppColors.gold.withOpacity(0.1),
        child: const Icon(
          Icons.done,
          color: AppColors.gold,
        ),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          color: notification.isRead
              ? Colors.transparent
              : AppColors.gold.withOpacity(0.03),
          border: Border(
            bottom: BorderSide(
              color: const Color(0xFF2A2A2A).withOpacity(0.5),
              width: 0.5,
            ),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                _iconForType(notification.type),
                color: iconColor,
                size: 20,
              ),
            ),
            const SizedBox(width: 14),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: notification.isRead
                                ? FontWeight.w400
                                : FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      // Unread dot
                      if (!notification.isRead)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.gold,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.body,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: AppColors.textTertiary,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    notification.timeAgo,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: AppColors.textTertiary.withOpacity(0.7),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
