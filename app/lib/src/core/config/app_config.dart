import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String get apiBase => dotenv.env['API_URL'] ?? const String.fromEnvironment('API_URL', defaultValue: 'https://streaming-music-rho.vercel.app');
  static String api(String p) => '$apiBase$p';
  static String get supabaseUrl => dotenv.env['SUPABASE_URL'] ?? const String.fromEnvironment('SUPABASE_URL', defaultValue: '');
  static String get supabaseAnon => dotenv.env['SUPABASE_ANON'] ?? const String.fromEnvironment('SUPABASE_ANON', defaultValue: '');
}
