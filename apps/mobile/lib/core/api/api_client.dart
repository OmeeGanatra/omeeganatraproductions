import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../auth/token_storage.dart';
import 'endpoints.dart';

class ApiClient {
  ApiClient._() {
    _dio = Dio(BaseOptions(
      baseUrl: Endpoints.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.addAll([
      _AuthInterceptor(),
      _RefreshInterceptor(_dio),
      if (kDebugMode) _LoggingInterceptor(),
    ]);
  }

  static final ApiClient instance = ApiClient._();
  late final Dio _dio;

  Dio get dio => _dio;

  // GET
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  // POST
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  // PUT
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  // DELETE
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  // Download
  Future<Response> download(
    String path,
    String savePath, {
    ProgressCallback? onReceiveProgress,
    CancelToken? cancelToken,
  }) async {
    return _dio.download(
      path,
      savePath,
      onReceiveProgress: onReceiveProgress,
      cancelToken: cancelToken,
    );
  }
}

class _AuthInterceptor extends Interceptor {
  final _tokenStorage = TokenStorage.instance;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth for login/refresh endpoints
    if (options.path.contains('/auth/login') ||
        options.path.contains('/auth/refresh') ||
        options.path.contains('/auth/verify-otp') ||
        options.path.contains('/auth/resend-otp')) {
      return handler.next(options);
    }

    final token = await _tokenStorage.getAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    return handler.next(options);
  }
}

class _RefreshInterceptor extends Interceptor {
  _RefreshInterceptor(this._dio);

  final Dio _dio;
  final _tokenStorage = TokenStorage.instance;
  bool _isRefreshing = false;

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode != 401 || _isRefreshing) {
      return handler.next(err);
    }

    // Skip refresh for auth endpoints
    if (err.requestOptions.path.contains('/auth/')) {
      return handler.next(err);
    }

    _isRefreshing = true;

    try {
      final refreshToken = await _tokenStorage.getRefreshToken();
      if (refreshToken == null) {
        _isRefreshing = false;
        return handler.next(err);
      }

      // Attempt to refresh
      final response = await _dio.post(
        Endpoints.authRefresh,
        data: {'refreshToken': refreshToken},
        options: Options(headers: {'Authorization': ''}),
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final newAccessToken = data['accessToken'] as String;
        final newRefreshToken =
            data['refreshToken'] as String? ?? refreshToken;

        await _tokenStorage.saveAccessToken(newAccessToken);
        await _tokenStorage.saveRefreshToken(newRefreshToken);

        // Retry original request with new token
        final retryOptions = err.requestOptions;
        retryOptions.headers['Authorization'] = 'Bearer $newAccessToken';

        final retryResponse = await _dio.fetch(retryOptions);
        _isRefreshing = false;
        return handler.resolve(retryResponse);
      }
    } catch (_) {
      // Refresh failed - clear tokens
      await _tokenStorage.clearTokens();
    }

    _isRefreshing = false;
    return handler.next(err);
  }
}

class _LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    debugPrint(
      '[API] ${options.method} ${options.baseUrl}${options.path}',
    );
    if (options.queryParameters.isNotEmpty) {
      debugPrint('[API] Query: ${options.queryParameters}');
    }
    return handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint(
      '[API] ${response.statusCode} ${response.requestOptions.path}',
    );
    return handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    debugPrint(
      '[API] ERROR ${err.response?.statusCode} ${err.requestOptions.path}: ${err.message}',
    );
    return handler.next(err);
  }
}
