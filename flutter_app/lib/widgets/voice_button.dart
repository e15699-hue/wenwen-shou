import 'package:flutter/material.dart';

/// 按住說話大按鈕
/// TODO: 串接 speech_to_text（裝置端免費辨識）
class VoiceButton extends StatefulWidget {
  const VoiceButton({super.key});

  @override
  State<VoiceButton> createState() => _VoiceButtonState();
}

class _VoiceButtonState extends State<VoiceButton> {
  bool _recording = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GestureDetector(
        onLongPressStart: (_) => setState(() => _recording = true),
        onLongPressEnd: (_) => setState(() => _recording = false),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 20),
          decoration: BoxDecoration(
            color: _recording ? Colors.red : const Color(0xFFFF6B6B),
            borderRadius: BorderRadius.circular(40),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.15),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Text(
            _recording ? '🎤 聽你說…放開送出' : '🎤 按住說話',
            textAlign: TextAlign.center,
            style: const TextStyle(
                fontSize: 22, color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }
}
