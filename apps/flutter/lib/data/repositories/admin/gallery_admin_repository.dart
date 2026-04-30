import 'package:cloud_firestore/cloud_firestore.dart';
import '../../models/gallery.dart';
import '../../models/media_item.dart';

class GalleryAdminRepository {
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

  Future<Gallery> updateGallery(
      String projectId, String galleryId, Map<String, dynamic> data) async {
    await _db
        .collection('projects')
        .doc(projectId)
        .collection('galleries')
        .doc(galleryId)
        .update(data);
    return getGallery(projectId, galleryId);
  }

  Future<void> deleteGallery(String projectId, String galleryId) async {
    await _db
        .collection('projects')
        .doc(projectId)
        .collection('galleries')
        .doc(galleryId)
        .delete();
  }

  Future<void> publishGallery(String projectId, String galleryId) async {
    await _db
        .collection('projects')
        .doc(projectId)
        .collection('galleries')
        .doc(galleryId)
        .update({'status': 'PUBLISHED'});
  }

  Future<List<MediaItem>> listMedia(
      String projectId, String galleryId) async {
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

  Future<void> deleteMediaItem(
      String projectId, String galleryId, String mediaId) async {
    await _db
        .collection('projects')
        .doc(projectId)
        .collection('galleries')
        .doc(galleryId)
        .collection('media')
        .doc(mediaId)
        .delete();
  }
}
