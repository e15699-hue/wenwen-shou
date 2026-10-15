import 'package:flutter/material.dart';

/// 拍照＋魔法放大鏡框題畫面
/// TODO: 串接 image_picker 拍照，canvas 框選裁切
class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  bool _hasPhoto = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F8FF),
      appBar: AppBar(
        title: const Text('📸 拍下題目'),
        backgroundColor: const Color(0xFFFF6B6B),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            child: Center(
              child: _hasPhoto
                  ? Container(
                      margin: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFFFD166), width: 4),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Center(
                        child: Text('題目預覽區\n（框選裁切 UI 佔位）',
                            textAlign: TextAlign.center),
                      ),
                    )
                  : const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_a_photo, size: 100, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('點下方按鈕拍照', style: TextStyle(fontSize: 18)),
                        SizedBox(height: 8),
                        Text('再用手指框出不會的那一題',
                            style: TextStyle(fontSize: 14, color: Colors.grey)),
                      ],
                    ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // TODO: image_picker 拍照
                      setState(() => _hasPhoto = true);
                    },
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('拍照', style: TextStyle(fontSize: 20)),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30)),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _hasPhoto
                        ? () => Navigator.pushNamed(context, '/chat')
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4ECDC4),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30)),
                    ),
                    child: const Text('🔍 辨識題目',
                        style: TextStyle(fontSize: 20)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
