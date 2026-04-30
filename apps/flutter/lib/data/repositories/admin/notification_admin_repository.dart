import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../../models/notification_model.dart';

class NotificationAdminRepository {
  const NotificationAdminRepository(this._api);
  final ApiClient _api;

  Future<List<NotificationModel>> listNotifications() async {
    final r = await _api.get(Endpoints.adminNotifications);
    final data = r.data;
    final items = data is Map
        ? (data['notifications'] ?? data['data'] ?? [])
        : data;
    return (items as List)
        .map((j) => NotificationModel.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<void> sendToClient({
    required String clientId,
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) async {
    await _api.post(Endpoints.adminNotificationsSend, data: {
      'clientId': clientId,
      'title': title,
      'body': body,
      if (data != null) 'data': data,
    });
  }

  Future<void> broadcast({
    required String title,
    required String body,
    Map<String, dynamic>? data,
  }) async {
    await _api.post(Endpoints.adminNotificationsBroadcast, data: {
      'title': title,
      'body': body,
      if (data != null) 'data': data,
    });
  }
}
