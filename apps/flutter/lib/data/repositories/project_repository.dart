import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/project.dart';
import '../models/gallery.dart';
import '../models/timeline_event.dart';

class ProjectRepository {
  final _db = FirebaseFirestore.instance;
  final _auth = FirebaseAuth.instance;

  String? get _uid => _auth.currentUser?.uid;

  Future<List<Project>> listProjects() async {
    if (_uid == null) return [];
    final snap = await _db
        .collection('projects')
        .where('clientIds', arrayContains: _uid)
        .where('status', isNotEqualTo: 'ARCHIVED')
        .orderBy('status')
        .orderBy('eventDate', descending: true)
        .get();
    return snap.docs.map((d) => Project.fromFirestore(d)).toList();
  }

  Future<Project> getProject(String id) async {
    // id can be either Firestore doc ID or slug — try slug first
    final bySlug = await _db
        .collection('projects')
        .where('slug', isEqualTo: id)
        .limit(1)
        .get();
    if (bySlug.docs.isNotEmpty) return Project.fromFirestore(bySlug.docs.first);
    final doc = await _db.collection('projects').doc(id).get();
    return Project.fromFirestore(doc);
  }

  Future<List<Gallery>> listGalleries(String projectId) async {
    Project project;
    try {
      project = await getProject(projectId);
    } catch (_) {
      return [];
    }
    final snap = await _db
        .collection('projects')
        .doc(project.id)
        .collection('galleries')
        .where('status', isEqualTo: 'PUBLISHED')
        .orderBy('sortOrder')
        .get();
    return snap.docs.map((d) => Gallery.fromFirestore(d)).toList();
  }

  Future<List<TimelineEvent>> getTimeline(String projectId) async {
    Project project;
    try {
      project = await getProject(projectId);
    } catch (_) {
      return [];
    }
    final snap = await _db
        .collection('projects')
        .doc(project.id)
        .collection('timeline')
        .orderBy('eventTime')
        .get();
    return snap.docs.map((d) => TimelineEvent.fromFirestore(d)).toList();
  }
}
