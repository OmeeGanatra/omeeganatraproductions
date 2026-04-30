import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/notification_model.dart';

class NotificationRepository {
  final _db = FirebaseFirestore.instance;
  String? get _uid => FirebaseAuth.instance.currentUser?.uid;

  Future<List<NotificationModel>> listNotifications({
    bool unreadOnly = false,
  }) async {
    if (_uid == null) return [];
    Query q = _db
        .collection('notifications')
        .where('recipientId', isEqualTo: _uid)
        .orderBy('createdAt', descending: true)
        .limit(50);
    if (unreadOnly) q = q.where('isRead', isEqualTo: false);
    final snap = await q.get();
    return snap.docs.map((d) => NotificationModel.fromFirestore(d)).toList();
  }

  Future<void> markRead(String id) async {
    await _db.collection('notifications').doc(id).update({
      'isRead': true,
      'readAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> markAllRead() async {
    if (_uid == null) return;
    final snap = await _db
        .collection('notifications')
        .where('recipientId', isEqualTo: _uid)
        .where('isRead', isEqualTo: false)
        .get();
    final batch = _db.batch();
    for (final doc in snap.docs) {
      batch.update(doc.reference, {
        'isRead': true,
        'readAt': FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }
}
