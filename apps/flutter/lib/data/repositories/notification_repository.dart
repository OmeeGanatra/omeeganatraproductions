import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../models/notification_model.dart';

class NotificationRepository {
  const NotificationRepository(this._api);
  final ApiClient _api;

  Future<List<NotificationModel>> listNotifications() async {
    final r = await _api.get(Endpoints.notifications);
    final data = r.data;
    final items = data is Map
        ? (data['notifications'] ?? data['data'] ?? [])
        : data;
    return (items as List)
        .map((j) => NotificationModel.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<void> markRead(String id) async {
    await _api.post(Endpoints.markNotificationRead(id));
  }

  Future<void> markAllRead() async {
    await _api.post(Endpoints.markAllNotificationsRead);
  }
}
