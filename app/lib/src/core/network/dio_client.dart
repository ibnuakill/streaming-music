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
      final code = e.response?.statusCode;
      final isRetryable = e.type==DioExceptionType.connectionTimeout || e.type==DioExceptionType.receiveTimeout || e.type==DioExceptionType.connectionError || (code!=null && [429,500,502,503,504].contains(code));
      if (isRetryable) {
        final opts = e.requestOptions;
        final retries = opts.extra['retries'] as int? ?? 0;
        if (retries < 2) {
          opts.extra['retries'] = retries+1;
          await Future.delayed(Duration(milliseconds: 700*(retries+1)));
          try { final r = await Dio(BaseOptions(baseUrl: AppConfig.apiBase, connectTimeout: const Duration(seconds: 15), receiveTimeout: const Duration(seconds: 30))).fetch(opts); return h.resolve(r); } catch (_) {}
        }
      }
      h.next(e);
    }));
