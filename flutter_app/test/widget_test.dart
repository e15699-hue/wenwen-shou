// 問問獸 App 基礎測試

import 'package:flutter_test/flutter_test.dart';

import 'package:wenwen_shou/main.dart';

void main() {
  testWidgets('App 啟動顯示問問獸首頁', (WidgetTester tester) async {
    await tester.pumpWidget(const WenwenShouApp());

    // 首頁應顯示標題與拍照按鈕
    expect(find.text('🦖 問問獸'), findsOneWidget);
    expect(find.text('📸 拍照問問題'), findsOneWidget);
  });
}
