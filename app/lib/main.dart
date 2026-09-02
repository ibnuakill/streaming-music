import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'src/core/theme/app_theme.dart';
import 'src/core/config/app_config.dart';
import 'src/features/home/home_screen.dart';
import 'src/features/search/search_screen.dart';
import 'src/features/library/library_screen.dart';
import 'src/features/charts/charts_screen.dart';
import 'src/features/player/player_screen.dart';
import 'src/features/browse/browse_screen.dart';
import 'src/features/auth/login_screen.dart';
import 'src/features/auth/register_screen.dart';
import 'src/features/auth/profile_screen.dart';
import 'src/core/widgets/mini_player.dart';
import 'src/features/player/audio_handler.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try { await dotenv.load(fileName: ".env"); } catch (_) {}
  if (AppConfig.supabaseUrl.isEmpty || AppConfig.supabaseAnon.isEmpty) {
    debugPrint('❌ .env missing SUPABASE_URL / SUPABASE_ANON');
  }
  await Supabase.initialize(
      url: AppConfig.supabaseUrl, anonKey: AppConfig.supabaseAnon);

  try {
    await initAudio();
    debugPrint('✅ initAudio() SUCCESS');
  } catch (e, st) {
    debugPrint('❌ initAudio() FAILED: $e');
    debugPrint('$st');
  }

  runApp(const ProviderScope(child: MuseraApp()));

  Future.delayed(const Duration(milliseconds: 500), () async {
    try {
      final status = await Permission.notification.request();
      debugPrint('🔔 Notification permission status: $status');
    } catch (e) {
      debugPrint('⚠️ Permission request error: $e');
    }
  });
}

class MuseraApp extends StatelessWidget {
  const MuseraApp({super.key});
  @override
  Widget build(BuildContext context) {
    final router = GoRouter(initialLocation: '/', routes: [
      ShellRoute(
          builder: (_, __, child) => ScaffoldWithNav(child: child),
          routes: [
            GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
            GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
            GoRoute(path: '/charts', builder: (_, __) => const ChartsScreen()),
            GoRoute(
                path: '/library', builder: (_, __) => const LibraryScreen()),
          ]),
      GoRoute(path: '/player', builder: (_, __) => const PlayerScreen()),
      GoRoute(
          path: '/browse/:id',
          builder: (_, s) => BrowseScreen(id: s.pathParameters['id']!)),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
    ]);
    return MaterialApp.router(
        routerConfig: router,
        theme: AppTheme.dark,
        debugShowCheckedModeBanner: false,
        title: 'Musera');
  }
}

class ScaffoldWithNav extends StatelessWidget {
  final Widget child;
  const ScaffoldWithNav({super.key, required this.child});
  @override
  Widget build(BuildContext context) {
    final loc = GoRouterState.of(context).uri.toString();
    int idx = 0;
    if (loc.startsWith('/search'))
      idx = 1;
    else if (loc.startsWith('/charts'))
      idx = 2;
    else if (loc.startsWith('/library')) idx = 3;
    return Scaffold(
        body: child,
        bottomNavigationBar: Column(mainAxisSize: MainAxisSize.min, children: [
          const MiniPlayer(),
          BottomNavigationBar(
              currentIndex: idx,
              onTap: (i) {
                if (i == 0)
                  context.go('/');
                else if (i == 1)
                  context.go('/search');
                else if (i == 2)
                  context.go('/charts');
                else
                  context.go('/library');
              },
              type: BottomNavigationBarType.fixed,
              backgroundColor: Colors.black,
              selectedItemColor: Colors.white,
              unselectedItemColor: Colors.grey,
              items: const [
                BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
                BottomNavigationBarItem(
                    icon: Icon(Icons.search), label: 'Search'),
                BottomNavigationBarItem(
                    icon: Icon(Icons.bar_chart), label: 'Charts'),
                BottomNavigationBarItem(
                    icon: Icon(Icons.library_music), label: 'Library'),
              ])
        ]));
  }
}
