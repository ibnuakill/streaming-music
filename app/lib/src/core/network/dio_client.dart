import 'package:dio/dio.dart';
import '../config/app_config.dart';

final dioProvider = Dio(
  BaseOptions(
    baseUrl: AppConfig.apiBase,
    connectTimeout: const Duration(seconds: 15),
    sendTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
  ),
)..interceptors.add(InterceptorsWrapper(onError: (e, h) async {
      if (e.type == DioExceptionType.receiveTimeout || e.type == DioExceptionType.connectionTimeout) {
        final opts = e.requestOptions;
        if ((opts.extra['retries'] as int? ?? 0) < 1) {
          opts.extra['retries'] = 1;
          try { final r = await Dio(BaseOptions(baseUrl: AppConfig.apiBase, connectTimeout: const Duration(seconds: 15), receiveTimeout: const Duration(seconds: 30))).fetch(opts); return h.resolve(r); } catch (_) {}
        }
      }
      h.next(e);
    }));
