import 'package:flutter_test/flutter_test.dart';
import 'package:ogp_client/models/project.dart';
import 'package:ogp_client/models/gallery.dart';
import 'package:ogp_client/models/media_item.dart';
import 'package:ogp_client/models/notification_model.dart';

void main() {
  group('Project model', () {
    test('fromJson creates a valid project', () {
      final json = {
        'id': '1',
        'title': 'Test Wedding',
        'slug': 'test-wedding',
        'eventDate': '2024-12-25T00:00:00.000Z',
        'eventType': 'Wedding',
        'venue': 'Grand Hotel',
        'city': 'Mumbai',
        'coverImageUrl': 'https://example.com/image.jpg',
        'status': 'active',
        'galleryCount': 5,
        'totalMediaCount': 200,
      };

      final project = Project.fromJson(json);

      expect(project.id, '1');
      expect(project.title, 'Test Wedding');
      expect(project.slug, 'test-wedding');
      expect(project.eventType, 'Wedding');
      expect(project.galleryCount, 5);
      expect(project.formattedDate, '25 Dec 2024');
      expect(project.locationString, 'Grand Hotel, Mumbai');
    });

    test('toJson produces valid output', () {
      final project = Project(
        id: '1',
        title: 'Test',
        slug: 'test',
      );

      final json = project.toJson();
      expect(json['id'], '1');
      expect(json['title'], 'Test');
    });
  });

  group('Gallery model', () {
    test('fromJson creates a valid gallery', () {
      final json = {
        'id': 'g1',
        'projectId': 'p1',
        'title': 'Ceremony',
        'slug': 'ceremony',
        'mediaCount': 50,
        'downloadEnabled': true,
      };

      final gallery = Gallery.fromJson(json);

      expect(gallery.id, 'g1');
      expect(gallery.title, 'Ceremony');
      expect(gallery.mediaCount, 50);
      expect(gallery.downloadEnabled, true);
    });
  });

  group('MediaItem model', () {
    test('fromJson creates a valid media item', () {
      final json = {
        'id': 'm1',
        'galleryId': 'g1',
        'type': 'photo',
        'filenameOriginal': 'IMG_001.jpg',
        'width': 4000,
        'height': 3000,
        'fileSizeBytes': 5242880,
        'isFavorited': true,
      };

      final item = MediaItem.fromJson(json);

      expect(item.id, 'm1');
      expect(item.type, MediaType.photo);
      expect(item.isPhoto, true);
      expect(item.isVideo, false);
      expect(item.isFavorited, true);
      expect(item.aspectRatio, closeTo(1.333, 0.01));
      expect(item.formattedFileSize, '5.0 MB');
      expect(item.dimensionsString, '4000x3000');
    });

    test('copyWith preserves other fields', () {
      final item = MediaItem(
        id: 'm1',
        galleryId: 'g1',
        type: MediaType.photo,
        filenameOriginal: 'test.jpg',
        isFavorited: false,
      );

      final toggled = item.copyWith(isFavorited: true);

      expect(toggled.id, 'm1');
      expect(toggled.isFavorited, true);
      expect(toggled.filenameOriginal, 'test.jpg');
    });
  });

  group('NotificationModel', () {
    test('fromJson creates a valid notification', () {
      final json = {
        'id': 'n1',
        'type': 'gallery_ready',
        'title': 'Gallery Ready',
        'body': 'Your wedding photos are ready!',
        'isRead': false,
        'createdAt': DateTime.now().toIso8601String(),
      };

      final notification = NotificationModel.fromJson(json);

      expect(notification.id, 'n1');
      expect(notification.type, 'gallery_ready');
      expect(notification.isRead, false);
      expect(notification.isToday, true);
    });

    test('copyWith updates isRead', () {
      final notification = NotificationModel(
        id: 'n1',
        type: 'test',
        title: 'Test',
        body: 'Body',
        isRead: false,
        createdAt: DateTime.now(),
      );

      final read = notification.copyWith(isRead: true);
      expect(read.isRead, true);
      expect(read.title, 'Test');
    });
  });
}
