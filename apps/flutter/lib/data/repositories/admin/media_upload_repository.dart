import 'package:http/http.dart' as http;
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';

class UploadUrl {
  final String mediaId;
  final String uploadUrl;
  final String key;

  const UploadUrl({
    required this.mediaId,
    required this.uploadUrl,
    required this.key,
  });

  factory UploadUrl.fromJson(Map<String, dynamic> json) {
    return UploadUrl(
      mediaId: json['mediaId'] as String,
      uploadUrl: json['uploadUrl'] as String,
      key: json['key'] as String? ?? '',
    );
  }
}

class MediaUploadRepository {
  const MediaUploadRepository(this._api);
  final ApiClient _api;

  Future<List<UploadUrl>> requestUploadUrls(
    String galleryId,
    List<Map<String, dynamic>> files,
  ) async {
    final r = await _api.post(
      Endpoints.mediaUploadUrls(galleryId),
      data: {'files': files},
    );
    final data = r.data;
    final urls = data is Map ? (data['uploadUrls'] ?? data['urls'] ?? []) : data;
    return (urls as List)
        .map((j) => UploadUrl.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  /// Upload file bytes directly to S3 using http (not Dio) to avoid
  /// auth header injection issues with presigned S3 URLs.
  Future<void> uploadToS3({
    required String uploadUrl,
    required List<int> bytes,
    required String contentType,
  }) async {
    final response = await http.put(
      Uri.parse(uploadUrl),
      headers: {'Content-Type': contentType},
      body: bytes,
    );
    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('S3 upload failed: ${response.statusCode}');
    }
  }

  Future<void> confirmUpload(
    String galleryId,
    List<String> mediaIds,
  ) async {
    await _api.post(
      Endpoints.mediaConfirmUpload(galleryId),
      data: {'mediaIds': mediaIds},
    );
  }
}
