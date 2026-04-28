import 'dart:convert';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> handleBackgroundMessage(RemoteMessage message) async {
  debugPrint('[Push] Background message: ${message.messageId}');
}

class PushService {
  PushService._();

  static final PushService instance = PushService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  GoRouter? _router;
  bool _initialized = false;

  /// Android notification channel for high-importance notifications
  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'ogp_notifications',
    'OGP Notifications',
    description: 'Notifications from Omee Ganatra Productions',
    importance: Importance.high,
    enableVibration: true,
    showBadge: true,
  );

  /// Initialize push notifications
  Future<void> initialize({GoRouter? router}) async {
    if (_initialized) return;

    _router = router;

    // Request permission
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
      announcement: false,
      carPlay: false,
      criticalAlert: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('[Push] Notification permission denied');
      return;
    }

    debugPrint(
      '[Push] Permission status: ${settings.authorizationStatus}',
    );

    // Initialize local notifications
    await _initializeLocalNotifications();

    // Set up foreground message handler
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Set up background message handler
    FirebaseMessaging.onBackgroundMessage(handleBackgroundMessage);

    // Handle notification taps when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Check if app was opened from a notification
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }

    // Get FCM token and register with backend
    await _registerToken();

    // Listen for token refresh
    _messaging.onTokenRefresh.listen((token) {
      _registerTokenWithBackend(token);
    });

    _initialized = true;
    debugPrint('[Push] Push service initialized');
  }

  /// Initialize Flutter Local Notifications
  Future<void> _initializeLocalNotifications() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    await _localNotifications.initialize(
      const InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      ),
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Create Android notification channel
    if (Platform.isAndroid) {
      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);
    }
  }

  /// Handle foreground messages: show a local notification
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('[Push] Foreground message: ${message.notification?.title}');

    final notification = message.notification;
    if (notification == null) return;

    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
          color: const Color(0xFFD4AF37),
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: jsonEncode(message.data),
    );
  }

  /// Handle notification tap when app is in background/terminated
  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('[Push] Notification tapped: ${message.data}');
    _navigateFromData(message.data);
  }

  /// Handle local notification tap
  void _onNotificationTapped(NotificationResponse response) {
    if (response.payload == null) return;

    try {
      final data = jsonDecode(response.payload!) as Map<String, dynamic>;
      _navigateFromData(data);
    } catch (e) {
      debugPrint('[Push] Failed to parse notification payload: $e');
    }
  }

  /// Navigate based on notification data
  void _navigateFromData(Map<String, dynamic> data) {
    if (_router == null) return;

    final type = data['type'] as String?;
    final projectSlug = data['projectSlug'] as String?;
    final galleryId = data['galleryId'] as String?;
    final mediaId = data['mediaId'] as String?;

    switch (type) {
      case 'gallery_ready':
        if (projectSlug != null && galleryId != null) {
          _router!.go('/projects/$projectSlug/galleries/$galleryId');
        } else if (projectSlug != null) {
          _router!.go('/projects/$projectSlug');
        }
        break;

      case 'new_photos':
        if (projectSlug != null && galleryId != null) {
          _router!.go('/projects/$projectSlug/galleries/$galleryId');
        }
        break;

      case 'download_ready':
        _router!.go('/profile/downloads');
        break;

      case 'media_highlight':
        if (mediaId != null) {
          _router!.go('/media/$mediaId');
        }
        break;

      default:
        _router!.go('/notifications');
        break;
    }
  }

  /// Get FCM token and register with backend
  Future<void> _registerToken() async {
    try {
      final token = await _messaging.getToken();
      if (token != null) {
        await _registerTokenWithBackend(token);
      }
    } catch (e) {
      debugPrint('[Push] Failed to get FCM token: $e');
    }
  }

  /// Register the FCM token with the backend API
  Future<void> _registerTokenWithBackend(String token) async {
    try {
      await ApiClient.instance.post(
        Endpoints.registerDevice,
        data: {
          'fcmToken': token,
          'platform': Platform.isIOS ? 'ios' : 'android',
          'deviceModel': Platform.localHostname,
        },
      );
      debugPrint('[Push] Token registered with backend');
    } catch (e) {
      debugPrint('[Push] Failed to register token: $e');
    }
  }

  /// Unregister the device from push notifications
  Future<void> unregister() async {
    try {
      final token = await _messaging.getToken();
      if (token != null) {
        await ApiClient.instance.post(
          Endpoints.unregisterDevice,
          data: {'fcmToken': token},
        );
      }
      await _messaging.deleteToken();
      debugPrint('[Push] Device unregistered');
    } catch (e) {
      debugPrint('[Push] Failed to unregister: $e');
    }
  }

  /// Get the current FCM token
  Future<String?> getToken() async {
    return await _messaging.getToken();
  }
}
