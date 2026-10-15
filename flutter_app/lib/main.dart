import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'screens/camera_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/parent_report_screen.dart';

void main() {
  runApp(const WenwenShouApp());
}

/// 問問獸 App 主入口
/// 導航流程：首頁 → 拍照 → 對話引導 → 家長報告
class WenwenShouApp extends StatelessWidget {
  const WenwenShouApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '問問獸',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFFF6B6B)),
        useMaterial3: true,
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const HomeScreen(),
        '/camera': (context) => const CameraScreen(),
        '/chat': (context) => const ChatScreen(),
        '/parent': (context) => const ParentReportScreen(),
      },
    );
  }
}
