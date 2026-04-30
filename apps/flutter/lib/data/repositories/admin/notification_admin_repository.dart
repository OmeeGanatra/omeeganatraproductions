import 'package:cloud_firestore/cloud_firestore.dart';
import '../../models/notification_model.dart';

class NotificationAdminRepository {
  final _db = FirebaseFirestore.instance;

  Future<List<NotificationModel>> listNotifications() async {
    final snap = await _db
        .collection('notifications')
        .orderBy('createdAt', descending: true)
        .limit(100)
        .get();
    return snap.docs.map((d) => NotificationModel.fromFirestore(d)).toList();
  }

  Future<void> sendNotification(
    String recipientId,
    String type,
    String title,
    String body,
  ) async {
    await _db.collection('notifications').add({
      'recipientId': recipientId,
      'type': type,
      'title': title,
      'body': body,
      'isRead': false,
      'channel': 'IN_APP',
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> sendToClient({
    required String clientId,
    required String title,
    required String body,
    String type = 'general',
    Map<String, dynamic>? data,
  }) async {
    await _db.collection('notifications').add({
      'recipientId': clientId,
      'type': type,
      'title': title,
      'body': body,
      'isRead': false,
      'channel': 'IN_APP',
      'createdAt': FieldValue.serverTimestamp(),
      if (data != null) 'data': data,
    });
  }

  Future<void> broadcastToProject(
    String projectId,
    String type,
    String title,
    String body,
  ) async {
    final project = await _db.collection('projects').doc(projectId).get();
    final clientIds =
        List<String>.from(project.data()?['clientIds'] as List<dynamic>? ?? []);
    final batch = _db.batch();
    for (final uid in clientIds) {
      final ref = _db.collection('notifications').doc();
      batch.set(ref, {
        'recipientId': uid,
        'type': type,
        'title': title,
        'body': body,
        'isRead': false,
        'channel': 'IN_APP',
        'createdAt': FieldValue.serverTimestamp(),
        'data': {'projectId': projectId},
      });
    }
    await batch.commit();
  }

  Future<void> broadcast({
    required String title,
    required String body,
    String type = 'general',
    Map<String, dynamic>? data,
  }) async {
    final clientsSnap = await _db.collection('clients').get();
    final batch = _db.batch();
    for (final client in clientsSnap.docs) {
      final ref = _db.collection('notifications').doc();
      batch.set(ref, {
        'recipientId': client.id,
        'type': type,
        'title': title,
        'body': body,
        'isRead': false,
        'channel': 'IN_APP',
        'createdAt': FieldValue.serverTimestamp(),
        if (data != null) 'data': data,
      });
    }
    await batch.commit();
  }
}
