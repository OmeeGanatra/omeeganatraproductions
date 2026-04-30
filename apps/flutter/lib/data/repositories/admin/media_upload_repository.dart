import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';

class MediaUploadRepository {
  final _db = FirebaseFirestore.instance;
  final _storage = FirebaseStorage.instance;

  /// Upload raw bytes to Firebase Storage under
  /// projects/{projectId}/galleries/{galleryId}/{filename}
  /// and write a media document to Firestore.
  Future<String> uploadMediaItem({
    required String projectId,
    required String galleryId,
    required String filename,
    required List<int> bytes,
    required String contentType,
    int sortOrder = 0,
  }) async {
    final storagePath = 'projects/$projectId/galleries/$galleryId/$filename';
    final ref = _storage.ref(storagePath);

    final metadata = SettableMetadata(contentType: contentType);
    await ref.putData(Uint8List.fromList(bytes), metadata);

    final downloadUrl = await ref.getDownloadURL();

    // Write Firestore media document
    final docRef = await _db
        .collection('projects')
        .doc(projectId)
        .collection('galleries')
        .doc(galleryId)
        .collection('media')
        .add({
      'galleryId': galleryId,
      'projectId': projectId,
      'filenameOriginal': filename,
      'type': _inferType(contentType),
      'displayUrl': downloadUrl,
      'thumbnailUrl': downloadUrl,
      'storagePath': storagePath,
      'sortOrder': sortOrder,
      'isHighlight': false,
      'createdAt': FieldValue.serverTimestamp(),
    });

    return docRef.id;
  }

  String _inferType(String contentType) {
    if (contentType.startsWith('video/')) return 'video';
    return 'photo';
  }
}
