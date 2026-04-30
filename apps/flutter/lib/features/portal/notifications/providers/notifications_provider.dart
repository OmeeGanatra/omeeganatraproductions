import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../data/models/notification_model.dart';
import '../../../../data/repositories/notification_repository.dart';

final _repo = NotificationRepository();

class NotificationsNotifier
    extends StateNotifier<AsyncValue<List<NotificationModel>>> {
  NotificationsNotifier() : super(const AsyncValue.loading()) {
    _load();
  }

  Future<void> _load() async {
    state = const AsyncValue.loading();
    try {
      final items = await _repo.listNotifications();
      state = AsyncValue.data(items);
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<void> markRead(String id) async {
    await _repo.markRead(id);
    state = state.whenData(
      (items) =>
          items.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList(),
    );
  }

  Future<void> markAllRead() async {
    await _repo.markAllRead();
    state = state.whenData(
      (items) => items.map((n) => n.copyWith(isRead: true)).toList(),
    );
  }

  Future<void> refresh() => _load();
}

final notificationsProvider = StateNotifierProvider<NotificationsNotifier,
    AsyncValue<List<NotificationModel>>>(
  (ref) => NotificationsNotifier(),
);

final unreadCountProvider = Provider<int>((ref) {
  return ref.watch(notificationsProvider).maybeWhen(
        data: (items) => items.where((n) => !n.isRead).length,
        orElse: () => 0,
      );
});
