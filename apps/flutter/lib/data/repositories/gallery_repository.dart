import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/gallery.dart';
import '../models/media_item.dart';

class GalleryRepository {
  final _db = FirebaseFirestore.instance;

  Future<Gallery> getGallery(String projectId, String galleryId) async {
    final doc = await _db
        .collection('projects')
        .doc(projectId)
        .collection('galleries')
        .doc(galleryId)
        .get();
    return Gallery.fromFirestore(doc);
  }

  Future<List<MediaItem>> listMedia(String projectId, String galleryId) async {
    final snap = await _db
        .collection('projects')
        .doc(projectId)
        .collection('galleries')
        .doc(galleryId)
        .collection('media')
        .orderBy('sortOrder')
        .get();
    return snap.docs.map((d) => MediaItem.fromFirestore(d)).toList();
  }

  /// Password verification: check stored password directly.
  /// For production hardening use a Cloud Function instead.
  Future<bool> verifyPassword(
      String projectId, String galleryId, String password) async {
    final doc = await _db
        .collection('projects')
        .doc(projectId)
        .collection('galleries')
        .doc(galleryId)
        .get();
    final storedPassword = doc.data()?['password'] as String?;
    return storedPassword == null || storedPassword == password;
  }
}
