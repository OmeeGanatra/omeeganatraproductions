import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class FavoritesRepository {
  final _db = FirebaseFirestore.instance;
  String? get _uid => FirebaseAuth.instance.currentUser?.uid;

  CollectionReference get _col =>
      _db.collection('favorites').doc(_uid).collection('items');

  Future<List<String>> listFavoriteIds() async {
    if (_uid == null) return [];
    final snap = await _col.get();
    return snap.docs.map((d) => d.id).toList();
  }

  Future<void> addFavorite(
    String mediaItemId, {
    String? projectId,
    String? galleryId,
  }) async {
    if (_uid == null) return;
    await _col.doc(mediaItemId).set({
      'addedAt': FieldValue.serverTimestamp(),
      if (projectId != null) 'projectId': projectId,
      if (galleryId != null) 'galleryId': galleryId,
    });
  }

  Future<void> removeFavorite(String mediaItemId) async {
    if (_uid == null) return;
    await _col.doc(mediaItemId).delete();
  }
}
