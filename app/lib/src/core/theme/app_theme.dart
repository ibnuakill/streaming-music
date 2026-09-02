import 'package:flutter/material.dart';

class AppTheme {
  static const bg = Color(0xFF000000);
  static const card = Color(0xFF121212);
  static const green = Color(0xFF1DB954);
  static ThemeData dark = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: bg,
    primaryColor: green,
    useMaterial3: true,
    colorScheme: const ColorScheme.dark(primary: green, surface: bg),
    appBarTheme: const AppBarTheme(backgroundColor: bg, foregroundColor: Colors.white, elevation: 0),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(backgroundColor: bg, selectedItemColor: Colors.white, unselectedItemColor: Colors.grey),
  );
}
