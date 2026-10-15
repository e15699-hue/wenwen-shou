import 'package:flutter/material.dart';
import '../widgets/monster_avatar.dart';
import '../widgets/choice_buttons.dart';
import '../widgets/voice_button.dart';

/// 三關卡蘇格拉底對話引導畫面
/// TODO: 串接 gemini_service，實作狀態機
class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  int _stage = 1; // 1=讀懂題目 2=想方法 3=自己算
  final List<_Msg> _msgs = [
    _Msg(isMonster: true, text: '我看到題目了！先問你喔，題目最後想問我們什麼呢？'),
  ];
  final List<String> _choices = ['問剩下多少', '問全部多少'];

  void _onChoice(String c) {
    setState(() {
      _msgs.add(_Msg(isMonster: false, text: c));
      if (_stage < 3) {
        _stage++;
        _msgs.add(_Msg(
            isMonster: true,
            text: _stage == 2 ? '好！那你覺得要用加起來還是減掉呢？' : '太棒了！那你在紙上算算看，告訴我答案是多少？'));
      } else {
        _msgs.add(_Msg(isMonster: true, text: '🎉 答對了！你真厲害！'));
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F8FF),
      appBar: AppBar(
        title: const Text('💬 問問獸陪你解題'),
        backgroundColor: const Color(0xFFFF6B6B),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // 三關卡進度條
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: ['① 讀懂題目', '② 想方法', '③ 自己算']
                  .asMap()
                  .entries
                  .map((e) => Expanded(
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: e.key + 1 < _stage
                                ? const Color(0xFFB8E6C9)
                                : e.key + 1 == _stage
                                    ? const Color(0xFFFFD166)
                                    : Colors.grey[200],
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(e.value,
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontSize: 13)),
                        ),
                      ))
                  .toList(),
            ),
          ),
          const MonsterAvatar(size: 80),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _msgs.length,
              itemBuilder: (ctx, i) {
                final m = _msgs[i];
                return Align(
                  alignment: m.isMonster
                      ? Alignment.centerLeft
                      : Alignment.centerRight,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: m.isMonster
                          ? const Color(0xFFFFF7E6)
                          : const Color(0xFFE8F4FF),
                      border: Border.all(
                          color: m.isMonster
                              ? const Color(0xFFFFD166)
                              : const Color(0xFF90CDF4),
                          width: 2),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(m.text, style: const TextStyle(fontSize: 18)),
                  ),
                );
              },
            ),
          ),
          ChoiceButtons(choices: _choices, onTap: _onChoice),
          const VoiceButton(),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}

class _Msg {
  final bool isMonster;
  final String text;
  _Msg({required this.isMonster, required this.text});
}
