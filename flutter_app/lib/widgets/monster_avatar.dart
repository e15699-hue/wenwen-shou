import 'package:flutter/material.dart';

/// 問問獸角色頭像
/// TODO: 換成 Rive 動畫（語音嘴型同步）
class MonsterAvatar extends StatelessWidget {
  final double size;
  const MonsterAvatar({super.key, this.size = 120});

  @override
  Widget build(BuildContext context) {
    // TODO: RiveAnimation.asset('assets/wenwen.riv')
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: const Color(0xFFFFD166),
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFFF6B6B), width: 4),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Center(
        child: Text('🦖', style: TextStyle(fontSize: size * 0.55)),
      ),
    );
  }
}
