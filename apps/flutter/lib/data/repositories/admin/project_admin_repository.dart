import 'package:cloud_firestore/cloud_firestore.dart';
import '../../models/project.dart';
import '../../models/gallery.dart';

class ProjectAdminRepository {
  final _db = FirebaseFirestore.instance;

  Future<List<Project>> listProjects() async {
    final snap = await _db
        .collection('projects')
        .orderBy('eventDate', descending: true)
        .get();
    return snap.docs.map((d) => Project.fromFirestore(d)).toList();
  }

  Future<Project> getProject(String id) async {
    // Support both doc ID and slug
    final bySlug = await _db
        .collection('projects')
        .where('slug', isEqualTo: id)
        .limit(1)
        .get();
    if (bySlug.docs.isNotEmpty) return Project.fromFirestore(bySlug.docs.first);
    final doc = await _db.collection('projects').doc(id).get();
    return Project.fromFirestore(doc);
  }

  Future<Project> createProject(Map<String, dynamic> data) async {
    final ref = await _db.collection('projects').add({
      ...data,
      'clientIds': data['clientIds'] ?? [],
      'createdAt': FieldValue.serverTimestamp(),
    });
    final doc = await ref.get();
    return Project.fromFirestore(doc);
  }

  Future<Project> updateProject(String id, Map<String, dynamic> data) async {
    await _db.collection('projects').doc(id).update(data);
    final doc = await _db.collection('projects').doc(id).get();
    return Project.fromFirestore(doc);
  }

  Future<void> deleteProject(String id) async {
    await _db.collection('projects').doc(id).delete();
  }

  Future<List<Gallery>> listGalleries(String projectId) async {
    final snap = await _db
        .collection('projects')
        .doc(projectId)
        .collection('galleries')
        .orderBy('sortOrder')
        .get();
    return snap.docs.map((d) => Gallery.fromFirestore(d)).toList();
  }

  Future<Gallery> createGallery(
      String projectId, Map<String, dynamic> data) async {
    final ref = await _db
        .collection('projects')
        .doc(projectId)
        .collection('galleries')
        .add({
      ...data,
      'projectId': projectId,
      'createdAt': FieldValue.serverTimestamp(),
    });
    final doc = await ref.get();
    return Gallery.fromFirestore(doc);
  }

  Future<void> assignClient(String projectId, String clientId) async {
    await _db.collection('projects').doc(projectId).update({
      'clientIds': FieldValue.arrayUnion([clientId]),
    });
  }

  Future<void> removeClient(String projectId, String clientId) async {
    await _db.collection('projects').doc(projectId).update({
      'clientIds': FieldValue.arrayRemove([clientId]),
    });
  }
}
