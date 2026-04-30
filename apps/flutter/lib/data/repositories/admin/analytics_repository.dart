import 'package:cloud_firestore/cloud_firestore.dart';
import '../../models/analytics_stats.dart';

class AnalyticsRepository {
  final _db = FirebaseFirestore.instance;

  Future<AnalyticsStats> getDashboard() async {
    // Run counts in parallel
    final results = await Future.wait([
      _db.collection('clients').count().get(),
      _db.collection('projects').count().get(),
      _db.collectionGroup('galleries').count().get(),
      _db.collectionGroup('media').count().get(),
      _db.collection('downloadLogs').count().get(),
    ]);

    final clientCount = results[0].count ?? 0;
    final projectCount = results[1].count ?? 0;
    final galleryCount = results[2].count ?? 0;
    final mediaCount = results[3].count ?? 0;
    final downloadCount = results[4].count ?? 0;

    return AnalyticsStats(
      totalClients: clientCount,
      totalProjects: projectCount,
      totalGalleries: galleryCount,
      totalMedia: mediaCount,
      totalDownloads: downloadCount,
    );
  }

  Future<List<DownloadStat>> getDownloadStats() async {
    final snap = await _db
        .collection('downloadLogs')
        .orderBy('createdAt', descending: true)
        .limit(30)
        .get();

    // Group by date
    final Map<String, int> byDate = {};
    for (final doc in snap.docs) {
      final data = doc.data();
      final ts = data['createdAt'];
      DateTime? date;
      if (ts is Timestamp) date = ts.toDate();
      if (date == null) continue;
      final key =
          '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      byDate[key] = (byDate[key] ?? 0) + 1;
    }

    return byDate.entries
        .map((e) => DownloadStat(date: e.key, count: e.value))
        .toList()
      ..sort((a, b) => a.date.compareTo(b.date));
  }

  Future<Map<String, dynamic>> getStorageStats() async {
    // Storage size is not directly queryable from Firestore client SDK;
    // return a placeholder — real values require the Firebase Admin SDK or
    // a Cloud Function that writes aggregated stats to a summary doc.
    final doc = await _db.collection('_admin').doc('storageStats').get();
    return doc.data() ?? {'storageUsedBytes': 0};
  }
}
