import 'package:flutter/foundation.dart';

/// 語音服務（STT＋TTS）
/// TODO: 串接 speech_to_text（裝置端免費辨識）＋ flutter_tts
class SpeechService {
  /// 開始聆聽（按住說話）
  Future<void> startListening({
    required void Function(String text) onResult,
  }) async {
    // TODO: SpeechToText().listen(onResult: ...)
    debugPrint('TODO: 開始語音辨識');
  }

  /// 停止聆聽
  Future<void> stopListening() async {
    // TODO: SpeechToText().stop()
    debugPrint('TODO: 停止語音辨識');
  }

  /// 唸出文字（問問獸說話）
  Future<void> speak(String text) async {
    // TODO: FlutterTts().speak(text) with zh-TW voice
    debugPrint('TODO: 朗讀：$text');
  }

  /// 停止朗讀
  Future<void> stopSpeaking() async {
    // TODO: FlutterTts().stop()
    debugPrint('TODO: 停止朗讀');
  }
}
