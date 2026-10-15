import 'package:flutter/material.dart';

/// 家長學情小紙條：解題統計＋卡關紀錄
/// TODO: 串接 Supabase 後端
class ParentReportScreen extends StatelessWidget {
  const ParentReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // TODO: 從後端載入真實數據
    const solved = 3;
    const stars = 9;
    const stuckPoints = ['看不懂「相差」代表減法', '乘法進位會忘記'];

    return Scaffold(
      backgroundColor: const Color(0xFFF0F7FF),
      appBar: AppBar(
        title: const Text('📋 家長學情報告'),
        backgroundColor: const Color(0xFF4A90D9),
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const Text('今日戰績',
                      style:
                          TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _stat('✅', '$solved', '解開題數'),
                      _stat('⭐', '$stars', '獲得星星'),
                      _stat('🎯', '${stuckPoints.length}', '卡關點'),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text('🎯 卡關盲點紀錄',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...stuckPoints.map((s) => Card(
                child: ListTile(
                  leading: const Icon(Icons.lightbulb_outline,
                      color: Colors.amber),
                  title: Text(s),
                  subtitle: const Text('經引導後已想通 ✓'),
                ),
              )),
          const SizedBox(height: 16),
          const Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Text(
                '💡 小提醒：寶貝今天自己解開了 3 道數學題！\n原本搞不懂「相差」的概念，經引導後已經自己想通囉！',
                style: TextStyle(fontSize: 16, height: 1.6),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _stat(String emoji, String num, String label) {
    return Column(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 32)),
        Text(num,
            style: const TextStyle(
                fontSize: 28, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(color: Colors.grey)),
      ],
    );
  }
}
