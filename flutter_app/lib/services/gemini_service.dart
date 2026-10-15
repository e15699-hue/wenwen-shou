import 'dart:convert';
import 'package:http/http.dart' as http;

/// Gemini API 服務
/// 模型順序（輕量省錢優先）：跟網頁 PoC 一致
/// 重要：API Key 不進 App，正式版走 Supabase Edge Functions 代理
class GeminiService {
  static const List<String> models = [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.5-flash',
  ];

  /// 蘇格拉底鐵律：絕對禁止說出任何計算結果（含中間步驟）
  static const String rolePrompt = '''
你是「問問獸」，一隻溫暖、有耐心、會講台灣國小生口語的伴讀小怪獸。
鐵律：
1. 絕對禁止說出任何計算結果（包括中間步驟的答案和最終答案），違者任務失敗。小孩必須自己算出每一個數字。
2. 可以教「方法」和「步驟順序」，但每一步的數字都要讓小孩自己算。
3. 每次發言控制在 40 字以內，親切口語。
4. 只能輸出 JSON，不要輸出其他文字。
''';

  /// 呼叫 Gemini（帶 503 重試＋模型容錯）
  /// [apiKey] 僅 PoC/開發用；正式版改走後端代理
  static Future<Map<String, dynamic>> callGemini({
    required String apiKey,
    required List<Map<String, dynamic>> contents,
    required String stagePrompt,
  }) async {
    const maxRetries = 2;
    for (final model in models) {
      for (var attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
          await Future.delayed(Duration(seconds: attempt * 2));
        }
        try {
          final res = await http
              .post(
                Uri.parse(
                    'https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$apiKey'),
                headers: {'Content-Type': 'application/json'},
                body: jsonEncode({
                  'systemInstruction': {
                    'parts': [
                      {'text': '$rolePrompt\n$stagePrompt'}
                    ]
                  },
                  'contents': contents,
                  'generationConfig': {
                    'responseMimeType': 'application/json',
                    'temperature': 0.7,
                    'maxOutputTokens': 600,
                  },
                }),
              )
              .timeout(const Duration(seconds: 30));
          if (res.statusCode == 503 && attempt < maxRetries) continue;
          if (res.statusCode == 503) break; // 換下一個模型
          if (res.statusCode != 200) {
            throw Exception('API ${res.statusCode}: ${res.body.substring(0, 200)}');
          }
          final data = jsonDecode(res.body);
          final text =
              data['candidates']?[0]?['content']?['parts']?[0]?['text'] ?? '';
          final m = RegExp(r'\{[\s\S]*\}').firstMatch(text);
          if (m == null) throw Exception('BAD_JSON');
          final parsed = jsonDecode(m.group(0)!);
          return {
            'spoken_text': parsed['spoken_text'] ??
                parsed['text'] ??
                parsed['response'] ??
                '',
            'ui_choices': parsed['ui_choices'] ?? parsed['choices'] ?? [],
            'is_solved': parsed['is_solved'] == true,
            'parent_insight': parsed['parent_insight'] ?? '',
          };
        } catch (e) {
          if (attempt == maxRetries) break;
        }
      }
    }
    throw Exception('所有模型都在忙碌中，請稍後再試');
  }
}
